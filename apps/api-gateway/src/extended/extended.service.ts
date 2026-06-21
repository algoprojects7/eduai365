import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  AuthenticatedUser,
  TenantContext,
} from '@eduai365/shared-types';
import { AuditService } from '../common/audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import type {
  CheckoutAssetDto,
  CreateAssetDto,
  ListAssetCheckoutsQueryDto,
  UpdateAssetDto,
} from './dto/assets.dto';
import type {
  CreateAlumniCampaignDto,
  CreateAlumniProfileDto,
  ListAlumniQueryDto,
  UpdateAlumniCampaignDto,
  UpdateAlumniProfileDto,
} from './dto/alumni.dto';
import type {
  AssignHostelResidentDto,
  CheckoutHostelResidentDto,
  CreateHostelBlockDto,
  CreateHostelRoomDto,
  CreateVisitorLogDto,
  ListHostelResidentsQueryDto,
  UpdateHostelBlockDto,
  UpdateHostelRoomDto,
} from './dto/hostel.dto';
import type {
  AdjustInventoryStockDto,
  CreateInventoryItemDto,
  UpdateConsumableStockDto,
  UpdateInventoryItemDto,
} from './dto/inventory.dto';

const MESS_MENU = [
  { day: 'Monday', breakfast: 'Poha, Milk, Banana', lunch: 'Dal, Rice, Roti, Seasonal Vegetable', dinner: 'Khichdi, Curd, Pickle' },
  { day: 'Tuesday', breakfast: 'Upma, Tea, Boiled Egg', lunch: 'Rajma, Rice, Roti, Salad', dinner: 'Paneer Curry, Roti, Rice' },
  { day: 'Wednesday', breakfast: 'Paratha, Curd, Tea', lunch: 'Chole, Rice, Roti, Raita', dinner: 'Vegetable Pulao, Dal, Papad' },
  { day: 'Thursday', breakfast: 'Idli, Sambar, Chutney', lunch: 'Kadhi, Rice, Roti, Aloo Sabzi', dinner: 'Mixed Veg, Roti, Rice, Sweet' },
  { day: 'Friday', breakfast: 'Bread, Butter, Jam, Milk', lunch: 'Sambar Rice, Papad, Pickle', dinner: 'Fried Rice, Manchurian, Soup' },
  { day: 'Saturday', breakfast: 'Dosa, Chutney, Sambar', lunch: 'Biryani, Raita, Salad', dinner: 'Pasta, Garlic Bread, Juice' },
  { day: 'Sunday', breakfast: 'Poori, Aloo Sabzi, Halwa', lunch: 'Special Thali — Paneer, Dal, Rice, Roti', dinner: 'Light Dinner — Soup, Sandwich, Fruit' },
];

interface VisitorRecord {
  id: string;
  visitorName: string;
  studentId: string;
  studentName: string;
  relation: string;
  purpose: string;
  idProof?: string;
  checkIn: string;
  checkOut?: string | null;
}

@Injectable()
export class ExtendedService {
  private readonly visitorsBySchool = new Map<string, VisitorRecord[]>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  // ─── Helpers ───────────────────────────────────────────────────────────────

  private async requireStudent(tenant: TenantContext, studentId: string) {
    const student = await this.prisma.client.student.findFirst({
      where: { id: studentId, schoolId: tenant.schoolId },
    });
    if (!student) {
      throw new NotFoundException('Student not found');
    }
    return student;
  }

  private async requireEmployee(tenant: TenantContext, employeeId: string) {
    const employee = await this.prisma.client.user.findFirst({
      where: { id: employeeId, schoolId: tenant.schoolId },
    });
    if (!employee) {
      throw new NotFoundException('Employee not found');
    }
    return employee;
  }

  private async requireHostelBlock(tenant: TenantContext, blockId: string) {
    const block = await this.prisma.client.hostelBlock.findFirst({
      where: { id: blockId, schoolId: tenant.schoolId },
    });
    if (!block) {
      throw new NotFoundException('Hostel block not found');
    }
    return block;
  }

  private async requireHostelRoom(tenant: TenantContext, roomId: string) {
    const room = await this.prisma.client.hostelRoom.findFirst({
      where: {
        id: roomId,
        block: { schoolId: tenant.schoolId },
      },
      include: { block: true },
    });
    if (!room) {
      throw new NotFoundException('Hostel room not found');
    }
    return room;
  }

  private async countActiveResidents(roomId: string): Promise<number> {
    return this.prisma.client.hostelResident.count({
      where: { roomId, checkOut: null },
    });
  }

  // ─── Assets ────────────────────────────────────────────────────────────────

  async listAssets(tenant: TenantContext): Promise<unknown> {
    return this.prisma.client.asset.findMany({
      where: { schoolId: tenant.schoolId },
      include: {
        checkouts: {
          where: { returnedAt: null },
          take: 1,
          include: {
            employee: { select: { id: true, firstName: true, lastName: true, email: true } },
          },
        },
      },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });
  }

