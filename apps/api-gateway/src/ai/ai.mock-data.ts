import type {
  AiAttendanceRiskStudent,
  AiCitation,
  AiCopilotRole,
  AiDashboardInsights,
  AiDropoutRiskStudent,
  AiFeeDefaultPrediction,
  AiInsightCard,
  AiLessonPlan,
  AiReportNarrative,
} from '@eduai365/shared-types';
import type { TenantContext } from '@eduai365/shared-types';
import type { ChatCopilotDto } from './dto/chat.dto';
import type { GenerateLessonPlanDto } from './dto/lesson-plan.dto';
import type { GenerateReportNarrativeDto } from './dto/report-narrative.dto';

const MOCK_STUDENTS = [
  { id: 'stu-001', name: 'Aarav Mehta', className: 'Grade 10-A' },
  { id: 'stu-002', name: 'Priya Sharma', className: 'Grade 8-B' },
  { id: 'stu-003', name: 'Rohan Das', className: 'Grade 9-C' },
  { id: 'stu-004', name: 'Ananya Patel', className: 'Grade 7-A' },
  { id: 'stu-005', name: 'Kabir Singh', className: 'Grade 11-B' },
  { id: 'stu-006', name: 'Meera Nair', className: 'Grade 6-C' },
];

const KNOWLEDGE_BASE: Omit<AiCitation, 'relevanceScore'>[] = [
  {
    id: 'kb-fee-policy',
    title: 'Fee Payment Policy 2025-26',
    source: 'school_policies',
    excerpt:
      'Term fees are due by the 15th of each quarter. A grace period of 7 days applies before late fees.',
  },
  {
    id: 'kb-attendance',
    title: 'Minimum Attendance Requirement',
    source: 'academic_regulations',
    excerpt:
      'Students must maintain at least 75% attendance to be eligible for term-end examinations.',
  },
  {
    id: 'kb-exam-schedule',
    title: 'Term II Examination Calendar',
    source: 'academic_calendar',
    excerpt:
      'Term II exams run from March 10–28. Practical assessments begin one week prior.',
  },
  {
    id: 'kb-leave',
    title: 'Student Leave Application Process',
    source: 'student_handbook',
    excerpt:
      'Leave requests must be submitted via the parent portal at least 48 hours before absence.',
  },
  {
    id: 'kb-transport',
    title: 'Transport Route Updates',
    source: 'operations',
    excerpt:
      'Route 7 (Guwahati East) pickup times adjusted by 10 minutes effective this month.',
  },
];

