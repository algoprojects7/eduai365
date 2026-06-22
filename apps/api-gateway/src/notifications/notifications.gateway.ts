import { Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';

import { isAllowedOrigin } from '@eduai365/config';

/**
 * WebSocket gateway for real-time in-app notifications and live GPS updates.
 * Clients join school rooms via `schoolSlug` query param or `join-school` message.
 */
@WebSocketGateway({
  namespace: '/notifications',
  cors: {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      if (!origin || isAllowedOrigin(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  },
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(NotificationsGateway.name);

  @WebSocketServer()
  server!: Server;

  handleConnection(client: Socket) {
    const slug = this.resolveSchoolSlug(client);
    if (slug) {
      client.join(this.schoolRoom(slug));
      this.logger.debug(`WS joined ${this.schoolRoom(slug)}: ${client.id}`);
    } else {
      this.logger.debug(`WS connected (no school room): ${client.id}`);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`WS disconnected: ${client.id}`);
  }

  @SubscribeMessage('join-school')
  handleJoinSchool(client: Socket, payload: { slug?: string }) {
    const slug = payload?.slug?.toLowerCase();
    if (!slug) {
      return { success: false, error: 'slug is required' };
    }
    client.join(this.schoolRoom(slug));
    this.logger.debug(`WS joined ${this.schoolRoom(slug)} via message: ${client.id}`);
    return { success: true, room: this.schoolRoom(slug) };
  }

  /** Emit to `user:${userId}` room after JWT handshake (Phase 14+). */
  emitToUser(userId: string, event: string, payload: unknown) {
    this.server.to(`user:${userId}`).emit(event, payload);
  }

  /** Broadcast an event to all clients in a school room. */
  emitToSchool(slug: string, event: string, payload: unknown) {
    this.server.to(this.schoolRoom(slug)).emit(event, payload);
  }

  /** Push live GPS position updates to subscribers of `school:{slug}`. */
  emitGpsUpdate(slug: string, payload: unknown) {
    this.emitToSchool(slug, 'gps:update', payload);
  }

  private schoolRoom(slug: string): string {
    return `school:${slug.toLowerCase()}`;
  }

  private resolveSchoolSlug(client: Socket): string | undefined {
    const querySlug = client.handshake.query.schoolSlug;
    if (typeof querySlug === 'string' && querySlug.length > 0) {
      return querySlug.toLowerCase();
    }
    return undefined;
  }
}