  async getAsset(tenant: TenantContext, id: string): Promise<unknown> {
    const asset = await this.prisma.client.asset.findFirst({
      where: { id, schoolId: tenant.schoolId },
      include: {
        checkouts: {
          orderBy: { checkedOutAt: 'desc' },
          include: {
            employee: { select: { id: true, firstName: true, lastName: true, email: true } },
          },
        },
      },
    });
    if (!asset) {
      throw new NotFoundException('Asset not found');
    }
    return asset;
  }

  async createAsset(
    tenant: TenantContext,
    dto: CreateAssetDto,
    user: AuthenticatedUser,
  ): Promise<unknown> {
    const record = await this.prisma.client.asset.create({
      data: {
        schoolId: tenant.schoolId,
        name: dto.name,
        category: dto.category,
        serialNo: dto.serialNo,
        qrCode: dto.qrCode,
        location: dto.location,
        purchaseDate: dto.purchaseDate ? new Date(dto.purchaseDate) : undefined,
        value: dto.value,
        depreciationRate: dto.depreciationRate,
        status: dto.status ?? 'AVAILABLE',
      },
    });

    await this.audit.log({
      schoolId: tenant.schoolId,
      userId: user.id,
      action: 'CREATE',
      entity: 'Asset',
      entityId: record.id,
    });

    return record;
  }

