import { Injectable, Logger } from '@nestjs/common';

interface OllamaChatResponse {
  message?: { content?: string };
}

@Injectable()
export class OllamaClient {
  private readonly logger = new Logger(OllamaClient.name);
  private readonly baseUrl: string | null;
  private readonly model: string;

  constructor() {
    const raw = process.env.OLLAMA_BASE_URL?.trim();
    // Always fall back to localhost:11434 — never silently disable
    this.baseUrl = raw ? raw.replace(/\/$/, '') : 'http://localhost:11434';
    this.model = process.env.OLLAMA_MODEL?.trim() || 'gemma4:latest';
    this.logger.log(`OllamaClient ready → ${this.baseUrl} model=${this.model}`);
  }

  get isConfigured(): boolean {
    return true; // always configured; baseUrl always has a value
  }

  async chat(systemPrompt: string, userMessage: string): Promise<string | null> {
    // baseUrl is always set (localhost fallback), so we always attempt Ollama

    try {
      const res = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage },
          ],
          stream: false,
        }),
        signal: AbortSignal.timeout(30_000),
      });

      if (!res.ok) {
        this.logger.warn(`Ollama responded with HTTP ${res.status}`);
        return null;
      }

      const data = (await res.json()) as OllamaChatResponse;
      const content = data.message?.content?.trim();
      return content || null;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(`Ollama unavailable, using mock fallback: ${message}`);
      return null;
    }
  }
}