function seedFrom(text: string): number {
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function pickCitations(message: string, count = 2): AiCitation[] {
  const seed = seedFrom(message.toLowerCase());
  const scored = KNOWLEDGE_BASE.map((doc, index) => ({
    ...doc,
    relevanceScore: Number(
      (0.55 + ((seed + index * 17) % 40) / 100).toFixed(2),
    ),
  }));
  scored.sort((a, b) => b.relevanceScore - a.relevanceScore);
  return scored.slice(0, count);
}

const ROLE_INTROS: Record<AiCopilotRole, string> = {
  PRINCIPAL: 'As your principal assistant',
  VICE_PRINCIPAL: 'As your vice-principal assistant',
  TEACHER: 'As your classroom copilot',
  PARENT: 'As your parent portal assistant',
  STUDENT: 'As your learning assistant',
  SCHOOL_ADMIN: 'As your school admin assistant',
};

export function mockChatReply(
  tenant: TenantContext,
  dto: ChatCopilotDto,
): { reply: string; citations: AiCitation[] } {
  const citations = pickCitations(dto.message);
  const intro = ROLE_INTROS[dto.role];
  const contextHint = dto.context?.page
    ? ` (context: ${String(dto.context.page)})`
    : '';

  const reply =
    `${intro}, I reviewed ${tenant.slug} school records${contextHint}. ` +
    `Regarding "${dto.message}": ${citations[0]?.excerpt ?? 'No matching policy found.'} ` +
    `See also ${citations[1]?.title ?? 'the student handbook'} for related guidance.`;

  return { reply, citations };
}

function insightCardsForRole(role: AiCopilotRole): AiInsightCard[] {
  const common: AiInsightCard[] = [
    {
      id: 'ins-attendance',
      title: 'Attendance Trend',
      summary: 'School-wide attendance is 91.2%, down 1.4% from last month.',
      severity: 'warning',
      metric: '91.2%',
      actionLabel: 'View at-risk students',
    },
    {
      id: 'ins-fees',
      title: 'Fee Collection',
      summary: 'Q2 collection at 87% with 42 accounts overdue beyond grace period.',
      severity: 'warning',
      metric: '87%',
      actionLabel: 'Open fee dashboard',
    },
  ];

  const byRole: Partial<Record<AiCopilotRole, AiInsightCard[]>> = {
    PRINCIPAL: [
      {
        id: 'ins-staff',
        title: 'Staff Coverage',
        summary: '3 classes need substitute coverage tomorrow; HR notified.',
        severity: 'critical',
        metric: '3 gaps',
      },
      {
        id: 'ins-enrollment',
        title: 'Enrollment Pipeline',
        summary: '18 admission inquiries pending follow-up this week.',
        severity: 'info',
        metric: '18 leads',
      },
    ],
    TEACHER: [
      {
        id: 'ins-grading',
        title: 'Pending Grades',
        summary: '12 homework submissions await grading in your queue.',
        severity: 'info',
        metric: '12 items',
      },
      {
        id: 'ins-lesson',
        title: 'Lesson Plan Suggestion',
        summary: 'AI recommends revisiting fractions — 34% of class scored below 60%.',
        severity: 'warning',
      },
    ],
    PARENT: [
      {
        id: 'ins-child-attendance',
        title: 'Child Attendance',
        summary: 'Your ward has 94% attendance this term — above school average.',
        severity: 'info',
        metric: '94%',
      },
      {
        id: 'ins-fee-due',
        title: 'Upcoming Fee Due',
        summary: 'Term II balance of ₹12,500 due by the 15th.',
        severity: 'warning',
        metric: '₹12,500',
      },
    ],
    SCHOOL_ADMIN: [
      {
        id: 'ins-admissions',
        title: 'Admissions Queue',
        summary: '7 applications require document verification today.',
        severity: 'info',
        metric: '7 pending',
      },
    ],
    VICE_PRINCIPAL: [
      {
        id: 'ins-discipline',
        title: 'Discipline Cases',
        summary: '2 open cases flagged for review — both first-time incidents.',
        severity: 'info',
        metric: '2 open',
      },
    ],
  };

  return [...common, ...(byRole[role] ?? [])];
}

export function mockDashboardInsights(
  role: AiCopilotRole,
): AiDashboardInsights {
  return {
    role,
    cards: insightCardsForRole(role),
    generatedAt: new Date().toISOString(),
  };
}

export function mockDropoutRisk(tenant: TenantContext): AiDropoutRiskStudent[] {
  const seed = seedFrom(tenant.schoolId);
  return MOCK_STUDENTS.slice(0, 4).map((student, index) => {
    const score = 35 + ((seed + index * 23) % 55);
    const riskLevel = score >= 70 ? 'high' : score >= 50 ? 'medium' : 'low';
    return {
      studentId: student.id,
      name: student.name,
      className: student.className,
      riskScore: score,
      riskLevel,
      factors:
        riskLevel === 'high'
          ? ['Low attendance', 'Declining grades', 'Fee arrears']
          : riskLevel === 'medium'
            ? ['Irregular attendance', 'Below-average math scores']
            : ['Stable performance'],
    };
  });
}

export function mockFeeDefault(tenant: TenantContext): AiFeeDefaultPrediction[] {
  const seed = seedFrom(`${tenant.schoolId}-fees`);
  return MOCK_STUDENTS.slice(0, 5).map((student, index) => {
    const probability = Number(
      (0.2 + ((seed + index * 13) % 70) / 100).toFixed(2),
    );
    const riskLevel =
      probability >= 0.65 ? 'high' : probability >= 0.4 ? 'medium' : 'low';
    return {
      studentId: student.id,
      name: student.name,
      className: student.className,
      outstandingAmount: 5000 + ((seed + index * 7) % 20) * 500,
      daysOverdue: (seed + index * 3) % 45,
      defaultProbability: probability,
      riskLevel,
    };
  });
}

export function mockAttendanceRisk(
  tenant: TenantContext,
): AiAttendanceRiskStudent[] {
  const seed = seedFrom(`${tenant.schoolId}-attendance`);
  const trends: AiAttendanceRiskStudent['predictedTrend'][] = [
    'declining',
    'stable',
    'improving',
  ];
  return MOCK_STUDENTS.map((student, index) => {
    const rate = 62 + ((seed + index * 11) % 35);
    const absences = (seed + index) % 8;
    const riskLevel =
      rate < 75 || absences >= 5
        ? 'high'
        : rate < 85 || absences >= 3
          ? 'medium'
          : 'low';
    return {
      studentId: student.id,
      name: student.name,
      className: student.className,
      attendanceRate: rate,
      consecutiveAbsences: absences,
      riskLevel,
      predictedTrend: trends[(seed + index) % trends.length] ?? 'stable',
    };
  });
}

export function mockLessonPlan(dto: GenerateLessonPlanDto): AiLessonPlan {
  const objectives = dto.objectives?.length
    ? dto.objectives
    : [
        `Understand core concepts of ${dto.topic}`,
        `Apply ${dto.topic} to real-world problems`,
        `Collaborate in small groups during practice`,
      ];

  return {
    title: `${dto.topic} — ${dto.grade}`,
    subject: dto.subject,
    grade: dto.grade,
    durationMinutes: dto.durationMinutes,
    objectives,
    materials: [
      'Whiteboard and markers',
      'Student worksheets',
      'Projector with slide deck',
      'Manipulatives or visual aids',
    ],
    warmUp: `5-minute recap quiz on prior ${dto.subject} concepts to activate prior knowledge.`,
    mainActivity: `Guided instruction on ${dto.topic} (${Math.round(dto.durationMinutes * 0.4)} min), followed by pair practice and a whole-class discussion.`,
    assessment: 'Exit ticket with 3 questions aligned to lesson objectives.',
    homework: `Complete practice set on ${dto.topic}; submit via student portal.`,
    differentiation:
      'Provide scaffolded worksheets for struggling learners; extension problems for advanced students.',
    source: 'mock',
  };
}

export function mockReportNarrative(
  dto: GenerateReportNarrativeDto,
): AiReportNarrative {
  const subject = dto.subject ?? 'overall performance';
  const grade = dto.grade ?? 'the class';
  const name = dto.studentName ?? 'the cohort';
  const tone = dto.tone ?? 'formal';
  const avg =
    typeof dto.metrics.averageScore === 'number'
      ? dto.metrics.averageScore
      : typeof dto.metrics.averageScore === 'string'
        ? Number(dto.metrics.averageScore)
        : 75;

  const narrative =
    tone === 'supportive'
      ? `${name} has shown steady effort in ${subject} this term. With an average of ${avg}%, there is clear room for growth, and targeted revision can help build confidence ahead of the next assessment cycle.`
      : tone === 'concise'
        ? `${name} (${grade}): ${subject} average ${avg}%. Attendance and homework completion remain key focus areas.`
        : `This ${dto.reportType} report for ${name} in ${grade} summarizes ${subject} outcomes. The recorded average score of ${avg}% reflects consistent participation with identifiable strengths in conceptual understanding and opportunities in applied problem-solving.`;

  return {
    narrative,
    highlights: [
      `Average score: ${avg}%`,
      `Report type: ${dto.reportType}`,
      `Focus area: ${subject}`,
    ],
    recommendations: [
      'Schedule a parent-teacher check-in for students below 70%.',
      'Assign remedial worksheets for topics with sub-60% class averages.',
      'Celebrate top improvers in the next assembly notice.',
    ],
    source: 'mock',
  };
}
