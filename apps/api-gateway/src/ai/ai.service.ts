import { Injectable } from '@nestjs/common';
import type {
  AiChatResponse,
  AiCopilotRole,
  AiDashboardInsights,
  AiLessonPlan,
  AiReportNarrative,
  TenantContext,
} from '@eduai365/shared-types';
import {
  mockAttendanceRisk,
  mockChatReply,
  mockDashboardInsights,
  mockDropoutRisk,
  mockFeeDefault,
  mockLessonPlan,
  mockReportNarrative,
} from './ai.mock-data';
import type { ChatCopilotDto } from './dto/chat.dto';
import type { GenerateLessonPlanDto } from './dto/lesson-plan.dto';
import type { GenerateReportNarrativeDto } from './dto/report-narrative.dto';
import { OllamaClient } from './ollama.client';

@Injectable()
export class AiService {
  constructor(private readonly ollama: OllamaClient) {}

  async chat(tenant: TenantContext, dto: ChatCopilotDto): Promise<AiChatResponse> {
    // Build a clean, role-aware system prompt — no injected mock school context.
    // The model should answer the user's actual question, not regurgitate fake policies.
    const roleDescriptions: Record<string, string> = {
      STUDENT:
        'You are eduAI365, an exam-answer assistant for school students. ' +
        'STRICT FORMAT RULES:\n' +
        '1. Reply in ONE short sentence — exactly how an examinee writes the final answer in an exam.\n' +
        '2. Example formats: "Sum is 3010.", "The area is 24 sq cm.", "x = 4, -4", "Photosynthesis is the process by which plants make food using sunlight."\n' +
        '3. Do NOT show working steps, bullet points, emojis, encouragement, or follow-up questions.\n' +
        '4. If the question requires a definition, give it in one clear sentence.\n' +
        '5. If working is explicitly requested, show it in 2–3 numbered lines only, then state the final answer.\n' +
        '6. NEVER use LaTeX or math markup. No $ signs, no \\pm, no \\frac, no \\sqrt, no ** for bold. Write math in plain text only: use "x = 4, -4" not "$x = \\pm 4$", use "sqrt(16) = 4" not "$\\sqrt{16}$".',
      TEACHER:
        'You are eduAI365, a classroom copilot for a teacher. ' +
        'Help with lesson planning, explaining pedagogical strategies, generating quiz questions, ' +
        'analysing student performance patterns, and drafting communications. Be professional and practical.',
      PARENT:
        'You are eduAI365, a parent portal assistant. ' +
        'Help parents understand school policies, fee structures, academic progress, and how to ' +
        'support their child at home. Be warm, clear, and reassuring.',
      PRINCIPAL:
        'You are eduAI365, a school administration copilot for the principal. ' +
        'Help with strategic planning, staff management insights, academic quality, and operational decisions.',
      VICE_PRINCIPAL:
        'You are eduAI365, a school operations copilot for the vice principal. ' +
        'Help with scheduling, discipline, substitute coverage, and daily operations.',
      SCHOOL_ADMIN:
        'You are eduAI365, a school admin assistant. ' +
        'Help with admissions, fee management, records, and school-wide data insights.',
    };

    const systemPrompt =
      roleDescriptions[dto.role] ??
      `You are eduAI365, a helpful school ERP assistant. Answer questions clearly and accurately.`;

    // Only inject school-specific context if the user is asking about school operations
    const schoolOpsKeywords = [
      'fee', 'attendance', 'exam', 'schedule', 'timetable', 'leave',
      'policy', 'transport', 'admission', 'result', 'marksheet',
    ];
    const isSchoolOpsQuery = schoolOpsKeywords.some((kw) =>
      dto.message.toLowerCase().includes(kw),
    );

    let ragContext: ReturnType<typeof mockChatReply> | null = null;
    let augmentedPrompt = systemPrompt;

    if (isSchoolOpsQuery) {
      ragContext = mockChatReply(tenant, dto);
      augmentedPrompt +=
        '\n\nHere is some school-specific context that may be relevant:\n' +
        ragContext.citations.map((c) => `- [${c.title}] ${c.excerpt}`).join('\n');
    }

    const ollamaReply = await this.ollama.chat(augmentedPrompt, dto.message);

    if (ollamaReply) {
      return {
        reply: ollamaReply,
        citations: ragContext?.citations ?? [],
        source: 'ollama',
      };
    }

    // Fallback to mock only when Ollama is unavailable
    const fallback = ragContext ?? mockChatReply(tenant, dto);
    return {
      reply: fallback.reply,
      citations: fallback.citations,
      source: 'mock',
    };
  }

  getDashboardInsights(role: AiCopilotRole): AiDashboardInsights {
    return mockDashboardInsights(role);
  }

  getDropoutRisk(tenant: TenantContext) {
    return mockDropoutRisk(tenant);
  }

  getFeeDefaultPredictions(tenant: TenantContext) {
    return mockFeeDefault(tenant);
  }

  getAttendanceRisk(tenant: TenantContext) {
    return mockAttendanceRisk(tenant);
  }

  async generateLessonPlan(dto: GenerateLessonPlanDto): Promise<AiLessonPlan> {
    const mock = mockLessonPlan(dto);
    const prompt =
      `Generate a structured lesson plan as plain text sections (Objectives, Materials, Warm-up, Main Activity, Assessment, Homework, Differentiation) ` +
      `for ${dto.subject}, topic "${dto.topic}", ${dto.grade}, ${dto.durationMinutes} minutes.`;

    const ollamaReply = await this.ollama.chat(
      'You are an expert K-12 curriculum designer. Output clear, actionable lesson plans.',
      prompt,
    );

    if (ollamaReply) {
      return { ...mock, mainActivity: ollamaReply, source: 'ollama' };
    }

    return mock;
  }

  async generateReportNarrative(
    dto: GenerateReportNarrativeDto,
  ): Promise<AiReportNarrative> {
    const mock = mockReportNarrative(dto);
    const prompt =
      `Write a ${dto.tone ?? 'formal'} ${dto.reportType} report narrative. ` +
      `Subject: ${dto.subject ?? 'N/A'}. Grade: ${dto.grade ?? 'N/A'}. ` +
      `Student: ${dto.studentName ?? 'class cohort'}. Metrics: ${JSON.stringify(dto.metrics)}.`;

    const ollamaReply = await this.ollama.chat(
      'You are a school report writer. Produce professional narrative text only.',
      prompt,
    );

    if (ollamaReply) {
      return { ...mock, narrative: ollamaReply, source: 'ollama' };
    }

    return mock;
  }
}