  async updateAsset(
    tenant: TenantContext,
    id: string,
    dto: UpdateAssetDto,
    user: AuthenticatedUser,
  ): Promise<unknown> {
    const existing = await this.prisma.client.asset.findFirst({
      where: { id, schoolId: tenant.schoolId },
    });
    if (!existing) {
      throw new NotFoundException('Asset not found');
    }

    const record = await this.prisma.client.asset.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.category !== undefined ? { category: dto.category } : {}),
        ...(dto.serialNo !== undefined ? { serialNo: dto.serialNo } : {}),
        ...(dto.qrCode !== undefined ? { qrCode: dto.qrCode } : {}),
        ...(dto.location !== undefined ? { location: dto.location } : {}),
        ...(dto.purchaseDate !== undefined ? { purchaseDate: new Date(dto.purchaseDate) } : {}),
        ...(dto.value !== undefined ? { value: dto.value } : {}),
        ...(dto.depreciationRate !== undefined ? { depreciationRate: dto.depreciationRate } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
      },
    });

    await this.audit.log({
      schoolId: tenant.schoolId,
      userId: user.id,
      action: 'UPDATE',
      entity: 'Asset',
      entityId: record.id,
    });

    return record;
  }

  async deleteAsset(
    tenant: TenantContext,
    id: string,
    user: AuthenticatedUser,
  ): Promise<unknown> {
    const existing = await this.prisma.client.asset.findFirst({
      where: { id, schoolId: tenant.schoolId },
    });
    if (!existing) {
      throw new NotFoundException('Asset not found');
    }

    const activeCheckout = await this.prisma.client.assetCheckout.findFirst({
      where: { assetId: id, returnedAt: null },
    });
    if (activeCheckout) {
      throw new BadRequestException('Cannot delete asset with active checkout');
    }

    await this.prisma.client.asset.delete({ where: { id } });

    await this.audit.log({
      schoolId: tenant.schoolId,
      userId: user.id,
      action: 'DELETE',
      entity: 'Asset',
      entityId: id,
    });

    return { id, deleted: true };
  }

  async listAssetCheckouts(
    tenant: TenantContext,
    query: ListAssetCheckoutsQueryDto,
  ): Promise<unknown> {
    return this.prisma.client.assetCheckout.findMany({
      where: {
        ...(query.assetId ? { assetId: query.assetId } : {}),
        ...(query.employeeId ? { employeeId: query.employeeId } : {}),
        asset: { schoolId: tenant.schoolId },
      },
      include: {
        asset: { select: { id: true, name: true, serialNo: true } },
        employee: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
      orderBy: { checkedOutAt: 'desc' },
    });
  }

  async checkoutAsset(
    tenant: TenantContext,
    assetId: string,
    dto: CheckoutAssetDto,
    user: AuthenticatedUser,
  ): Promise<unknown> {
    const asset = await this.prisma.client.asset.findFirst({
      where: { id: assetId, schoolId: tenant.schoolId },
    });
    if (!asset) {
      throw new NotFoundException('Asset not found');
    }
    if (asset.status === 'CHECKED_OUT') {
      throw new BadRequestException('Asset is already checked out');
    }
    if (asset.status === 'RETIRED' || asset.status === 'MAINTENANCE') {
      throw new BadRequestException('Asset is not available for checkout');
    }

    await this.requireEmployee(tenant, dto.employeeId);

    const checkout = await this.prisma.client.$transaction(async (tx) => {
      const record = await tx.assetCheckout.create({
        data: {
          assetId,
          employeeId: dto.employeeId,
        },
        include: {
          employee: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      });
      await tx.asset.update({
        where: { id: assetId },
        data: { status: 'CHECKED_OUT' },
      });
      return record;
    });

    await this.audit.log({
      schoolId: tenant.schoolId,
      userId: user.id,
      action: 'CHECKOUT',
      entity: 'Asset',
      entityId: assetId,
    });

    return checkout;
  }

  async returnAsset(
    tenant: TenantContext,
    checkoutId: string,
    user: AuthenticatedUser,
  ): Promise<unknown> {
    const checkout = await this.prisma.client.assetCheckout.findFirst({
      where: {
        id: checkoutId,
        returnedAt: null,
        asset: { schoolId: tenant.schoolId },
      },
    });
    if (!checkout) {
      throw new NotFoundException('Active checkout not found');
    }

    const record = await this.prisma.client.$transaction(async (tx) => {
      const updated = await tx.assetCheckout.update({
        where: { id: checkoutId },
        data: { returnedAt: new Date() },
        include: {
          asset: { select: { id: true, name: true } },
          employee: { select: { id: true, firstName: true, lastName: true } },
        },
      });
      await tx.asset.update({
        where: { id: checkout.assetId },
        data: { status: 'AVAILABLE' },
      });
      return updated;
    });

    await this.audit.log({
      schoolId: tenant.schoolId,
      userId: user.id,
      action: 'RETURN',
      entity: 'AssetCheckout',
      entityId: checkoutId,
    });

    return record;
  }

  // ─── Alumni ──────────────────────────────────────────────────────────────────

  async listAlumniProfiles(
    tenant: TenantContext,
    query: ListAlumniQueryDto,
  ): Promise<unknown> {
    return this.prisma.client.alumniProfile.findMany({
      where: {
        schoolId: tenant.schoolId,
        ...(query.batchYear !== undefined ? { batchYear: query.batchYear } : {}),
      },
      orderBy: [{ batchYear: 'desc' }, { name: 'asc' }],
    });
  }

  async getAlumniProfile(tenant: TenantContext, id: string): Promise<unknown> {
    const profile = await this.prisma.client.alumniProfile.findFirst({
      where: { id, schoolId: tenant.schoolId },
    });
    if (!profile) {
      throw new NotFoundException('Alumni profile not found');
    }
    return profile;
  }

  async createAlumniProfile(
    tenant: TenantContext,
    dto: CreateAlumniProfileDto,
    user: AuthenticatedUser,
  ): Promise<unknown> {
    const record = await this.prisma.client.alumniProfile.create({
      data: {
        schoolId: tenant.schoolId,
        name: dto.name,
        batchYear: dto.batchYear,
        profession: dto.profession,
        email: dto.email,
        phone: dto.phone,
        city: dto.city,
        country: dto.country,
        linkedin: dto.linkedin,
      },
    });

    await this.audit.log({
      schoolId: tenant.schoolId,
      userId: user.id,
      action: 'CREATE',
      entity: 'AlumniProfile',
      entityId: record.id,
    });

    return record;
  }

  async updateAlumniProfile(
    tenant: TenantContext,
    id: string,
    dto: UpdateAlumniProfileDto,
    user: AuthenticatedUser,
  ): Promise<unknown> {
    const existing = await this.prisma.client.alumniProfile.findFirst({
      where: { id, schoolId: tenant.schoolId },
    });
    if (!existing) {
      throw new NotFoundException('Alumni profile not found');
    }

    const record = await this.prisma.client.alumniProfile.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.batchYear !== undefined ? { batchYear: dto.batchYear } : {}),
        ...(dto.profession !== undefined ? { profession: dto.profession } : {}),
        ...(dto.email !== undefined ? { email: dto.email } : {}),
        ...(dto.phone !== undefined ? { phone: dto.phone } : {}),
        ...(dto.city !== undefined ? { city: dto.city } : {}),
        ...(dto.country !== undefined ? { country: dto.country } : {}),
        ...(dto.linkedin !== undefined ? { linkedin: dto.linkedin } : {}),
      },
    });

    await this.audit.log({
      schoolId: tenant.schoolId,
      userId: user.id,
      action: 'UPDATE',
      entity: 'AlumniProfile',
      entityId: record.id,
    });

    return record;
  }

  async deleteAlumniProfile(
    tenant: TenantContext,
    id: string,
    user: AuthenticatedUser,
  ): Promise<unknown> {
    const existing = await this.prisma.client.alumniProfile.findFirst({
      where: { id, schoolId: tenant.schoolId },
    });
    if (!existing) {
      throw new NotFoundException('Alumni profile not found');
    }

    await this.prisma.client.alumniProfile.delete({ where: { id } });

    await this.audit.log({
      schoolId: tenant.schoolId,
      userId: user.id,
      action: 'DELETE',
      entity: 'AlumniProfile',
      entityId: id,
    });

    return { id, deleted: true };
  }

  async listAlumniCampaigns(tenant: TenantContext): Promise<unknown> {
    return this.prisma.client.alumniCampaign.findMany({
      where: { schoolId: tenant.schoolId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAlumniCampaign(tenant: TenantContext, id: string): Promise<unknown> {
    const campaign = await this.prisma.client.alumniCampaign.findFirst({
      where: { id, schoolId: tenant.schoolId },
    });
    if (!campaign) {
      throw new NotFoundException('Alumni campaign not found');
    }
    return campaign;
  }

  async createAlumniCampaign(
    tenant: TenantContext,
    dto: CreateAlumniCampaignDto,
    user: AuthenticatedUser,
  ): Promise<unknown> {
    const record = await this.prisma.client.alumniCampaign.create({
      data: {
        schoolId: tenant.schoolId,
        title: dto.title,
        goal: dto.goal,
        status: dto.status ?? 'DRAFT',
      },
    });

    await this.audit.log({
      schoolId: tenant.schoolId,
      userId: user.id,
      action: 'CREATE',
      entity: 'AlumniCampaign',
      entityId: record.id,
    });

    return record;
  }

  async updateAlumniCampaign(
    tenant: TenantContext,
    id: string,
    dto: UpdateAlumniCampaignDto,
    user: AuthenticatedUser,
  ): Promise<unknown> {
    const existing = await this.prisma.client.alumniCampaign.findFirst({
      where: { id, schoolId: tenant.schoolId },
    });
    if (!existing) {
      throw new NotFoundException('Alumni campaign not found');
    }

    const record = await this.prisma.client.alumniCampaign.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.goal !== undefined ? { goal: dto.goal } : {}),
        ...(dto.raised !== undefined ? { raised: dto.raised } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
      },
    });

    await this.audit.log({
      schoolId: tenant.schoolId,
      userId: user.id,
      action: 'UPDATE',
      entity: 'AlumniCampaign',
      entityId: record.id,
    });

    return record;
  }

  // ─── Hostel ──────────────────────────────────────────────────────────────────

  async listHostelBlocks(tenant: TenantContext): Promise<unknown> {
    return this.prisma.client.hostelBlock.findMany({
      where: { schoolId: tenant.schoolId },
      include: {
        rooms: {
          include: {
            _count: { select: { residents: { where: { checkOut: null } } } },
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async createHostelBlock(
    tenant: TenantContext,
    dto: CreateHostelBlockDto,
    user: AuthenticatedUser,
  ): Promise<unknown> {
    const record = await this.prisma.client.hostelBlock.create({
      data: {
        schoolId: tenant.schoolId,
        name: dto.name,
        code: dto.code,
      },
    });

    await this.audit.log({
      schoolId: tenant.schoolId,
      userId: user.id,
      action: 'CREATE',
      entity: 'HostelBlock',
      entityId: record.id,
    });

    return record;
  }

  async updateHostelBlock(
    tenant: TenantContext,
    id: string,
    dto: UpdateHostelBlockDto,
    user: AuthenticatedUser,
  ): Promise<unknown> {
    await this.requireHostelBlock(tenant, id);

    const record = await this.prisma.client.hostelBlock.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.code !== undefined ? { code: dto.code } : {}),
      },
    });

    await this.audit.log({
      schoolId: tenant.schoolId,
      userId: user.id,
      action: 'UPDATE',
      entity: 'HostelBlock',
      entityId: record.id,
    });

    return record;
  }

  async deleteHostelBlock(
    tenant: TenantContext,
    id: string,
    user: AuthenticatedUser,
  ): Promise<unknown> {
    await this.requireHostelBlock(tenant, id);

    const activeResidents = await this.prisma.client.hostelResident.count({
      where: {
        checkOut: null,
        room: { blockId: id },
      },
    });
    if (activeResidents > 0) {
      throw new BadRequestException('Cannot delete block with active residents');
    }

    await this.prisma.client.hostelBlock.delete({ where: { id } });

    await this.audit.log({
      schoolId: tenant.schoolId,
      userId: user.id,
      action: 'DELETE',
      entity: 'HostelBlock',
      entityId: id,
    });

    return { id, deleted: true };
  }

  async listHostelRooms(tenant: TenantContext, blockId: string): Promise<unknown> {
    await this.requireHostelBlock(tenant, blockId);

    return this.prisma.client.hostelRoom.findMany({
      where: { blockId },
      include: {
        _count: { select: { residents: { where: { checkOut: null } } } },
      },
      orderBy: [{ floor: 'asc' }, { roomNumber: 'asc' }],
    });
  }

  async createHostelRoom(
    tenant: TenantContext,
    blockId: string,
    dto: CreateHostelRoomDto,
    user: AuthenticatedUser,
  ): Promise<unknown> {
    await this.requireHostelBlock(tenant, blockId);

    const record = await this.prisma.client.hostelRoom.create({
      data: {
        blockId,
        roomNumber: dto.roomNumber,
        capacity: dto.capacity,
        floor: dto.floor,
      },
    });

    await this.audit.log({
      schoolId: tenant.schoolId,
      userId: user.id,
      action: 'CREATE',
      entity: 'HostelRoom',
      entityId: record.id,
    });

    return record;
  }

  async updateHostelRoom(
    tenant: TenantContext,
    id: string,
    dto: UpdateHostelRoomDto,
    user: AuthenticatedUser,
  ): Promise<unknown> {
    const room = await this.requireHostelRoom(tenant, id);
    const occupied = await this.countActiveResidents(id);

    const capacity = dto.capacity ?? room.capacity;
    if (capacity < occupied) {
      throw new BadRequestException('Capacity cannot be less than current occupancy');
    }

    const record = await this.prisma.client.hostelRoom.update({
      where: { id },
      data: {
        ...(dto.roomNumber !== undefined ? { roomNumber: dto.roomNumber } : {}),
        ...(dto.capacity !== undefined ? { capacity: dto.capacity } : {}),
        ...(dto.floor !== undefined ? { floor: dto.floor } : {}),
      },
    });

    await this.audit.log({
      schoolId: tenant.schoolId,
      userId: user.id,
      action: 'UPDATE',
      entity: 'HostelRoom',
      entityId: record.id,
    });

    return record;
  }

  async deleteHostelRoom(
    tenant: TenantContext,
    id: string,
    user: AuthenticatedUser,
  ): Promise<unknown> {
    await this.requireHostelRoom(tenant, id);

    const activeResidents = await this.countActiveResidents(id);
    if (activeResidents > 0) {
      throw new BadRequestException('Cannot delete room with active residents');
    }

    await this.prisma.client.hostelRoom.delete({ where: { id } });

    await this.audit.log({
      schoolId: tenant.schoolId,
      userId: user.id,
      action: 'DELETE',
      entity: 'HostelRoom',
      entityId: id,
    });

    return { id, deleted: true };
  }

  async listHostelResidents(
    tenant: TenantContext,
    query: ListHostelResidentsQueryDto,
  ): Promise<unknown> {
    const activeOnly = query.activeOnly !== 'false';

    return this.prisma.client.hostelResident.findMany({
      where: {
        ...(activeOnly ? { checkOut: null } : {}),
        ...(query.roomId ? { roomId: query.roomId } : {}),
        ...(query.blockId ? { room: { blockId: query.blockId } } : {}),
        student: { schoolId: tenant.schoolId },
      },
      include: {
        student: {
          select: {
            id: true,
            admissionNo: true,
            firstName: true,
            lastName: true,
          },
        },
        room: {
          include: { block: { select: { id: true, name: true, code: true } } },
        },
      },
      orderBy: { checkIn: 'desc' },
    });
  }

  async assignHostelResident(
    tenant: TenantContext,
    dto: AssignHostelResidentDto,
    user: AuthenticatedUser,
  ): Promise<unknown> {
    await this.requireStudent(tenant, dto.studentId);
    const room = await this.requireHostelRoom(tenant, dto.roomId);

    const existingActive = await this.prisma.client.hostelResident.findFirst({
      where: { studentId: dto.studentId, checkOut: null },
    });
    if (existingActive) {
      throw new BadRequestException('Student already has an active hostel assignment');
    }

    const occupied = await this.countActiveResidents(dto.roomId);
    if (occupied >= room.capacity) {
      throw new BadRequestException('Room is at full capacity');
    }

    const record = await this.prisma.client.hostelResident.create({
      data: {
        studentId: dto.studentId,
        roomId: dto.roomId,
        checkIn: new Date(dto.checkIn),
      },
      include: {
        student: {
          select: { id: true, admissionNo: true, firstName: true, lastName: true },
        },
        room: { include: { block: true } },
      },
    });

    await this.audit.log({
      schoolId: tenant.schoolId,
      userId: user.id,
      action: 'ASSIGN',
      entity: 'HostelResident',
      entityId: record.id,
    });

    return record;
  }

  async checkoutHostelResident(
    tenant: TenantContext,
    id: string,
    dto: CheckoutHostelResidentDto,
    user: AuthenticatedUser,
  ): Promise<unknown> {
    const resident = await this.prisma.client.hostelResident.findFirst({
      where: {
        id,
        checkOut: null,
        student: { schoolId: tenant.schoolId },
      },
    });
    if (!resident) {
      throw new NotFoundException('Active hostel resident not found');
    }

    const record = await this.prisma.client.hostelResident.update({
      where: { id },
      data: { checkOut: new Date(dto.checkOut) },
      include: {
        student: {
          select: { id: true, admissionNo: true, firstName: true, lastName: true },
        },
        room: { include: { block: true } },
      },
    });

    await this.audit.log({
      schoolId: tenant.schoolId,
      userId: user.id,
      action: 'CHECKOUT',
      entity: 'HostelResident',
      entityId: id,
    });

    return record;
  }

  // ─── Inventory ───────────────────────────────────────────────────────────────

  async listInventoryItems(tenant: TenantContext): Promise<unknown> {
    const items = await this.prisma.client.inventoryItem.findMany({
      where: { schoolId: tenant.schoolId },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });

    return items.map((item) => ({
      ...item,
      lowStock: item.quantity <= item.reorderLevel,
    }));
  }

  async getInventoryItem(tenant: TenantContext, id: string): Promise<unknown> {
    const item = await this.prisma.client.inventoryItem.findFirst({
      where: { id, schoolId: tenant.schoolId },
    });
    if (!item) {
      throw new NotFoundException('Inventory item not found');
    }
    return { ...item, lowStock: item.quantity <= item.reorderLevel };
  }

  async createInventoryItem(
    tenant: TenantContext,
    dto: CreateInventoryItemDto,
    user: AuthenticatedUser,
  ): Promise<unknown> {
    const record = await this.prisma.client.inventoryItem.create({
      data: {
        schoolId: tenant.schoolId,
        name: dto.name,
        sku: dto.sku,
        category: dto.category,
        quantity: dto.quantity,
        reorderLevel: dto.reorderLevel,
      },
    });

    await this.audit.log({
      schoolId: tenant.schoolId,
      userId: user.id,
      action: 'CREATE',
      entity: 'InventoryItem',
      entityId: record.id,
    });

    return record;
  }

  async updateInventoryItem(
    tenant: TenantContext,
    id: string,
    dto: UpdateInventoryItemDto,
    user: AuthenticatedUser,
  ): Promise<unknown> {
    const existing = await this.prisma.client.inventoryItem.findFirst({
      where: { id, schoolId: tenant.schoolId },
    });
    if (!existing) {
      throw new NotFoundException('Inventory item not found');
    }

    const record = await this.prisma.client.inventoryItem.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.sku !== undefined ? { sku: dto.sku } : {}),
        ...(dto.category !== undefined ? { category: dto.category } : {}),
        ...(dto.quantity !== undefined ? { quantity: dto.quantity } : {}),
        ...(dto.reorderLevel !== undefined ? { reorderLevel: dto.reorderLevel } : {}),
      },
    });

    await this.audit.log({
      schoolId: tenant.schoolId,
      userId: user.id,
      action: 'UPDATE',
      entity: 'InventoryItem',
      entityId: record.id,
    });

    return { ...record, lowStock: record.quantity <= record.reorderLevel };
  }

  async adjustInventoryStock(
    tenant: TenantContext,
    id: string,
    dto: AdjustInventoryStockDto,
    user: AuthenticatedUser,
  ): Promise<unknown> {
    const existing = await this.prisma.client.inventoryItem.findFirst({
      where: { id, schoolId: tenant.schoolId },
    });
    if (!existing) {
      throw new NotFoundException('Inventory item not found');
    }

    const newQuantity = existing.quantity + dto.delta;
    if (newQuantity < 0) {
      throw new BadRequestException('Insufficient stock for adjustment');
    }

    const record = await this.prisma.client.inventoryItem.update({
      where: { id },
      data: { quantity: newQuantity },
    });

    await this.audit.log({
      schoolId: tenant.schoolId,
      userId: user.id,
      action: 'ADJUST_STOCK',
      entity: 'InventoryItem',
      entityId: id,
      metadata: { delta: dto.delta, previousQuantity: existing.quantity },
    });

    return { ...record, lowStock: record.quantity <= record.reorderLevel };
  }

  async deleteInventoryItem(
    tenant: TenantContext,
    id: string,
    user: AuthenticatedUser,
  ): Promise<unknown> {
    const existing = await this.prisma.client.inventoryItem.findFirst({
      where: { id, schoolId: tenant.schoolId },
    });
    if (!existing) {
      throw new NotFoundException('Inventory item not found');
    }

    await this.prisma.client.inventoryItem.delete({ where: { id } });

    await this.audit.log({
      schoolId: tenant.schoolId,
      userId: user.id,
      action: 'DELETE',
      entity: 'InventoryItem',
      entityId: id,
    });

    return { id, deleted: true };
  }

  // ─── Hostel UI (stats, mess mock, visitor log, fees mock) ─────────────────

  private getVisitors(schoolId: string): VisitorRecord[] {
    if (!this.visitorsBySchool.has(schoolId)) {
      this.visitorsBySchool.set(schoolId, []);
    }
    return this.visitorsBySchool.get(schoolId)!;
  }

  async getHostelStats(tenant: TenantContext): Promise<unknown> {
    const blocks = await this.prisma.client.hostelBlock.findMany({
      where: { schoolId: tenant.schoolId },
      include: {
        rooms: {
          include: {
            _count: { select: { residents: { where: { checkOut: null } } } },
          },
        },
      },
    });

    let totalBeds = 0;
    let occupiedBeds = 0;
    for (const block of blocks) {
      for (const room of block.rooms) {
        totalBeds += room.capacity;
        occupiedBeds += room._count.residents;
      }
    }

    const today = new Date().toISOString().slice(0, 10);
    const visitorsToday = this.getVisitors(tenant.schoolId).filter((v) =>
      v.checkIn.startsWith(today),
    ).length;

    const fees = await this.listHostelFees(tenant);
    const pendingFees = (fees as Array<{ status: string }>).filter(
      (f) => f.status !== 'PAID',
    ).length;

    return {
      totalRooms: blocks.reduce((sum, b) => sum + b.rooms.length, 0),
      totalBeds,
      occupiedBeds,
      availableBeds: totalBeds - occupiedBeds,
      occupancyRate: totalBeds ? Math.round((occupiedBeds / totalBeds) * 100) : 0,
      visitorsToday,
      pendingFees,
    };
  }

  async getHostelRoomsOverview(tenant: TenantContext): Promise<unknown> {
    const blocks = await this.prisma.client.hostelBlock.findMany({
      where: { schoolId: tenant.schoolId },
      include: {
        rooms: {
          include: {
            residents: {
              where: { checkOut: null },
              include: {
                student: {
                  select: {
                    id: true,
                    admissionNo: true,
                    firstName: true,
                    lastName: true,
                    class: { select: { name: true } },
                  },
                },
              },
            },
          },
          orderBy: [{ floor: 'asc' }, { roomNumber: 'asc' }],
        },
      },
      orderBy: { name: 'asc' },
    });

    return blocks.flatMap((block) =>
      block.rooms.map((room) => ({
        id: room.id,
        block: block.code,
        roomNo: room.roomNumber,
        floor: room.floor ?? 0,
        capacity: room.capacity,
        occupied: room.residents.length,
        available: room.capacity - room.residents.length,
        type: 'NON_AC' as const,
        residents: room.residents.map((r) => ({
          id: r.student.id,
          name: `${r.student.firstName} ${r.student.lastName}`.trim(),
          admissionNo: r.student.admissionNo,
          className: r.student.class?.name ?? '—',
        })),
      })),
    );
  }

  async getMessMenu(): Promise<unknown> {
    return MESS_MENU;
  }

  async listVisitors(tenant: TenantContext): Promise<unknown> {
    return this.getVisitors(tenant.schoolId).slice().reverse();
  }

  async createVisitor(
    tenant: TenantContext,
    dto: CreateVisitorLogDto,
    user: AuthenticatedUser,
  ): Promise<unknown> {
    const student = await this.requireStudent(tenant, dto.studentId);
    const record: VisitorRecord = {
      id: `v-${Date.now()}`,
      visitorName: dto.visitorName,
      studentId: student.id,
      studentName: `${student.firstName} ${student.lastName}`.trim(),
      relation: dto.relation,
      purpose: dto.purpose,
      idProof: dto.idProof,
      checkIn: new Date().toISOString(),
      checkOut: null,
    };
    this.getVisitors(tenant.schoolId).unshift(record);

    await this.audit.log({
      schoolId: tenant.schoolId,
      userId: user.id,
      action: 'CREATE',
      entity: 'HostelVisitor',
      entityId: record.id,
    });

    return record;
  }

  async checkoutVisitor(
    tenant: TenantContext,
    visitorId: string,
    user: AuthenticatedUser,
  ): Promise<unknown> {
    const visitors = this.getVisitors(tenant.schoolId);
    const visitor = visitors.find((v) => v.id === visitorId);
    if (!visitor) {
      throw new NotFoundException('Visitor log not found');
    }
    if (visitor.checkOut) {
      throw new BadRequestException('Visitor already checked out');
    }
    visitor.checkOut = new Date().toISOString();

    await this.audit.log({
      schoolId: tenant.schoolId,
      userId: user.id,
      action: 'UPDATE',
      entity: 'HostelVisitor',
      entityId: visitorId,
    });

    return visitor;
  }

  async listHostelFees(tenant: TenantContext): Promise<unknown> {
    const residents = await this.prisma.client.hostelResident.findMany({
      where: { checkOut: null, student: { schoolId: tenant.schoolId } },
      include: {
        student: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
      take: 12,
      orderBy: { checkIn: 'desc' },
    });

    if (!residents.length) {
      return [
        { id: 'hf-demo-1', studentId: 'demo-1', studentName: 'Arjun Mehta', term: 'Term 1 — 2026-27', amount: 18000, paid: 18000, dueDate: '2026-07-15', status: 'PAID' },
        { id: 'hf-demo-2', studentId: 'demo-2', studentName: 'Priya Sharma', term: 'Term 1 — 2026-27', amount: 18000, paid: 9000, dueDate: '2026-07-15', status: 'PARTIAL' },
        { id: 'hf-demo-3', studentId: 'demo-3', studentName: 'Rahul Das', term: 'Term 1 — 2026-27', amount: 18000, paid: 0, dueDate: '2026-06-01', status: 'OVERDUE' },
      ];
    }

    return residents.map((resident, index) => {
      const amount = 18000;
      const paid = index % 3 === 0 ? amount : index % 3 === 1 ? 9000 : 0;
      const status =
        paid >= amount ? 'PAID' : paid > 0 ? 'PARTIAL' : index % 4 === 3 ? 'OVERDUE' : 'PENDING';
      return {
        id: `hf-${resident.id}`,
        studentId: resident.student.id,
        studentName: `${resident.student.firstName} ${resident.student.lastName}`.trim(),
        term: 'Term 1 — 2026-27',
        amount,
        paid,
        dueDate: '2026-07-15',
        status,
      };
    });
  }

  // ─── Inventory UI (stats, consumables, reorder alerts) ────────────────────

  private mapStockStatus(quantity: number, reorderLevel: number): 'OK' | 'LOW' | 'OUT' {
    if (quantity === 0) return 'OUT';
    if (quantity <= reorderLevel) return 'LOW';
    return 'OK';
  }

  async getInventoryStats(tenant: TenantContext): Promise<unknown> {
    const items = await this.prisma.client.inventoryItem.findMany({
      where: { schoolId: tenant.schoolId },
    });
    const lowStock = items.filter((i) => i.quantity > 0 && i.quantity <= i.reorderLevel).length;
    const outOfStock = items.filter((i) => i.quantity === 0).length;

    return {
      totalItems: items.length,
      lowStock,
      outOfStock,
      reorderAlerts: lowStock + outOfStock,
      categories: new Set(items.map((i) => i.category)).size,
    };
  }

  async listConsumables(tenant: TenantContext): Promise<unknown> {
    const items = await this.prisma.client.inventoryItem.findMany({
      where: { schoolId: tenant.schoolId },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });

    return items.map((item) => ({
      id: item.id,
      name: item.name,
      category: item.category,
      unit: 'unit',
      stock: item.quantity,
      reorderLevel: item.reorderLevel,
      lastRestocked: item.updatedAt.toISOString().slice(0, 10),
      supplier: 'Campus Store',
      stockStatus: this.mapStockStatus(item.quantity, item.reorderLevel),
    }));
  }

  async updateConsumableStock(
    tenant: TenantContext,
    itemId: string,
    dto: UpdateConsumableStockDto,
    user: AuthenticatedUser,
  ): Promise<unknown> {
    const existing = await this.prisma.client.inventoryItem.findFirst({
      where: { id: itemId, schoolId: tenant.schoolId },
    });
    if (!existing) {
      throw new NotFoundException('Item not found');
    }

    const record = await this.prisma.client.inventoryItem.update({
      where: { id: itemId },
      data: {
        quantity: dto.stock,
        ...(dto.reorderLevel !== undefined ? { reorderLevel: dto.reorderLevel } : {}),
      },
    });

    await this.audit.log({
      schoolId: tenant.schoolId,
      userId: user.id,
      action: 'UPDATE',
      entity: 'InventoryItem',
      entityId: itemId,
      metadata: { stock: dto.stock },
    });

    return {
      id: record.id,
      name: record.name,
      category: record.category,
      unit: 'unit',
      stock: record.quantity,
      reorderLevel: record.reorderLevel,
      lastRestocked: record.updatedAt.toISOString().slice(0, 10),
      supplier: 'Campus Store',
      stockStatus: this.mapStockStatus(record.quantity, record.reorderLevel),
    };
  }

  async listReorderAlerts(tenant: TenantContext): Promise<unknown> {
    const items = await this.prisma.client.inventoryItem.findMany({
      where: { schoolId: tenant.schoolId },
      orderBy: { quantity: 'asc' },
    });

    return items
      .filter((item) => item.quantity <= item.reorderLevel)
      .map((item) => ({
        id: `alert-${item.id}`,
        itemId: item.id,
        itemName: item.name,
        category: item.category,
        currentStock: item.quantity,
        reorderLevel: item.reorderLevel,
        unit: 'unit',
        supplier: 'Campus Store',
        severity: item.quantity === 0 ? 'CRITICAL' : 'WARNING',
      }))
      .sort((a, b) => a.currentStock - b.currentStock);
  }
}
