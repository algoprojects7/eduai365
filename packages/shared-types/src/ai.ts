import type { UserRole } from './index';

/** Roles supported by the AI copilot chat endpoint. */
export type AiCopilotRole = Extract<
  UserRole,
  'PRINCIPAL' | 'TEACHER' | 'PARENT' | 'STUDENT' | 'SCHOOL_ADMIN' | 'VICE_PRINCIPAL'
>;

export interface AiCitation {
  id: string;
  title: string;
  source: string;
  excerpt: string;
  relevanceScore: number;
}

export interface AiChatRequest {
  role: AiCopilotRole;
  message: string;
  context?: Record<string, unknown>;
}

export interface AiChatResponse {
  reply: string;
  citations: AiCitation[];
  source: 'ollama' | 'mock';
}

export type AiInsightSeverity = 'info' | 'warning' | 'critical';

export interface AiInsightCard {
  id: string;
  title: string;
  summary: string;
  severity: AiInsightSeverity;
  metric?: string;
  actionLabel?: string;
}

export interface AiDashboardInsights {
  role: AiCopilotRole;
  cards: AiInsightCard[];
  generatedAt: string;
}

export type AiRiskLevel = 'low' | 'medium' | 'high';

export interface AiDropoutRiskStudent {
  studentId: string;
  name: string;
  className: string;
  riskScore: number;
  riskLevel: AiRiskLevel;
  factors: string[];
}

export interface AiFeeDefaultPrediction {
  studentId: string;
  name: string;
  className: string;
  outstandingAmount: number;
  daysOverdue: number;
  defaultProbability: number;
  riskLevel: AiRiskLevel;
}

export interface AiAttendanceRiskStudent {
  studentId: string;
  name: string;
  className: string;
  attendanceRate: number;
  consecutiveAbsences: number;
  riskLevel: AiRiskLevel;
  predictedTrend: 'declining' | 'stable' | 'improving';
}

export interface AiLessonPlanRequest {
  subject: string;
  topic: string;
  grade: string;
  durationMinutes: number;
  objectives?: string[];
  standards?: string[];
}

export interface AiLessonPlan {
  title: string;
  subject: string;
  grade: string;
  durationMinutes: number;
  objectives: string[];
  materials: string[];
  warmUp: string;
  mainActivity: string;
  assessment: string;
  homework: string;
  differentiation: string;
  source: 'ollama' | 'mock';
}

export interface AiReportNarrativeRequest {
  reportType: 'term' | 'annual' | 'class' | 'student';
  subject?: string;
  grade?: string;
  studentName?: string;
  metrics: Record<string, number | string>;
  tone?: 'formal' | 'supportive' | 'concise';
}

export interface AiReportNarrative {
  narrative: string;
  highlights: string[];
  recommendations: string[];
  source: 'ollama' | 'mock';
}
