import {
  PrismaClient,
  UserRole,
  CalendarEventType,
  FeeHeadCategory,
  InvoiceStatus,
  PaymentMethod,
  PaymentStatus,
  ScholarshipType,
} from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const BCRYPT_ROUNDS = 12;

async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

const PERMISSIONS = [
  { code: 'dashboard.view', name: 'View Dashboard', module: 'dashboard' },
  { code: 'students.view', name: 'View Students', module: 'students' },
  { code: 'students.create', name: 'Create Students', module: 'students' },
  { code: 'students.update', name: 'Update Students', module: 'students' },
  { code: 'students.delete', name: 'Delete Students', module: 'students' },
  { code: 'staff.view', name: 'View Staff', module: 'staff' },
  { code: 'staff.manage', name: 'Manage Staff', module: 'staff' },
  { code: 'classes.view', name: 'View Classes', module: 'academics' },
  { code: 'classes.manage', name: 'Manage Classes', module: 'academics' },
  { code: 'attendance.view', name: 'View Attendance', module: 'attendance' },
  { code: 'attendance.manage', name: 'Manage Attendance', module: 'attendance' },
  { code: 'exams.view', name: 'View Exams', module: 'exams' },
  { code: 'exams.manage', name: 'Manage Exams', module: 'exams' },
  { code: 'finance.view', name: 'View Finance', module: 'finance' },
  { code: 'finance.manage', name: 'Manage Finance', module: 'finance' },
  { code: 'library.view', name: 'View Library', module: 'library' },
  { code: 'library.manage', name: 'Manage Library', module: 'library' },
  { code: 'transport.view', name: 'View Transport', module: 'transport' },
  { code: 'transport.manage', name: 'Manage Transport', module: 'transport' },
  { code: 'hostel.view', name: 'View Hostel', module: 'hostel' },
  { code: 'hostel.manage', name: 'Manage Hostel', module: 'hostel' },
  { code: 'hr.view', name: 'View HR', module: 'hr' },
  { code: 'hr.manage', name: 'Manage HR', module: 'hr' },
  { code: 'reports.view', name: 'View Reports', module: 'reports' },
  { code: 'settings.view', name: 'View Settings', module: 'settings' },
  { code: 'settings.manage', name: 'Manage Settings', module: 'settings' },
  { code: 'audit.view', name: 'View Audit Logs', module: 'audit' },
] as const;

const ALL_PERMISSION_CODES = PERMISSIONS.map((p) => p.code);

const ROLE_PERMISSIONS: Record<UserRole, readonly string[]> = {
  SUPER_ADMIN: ALL_PERMISSION_CODES,
  SCHOOL_ADMIN: ALL_PERMISSION_CODES.filter((c) => c !== 'audit.view'),
  PRINCIPAL: [
    'dashboard.view',
    'students.view',
    'students.create',
    'students.update',
    'staff.view',
    'staff.manage',
    'classes.view',
    'classes.manage',
    'attendance.view',
    'attendance.manage',
    'exams.view',
    'exams.manage',
    'finance.view',
    'library.view',
    'transport.view',
    'hostel.view',
    'hr.view',
    'reports.view',
    'settings.view',
  ],
  VICE_PRINCIPAL: [
    'dashboard.view',
    'students.view',
    'students.update',
    'staff.view',
    'classes.view',
    'attendance.view',
    'attendance.manage',
    'exams.view',
    'exams.manage',
    'reports.view',
  ],
  TEACHER: [
    'dashboard.view',
    'students.view',
    'classes.view',
    'attendance.view',
    'attendance.manage',
    'exams.view',
    'exams.manage',
  ],
  STUDENT: ['dashboard.view', 'attendance.view', 'exams.view'],
  PARENT: ['dashboard.view', 'students.view', 'attendance.view', 'exams.view', 'finance.view'],
  ACCOUNTANT: ['dashboard.view', 'finance.view', 'finance.manage', 'reports.view'],
  RECEPTIONIST: [
    'dashboard.view',
    'students.view',
    'students.create',
    'students.update',
    'staff.view',
    'attendance.view',
  ],
  LIBRARIAN: ['dashboard.view', 'library.view', 'library.manage', 'students.view'],
  TRANSPORT_MANAGER: ['dashboard.view', 'transport.view', 'transport.manage', 'students.view'],
  HR_MANAGER: ['dashboard.view', 'hr.view', 'hr.manage', 'staff.view', 'staff.manage', 'reports.view'],
  HOSTEL_WARDEN: ['dashboard.view', 'hostel.view', 'hostel.manage', 'students.view'],
  EXAM_CONTROLLER: [
    'dashboard.view',
    'exams.view',
    'exams.manage',
    'students.view',
    'classes.view',
    'reports.view',
  ],
  COUNSELLOR: ['dashboard.view', 'students.view', 'attendance.view', 'reports.view'],
};

const PLANS = [
  {
    name: 'Core',
    code: 'CORE',
    priceMonthly: 99,
    features: ['Up to 500 students', 'Basic modules', 'Email support'],
  },
  {
    name: 'Pro',
    code: 'PRO',
    priceMonthly: 249,
    features: ['Up to 2,000 students', 'All modules', 'Priority support', 'AI insights'],
  },
  {
    name: 'Enterprise',
    code: 'ENTERPRISE',
    priceMonthly: 499,
    features: [
      'Unlimited students',
      'All modules',
      'Dedicated support',
      'AI insights',
      'Custom integrations',
      'SLA guarantee',
    ],
  },
] as const;

async function seedPermissions(): Promise<Map<string, string>> {
  const permissionIdByCode = new Map<string, string>();

  for (const permission of PERMISSIONS) {
    const record = await prisma.permission.upsert({
      where: { code: permission.code },
      update: { name: permission.name, module: permission.module },
      create: permission,
    });
    permissionIdByCode.set(record.code, record.id);
  }

  return permissionIdByCode;
}

async function seedRolePermissions(permissionIdByCode: Map<string, string>): Promise<void> {
  for (const [role, codes] of Object.entries(ROLE_PERMISSIONS) as [UserRole, readonly string[]][]) {
    for (const code of codes) {
      const permissionId = permissionIdByCode.get(code);
      if (!permissionId) continue;

      await prisma.rolePermission.upsert({
        where: {
          role_permissionId: { role, permissionId },
        },
        update: {},
        create: { role, permissionId },
      });
    }
  }
}

async function seedPlans(): Promise<Map<string, string>> {
  const planIdByCode = new Map<string, string>();

  for (const plan of PLANS) {
    const record = await prisma.plan.upsert({
      where: { code: plan.code },
      update: {
        name: plan.name,
        priceMonthly: plan.priceMonthly,
        features: plan.features,
      },
      create: {
        name: plan.name,
        code: plan.code,
        priceMonthly: plan.priceMonthly,
        features: plan.features,
      },
    });
    planIdByCode.set(record.code, record.id);
  }

  return planIdByCode;
}

const ACADEMIC_YEAR = '2025-2026';

const GRADE_LABELS = [
  'Nursery',
  'LKG',
  'UKG',
  'Class 1',
  'Class 2',
  'Class 3',
  'Class 4',
  'Class 5',
  'Class 6',
  'Class 7',
  'Class 8',
  'Class 9',
  'Class 10',
  'Class 11',
  'Class 12',
] as const;

const ADMISSION_APPLICANTS = [
  { applicantName: 'Amina Bello', parentName: 'Ibrahim Bello', targetClass: 'Class 8', stage: 'INQUIRY' as const },
  { applicantName: 'Tunde Ogunleye', parentName: 'Funke Ogunleye', targetClass: 'Class 5', stage: 'INQUIRY' as const },
  { applicantName: 'Zara Mohammed', parentName: 'Halima Mohammed', targetClass: 'Nursery', stage: 'APPLICATION' as const },
  { applicantName: 'Emeka Nwankwo', parentName: 'Chidi Nwankwo', targetClass: 'Class 10', stage: 'APPLICATION' as const },
  { applicantName: 'Priya Sharma', parentName: 'Raj Sharma', targetClass: 'Class 3', stage: 'APPLICATION' as const },
  { applicantName: 'Kofi Mensah', parentName: 'Abena Mensah', targetClass: 'Class 7', stage: 'ENTRANCE_TEST' as const },
  { applicantName: 'Laila Hassan', parentName: 'Omar Hassan', targetClass: 'Class 9', stage: 'ENTRANCE_TEST' as const },
  { applicantName: 'James Okoro', parentName: 'Grace Okoro', targetClass: 'Class 6', stage: 'ENTRANCE_TEST' as const },
  { applicantName: 'Fatou Diallo', parentName: 'Moussa Diallo', targetClass: 'Class 4', stage: 'INTERVIEW' as const },
  { applicantName: 'Daniel Kimani', parentName: 'Wanjiku Kimani', targetClass: 'Class 11', stage: 'INTERVIEW' as const },
  { applicantName: 'Blessing Eze', parentName: 'Patience Eze', targetClass: 'Class 2', stage: 'INTERVIEW' as const },
  { applicantName: 'Hassan Ali', parentName: 'Aisha Ali', targetClass: 'Class 8', stage: 'OFFER' as const },
  { applicantName: 'Ngozi Okafor', parentName: 'Emeka Okafor', targetClass: 'LKG', stage: 'OFFER' as const },
  { applicantName: 'Yusuf Abdullahi', parentName: 'Zainab Abdullahi', targetClass: 'Class 12', stage: 'FEE_PAID' as const },
  { applicantName: 'Adaeze Chukwu', parentName: 'Ifeanyi Chukwu', targetClass: 'Class 9', stage: 'FEE_PAID' as const },
  { applicantName: 'Samuel Boateng', parentName: 'Akua Boateng', targetClass: 'UKG', stage: 'ENROLLED' as const },
  { applicantName: 'Mary Wanjiru', parentName: 'Peter Wanjiru', targetClass: 'Class 1', stage: 'ENROLLED' as const },
  { applicantName: 'Chidi Adebayo', parentName: 'Ngozi Adebayo', targetClass: 'Class 8', stage: 'ENROLLED' as const },
];

async function seedAcademicsData(greenfield: { id: string }): Promise<void> {
  const teacher = await prisma.user.findUnique({
    where: { email: 'teacher@greenfield.eduai365.ai' },
  });
  const teacherId = teacher?.id;

  const subjectDefs = [
    { code: 'SCI101', name: 'Science' },
    { code: 'SOC101', name: 'Social Studies' },
    { code: 'HIN101', name: 'Hindi' },
    { code: 'PHY101', name: 'Physics' },
    { code: 'CHE101', name: 'Chemistry' },
    { code: 'BIO101', name: 'Biology' },
  ];

  const subjects: Record<string, string> = {};
  for (const def of subjectDefs) {
    const existingSubject = await prisma.subject.findFirst({
      where: { schoolId: greenfield.id, code: def.code },
    });
    let record;
    if (existingSubject) {
      record = await prisma.subject.update({
        where: { id: existingSubject.id },
        data: { name: def.name, isActive: true },
      });
    } else {
      record = await prisma.subject.create({
        data: { schoolId: greenfield.id, name: def.name, code: def.code, isActive: true },
      });
    }
    subjects[def.code] = record.id;
  }

  const mathSubject = await prisma.subject.findFirst({
    where: { schoolId: greenfield.id, code: 'MATH101' },
  });
  const engSubject = await prisma.subject.findFirst({
    where: { schoolId: greenfield.id, code: 'ENG101' },
  });
  if (mathSubject) subjects['MATH101'] = mathSubject.id;
  if (engSubject) subjects['ENG101'] = engSubject.id;

  const class8 = await prisma.class.upsert({
    where: {
      schoolId_name_academicYear: {
        schoolId: greenfield.id,
        name: 'Class 8',
        academicYear: ACADEMIC_YEAR,
      },
    },
    update: { grade: '8', isActive: true },
    create: {
      schoolId: greenfield.id,
      name: 'Class 8',
      grade: '8',
      academicYear: ACADEMIC_YEAR,
      isActive: true,
    },
  });

  const class8SectionA = await prisma.section.upsert({
    where: { classId_name: { classId: class8.id, name: 'A' } },
    update: { isActive: true, capacity: 35 },
    create: {
      schoolId: greenfield.id,
      classId: class8.id,
      name: 'A',
      capacity: 35,
      isActive: true,
    },
  });

  const existingAdmissions = await prisma.admissionApplication.count({
    where: { schoolId: greenfield.id },
  });

  if (existingAdmissions === 0) {
    for (const [index, app] of ADMISSION_APPLICANTS.entries()) {
      await prisma.admissionApplication.create({
        data: {
          schoolId: greenfield.id,
          applicantName: app.applicantName,
          parentName: app.parentName,
          parentEmail: `parent${index + 1}@example.com`,
          parentPhone: `+234-802-${String(index + 1).padStart(7, '0')}`,
          targetClass: app.targetClass,
          previousSchool: index % 3 === 0 ? 'Previous Academy' : undefined,
          stage: app.stage,
          aiScore: app.stage !== 'INQUIRY' ? 60 + (index % 35) : undefined,
          documents: [{ type: 'birth_certificate', uploaded: index % 2 === 0 }],
          notes: index % 4 === 0 ? 'Strong academic background' : undefined,
        },
      });
    }
  }

  for (const grade of GRADE_LABELS) {
    const totalSeats = grade.includes('Nursery') || grade.startsWith('L') || grade.startsWith('U') ? 30 : 40;
    const filledSeats = Math.floor(totalSeats * (0.3 + Math.random() * 0.5));
    await prisma.classSeatCapacity.upsert({
      where: {
        schoolId_grade_academicYear: {
          schoolId: greenfield.id,
          grade,
          academicYear: ACADEMIC_YEAR,
        },
      },
      update: { totalSeats, filledSeats },
      create: {
        schoolId: greenfield.id,
        grade,
        totalSeats,
        filledSeats,
        academicYear: ACADEMIC_YEAR,
      },
    });
  }

  const existingSlots = await prisma.timetableSlot.count({
    where: { schoolId: greenfield.id, classId: class8.id },
  });

  if (existingSlots === 0 && teacherId) {
    const periodTimes = [
      { start: '08:00', end: '08:45' },
      { start: '08:50', end: '09:35' },
      { start: '09:50', end: '10:35' },
      { start: '10:40', end: '11:25' },
      { start: '11:30', end: '12:15' },
      { start: '12:20', end: '13:05' },
    ];
    const subjectRotation = [
      subjects['MATH101'],
      subjects['ENG101'],
      subjects['SCI101'],
      subjects['SOC101'],
      subjects['HIN101'],
      subjects['PHY101'],
    ];

    for (let day = 1; day <= 6; day++) {
      for (let period = 1; period <= 6; period++) {
        const time = periodTimes[period - 1]!;
        const subjectId = subjectRotation[(day + period) % subjectRotation.length]!;
        await prisma.timetableSlot.create({
          data: {
            schoolId: greenfield.id,
            classId: class8.id,
            sectionId: class8SectionA.id,
            teacherId,
            subjectId,
            dayOfWeek: day,
            period,
            startTime: time.start,
            endTime: time.end,
            room: `Room ${100 + period}`,
          },
        });
      }
    }
  }

  const midTermExisting = await prisma.exam.findFirst({
    where: { schoolId: greenfield.id, name: 'Mid-Term Examination' },
  });
  const midTerm =
    midTermExisting ??
    (await prisma.exam.create({
      data: {
        schoolId: greenfield.id,
        name: 'Mid-Term Examination',
        term: 'Term 1',
        academicYear: ACADEMIC_YEAR,
        status: 'SCHEDULED',
        startDate: new Date('2025-10-15'),
        endDate: new Date('2025-10-25'),
        classes: [class8.id],
      },
    }));

  const finalExamExisting = await prisma.exam.findFirst({
    where: { schoolId: greenfield.id, name: 'Final Examination' },
  });
  const finalExam =
    finalExamExisting ??
    (await prisma.exam.create({
      data: {
        schoolId: greenfield.id,
        name: 'Final Examination',
        term: 'Term 2',
        academicYear: ACADEMIC_YEAR,
        status: 'DRAFT',
        startDate: new Date('2026-03-01'),
        endDate: new Date('2026-03-15'),
        classes: [class8.id],
      },
    }));

  const scheduleCount = await prisma.examScheduleEntry.count({ where: { examId: midTerm.id } });
  if (scheduleCount === 0) {
    const scheduleSubjects = [
      { subjectId: subjects['MATH101']!, date: '2025-10-15', maxMarks: 100 },
      { subjectId: subjects['ENG101']!, date: '2025-10-17', maxMarks: 100 },
      { subjectId: subjects['SCI101']!, date: '2025-10-20', maxMarks: 100 },
      { subjectId: subjects['SOC101']!, date: '2025-10-22', maxMarks: 80 },
    ];
    for (const entry of scheduleSubjects) {
      await prisma.examScheduleEntry.create({
        data: {
          examId: midTerm.id,
          subjectId: entry.subjectId,
          classId: class8.id,
          date: new Date(entry.date),
          startTime: '09:00',
          endTime: '12:00',
          room: 'Hall A',
          maxMarks: entry.maxMarks,
        },
      });
    }
  }

  const calendarCount = await prisma.calendarEvent.count({ where: { schoolId: greenfield.id } });
  if (calendarCount === 0) {
    const events: Array<{
      title: string;
      type: CalendarEventType;
      startDate: string;
      endDate: string;
      allDay?: boolean;
    }> = [
      { title: 'Mid-Term Exams Begin', type: 'EXAM', startDate: '2025-10-15', endDate: '2025-10-25' },
      { title: 'Independence Day Holiday', type: 'HOLIDAY', startDate: '2025-10-01', endDate: '2025-10-01', allDay: true },
      { title: 'Annual Sports Day', type: 'SPORTS', startDate: '2025-11-20', endDate: '2025-11-20' },
      { title: 'Parent-Teacher Meeting', type: 'PTM', startDate: '2025-09-28', endDate: '2025-09-28' },
      { title: 'Science Fair', type: 'EVENT', startDate: '2025-12-05', endDate: '2025-12-06' },
      { title: 'Winter Break', type: 'HOLIDAY', startDate: '2025-12-20', endDate: '2026-01-05', allDay: true },
      { title: 'Final Exams', type: 'EXAM', startDate: '2026-03-01', endDate: '2026-03-15' },
      { title: 'Cultural Fest', type: 'EVENT', startDate: '2026-02-14', endDate: '2026-02-15' },
      { title: 'Inter-House Athletics', type: 'SPORTS', startDate: '2026-01-18', endDate: '2026-01-18' },
      { title: 'Term 2 PTM', type: 'PTM', startDate: '2026-02-28', endDate: '2026-02-28' },
    ];
    for (const event of events) {
      await prisma.calendarEvent.create({
        data: {
          schoolId: greenfield.id,
          title: event.title,
          type: event.type,
          startDate: new Date(event.startDate),
          endDate: new Date(event.endDate),
          allDay: event.allDay ?? false,
          description: `${event.title} — Greenfield Academy`,
        },
      });
    }
  }

  const homeworkCount = await prisma.homeworkAssignment.count({ where: { schoolId: greenfield.id } });
  if (homeworkCount === 0 && teacherId) {
    await prisma.homeworkAssignment.createMany({
      data: [
        {
          schoolId: greenfield.id,
          title: 'Algebra Worksheet — Chapter 5',
          subjectId: subjects['MATH101']!,
          classId: class8.id,
          sectionId: class8SectionA.id,
          dueDate: new Date('2025-09-30'),
          status: 'PUBLISHED',
          description: 'Complete exercises 1-20 from the textbook.',
          createdById: teacherId,
        },
        {
          schoolId: greenfield.id,
          title: 'Essay: My Favourite Book',
          subjectId: subjects['ENG101']!,
          classId: class8.id,
          sectionId: class8SectionA.id,
          dueDate: new Date('2025-10-05'),
          status: 'PUBLISHED',
          description: 'Write a 500-word essay.',
          createdById: teacherId,
        },
        {
          schoolId: greenfield.id,
          title: 'Science Project Proposal',
          subjectId: subjects['SCI101']!,
          classId: class8.id,
          dueDate: new Date('2025-10-12'),
          status: 'DRAFT',
          description: 'Submit project topic and outline.',
          createdById: teacherId,
        },
      ],
    });
  }

  void finalExam;
}

const FEE_HEAD_DEFS: Array<{
  name: string;
  code: string;
  category: FeeHeadCategory;
  amount: number;
  isMandatory: boolean;
}> = [
  { name: 'Tuition Fee', code: 'TUITION', category: 'TUITION', amount: 45000, isMandatory: true },
  { name: 'Admission Fee', code: 'ADMISSION', category: 'ADMISSION', amount: 5000, isMandatory: true },
  { name: 'Exam Fee', code: 'EXAM', category: 'EXAM', amount: 2500, isMandatory: true },
  { name: 'Transport Fee', code: 'TRANSPORT', category: 'TRANSPORT', amount: 8000, isMandatory: false },
  { name: 'Library Fee', code: 'LIBRARY', category: 'LIBRARY', amount: 1500, isMandatory: false },
  { name: 'Lab Fee', code: 'LAB', category: 'LAB', amount: 3000, isMandatory: false },
  { name: 'Sports Fee', code: 'SPORTS', category: 'SPORTS', amount: 2000, isMandatory: false },
  { name: 'Meals Fee', code: 'MEALS', category: 'MEALS', amount: 12000, isMandatory: false },
  { name: 'Uniform Fee', code: 'UNIFORM', category: 'UNIFORM', amount: 4500, isMandatory: false },
  { name: 'Late Fine', code: 'LATE_FINE', category: 'LATE_FINE', amount: 500, isMandatory: false },
];

const GRADE_MULTIPLIERS: Record<string, number> = {
  Nursery: 0.4,
  LKG: 0.45,
  UKG: 0.5,
  'Class 1': 0.55,
  'Class 2': 0.6,
  'Class 3': 0.65,
  'Class 4': 0.7,
  'Class 5': 0.75,
  'Class 6': 0.8,
  'Class 7': 0.85,
  'Class 8': 0.9,
  'Class 9': 0.95,
  'Class 10': 1.0,
  'Class 11': 1.1,
  'Class 12': 1.15,
};

async function seedFinanceData(greenfield: { id: string }): Promise<void> {
  const existingFeeHeads = await prisma.feeHead.count({ where: { schoolId: greenfield.id } });
  if (existingFeeHeads > 0) return;

  const feeHeadIds: Record<string, string> = {};
  for (const def of FEE_HEAD_DEFS) {
    const record = await prisma.feeHead.create({
      data: {
        schoolId: greenfield.id,
        name: def.name,
        code: def.code,
        category: def.category,
        amount: def.amount,
        isActive: true,
        isMandatory: def.isMandatory,
      },
    });
    feeHeadIds[def.code] = record.id;
  }

  for (const grade of GRADE_LABELS) {
    const multiplier = GRADE_MULTIPLIERS[grade] ?? 1;
    for (const def of FEE_HEAD_DEFS) {
      if (def.code === 'LATE_FINE') continue;
      await prisma.classFeeMatrix.create({
        data: {
          schoolId: greenfield.id,
          grade,
          feeHeadId: feeHeadIds[def.code]!,
          amount: Math.round(def.amount * multiplier),
          academicYear: ACADEMIC_YEAR,
        },
      });
    }
  }

  const scholarships = await Promise.all([
    prisma.scholarship.create({
      data: {
        schoolId: greenfield.id,
        name: 'Merit Scholarship',
        type: ScholarshipType.MERIT,
        discountPercent: 25,
        description: 'Top 10% academic performers',
        isActive: true,
      },
    }),
    prisma.scholarship.create({
      data: {
        schoolId: greenfield.id,
        name: 'Need-Based Aid',
        type: ScholarshipType.NEED,
        discountPercent: 50,
        description: 'Financial assistance for eligible families',
        isActive: true,
      },
    }),
    prisma.scholarship.create({
      data: {
        schoolId: greenfield.id,
        name: 'Staff Ward Discount',
        type: ScholarshipType.STAFF_WARD,
        discountPercent: 30,
        description: 'Discount for children of school staff',
        isActive: true,
      },
    }),
  ]);

  const grade10 = await prisma.class.findFirst({
    where: { schoolId: greenfield.id, name: 'Grade 10', academicYear: ACADEMIC_YEAR },
  });
  const class8 = await prisma.class.findFirst({
    where: { schoolId: greenfield.id, name: 'Class 8', academicYear: ACADEMIC_YEAR },
  });

  const studentNames = [
    { firstName: 'Chioma', lastName: 'Adeyemi', admissionNo: 'GFA-2025-0042' },
    { firstName: 'Emeka', lastName: 'Okonkwo', admissionNo: 'GFA-2025-0043' },
    { firstName: 'Fatima', lastName: 'Ibrahim', admissionNo: 'GFA-2025-0044' },
    { firstName: 'David', lastName: 'Mensah', admissionNo: 'GFA-2025-0045' },
    { firstName: 'Aisha', lastName: 'Bello', admissionNo: 'GFA-2025-0046' },
    { firstName: 'Samuel', lastName: 'Boateng', admissionNo: 'GFA-2025-0047' },
    { firstName: 'Grace', lastName: 'Wanjiru', admissionNo: 'GFA-2025-0048' },
    { firstName: 'Yusuf', lastName: 'Abdullahi', admissionNo: 'GFA-2025-0049' },
    { firstName: 'Priya', lastName: 'Sharma', admissionNo: 'GFA-2025-0050' },
    { firstName: 'James', lastName: 'Okoro', admissionNo: 'GFA-2025-0051' },
    { firstName: 'Laila', lastName: 'Hassan', admissionNo: 'GFA-2025-0052' },
    { firstName: 'Daniel', lastName: 'Kimani', admissionNo: 'GFA-2025-0053' },
    { firstName: 'Blessing', lastName: 'Eze', admissionNo: 'GFA-2025-0054' },
    { firstName: 'Kofi', lastName: 'Mensah', admissionNo: 'GFA-2025-0055' },
    { firstName: 'Zara', lastName: 'Mohammed', admissionNo: 'GFA-2025-0056' },
    { firstName: 'Tunde', lastName: 'Ogunleye', admissionNo: 'GFA-2025-0057' },
    { firstName: 'Mary', lastName: 'Wanjiru', admissionNo: 'GFA-2025-0058' },
    { firstName: 'Chidi', lastName: 'Adebayo', admissionNo: 'GFA-2025-0059' },
    { firstName: 'Adaeze', lastName: 'Chukwu', admissionNo: 'GFA-2025-0060' },
    { firstName: 'Hassan', lastName: 'Ali', admissionNo: 'GFA-2025-0061' },
  ];

  const students: Array<{ id: string; admissionNo: string }> = [];
  for (const [index, s] of studentNames.entries()) {
    const classId = index % 2 === 0 ? grade10?.id : class8?.id;
    const record = await prisma.student.upsert({
      where: { schoolId_admissionNo: { schoolId: greenfield.id, admissionNo: s.admissionNo } },
      update: { firstName: s.firstName, lastName: s.lastName, classId: classId ?? undefined },
      create: {
        schoolId: greenfield.id,
        admissionNo: s.admissionNo,
        firstName: s.firstName,
        lastName: s.lastName,
        classId: classId ?? undefined,
        status: 'ACTIVE',
      },
    });
    students.push({ id: record.id, admissionNo: record.admissionNo });
  }

  await prisma.feeConcession.create({
    data: {
      schoolId: greenfield.id,
      studentId: students[1]!.id,
      scholarshipId: scholarships[0]!.id,
      discountPercent: 25,
      reason: 'Academic excellence',
      validUntil: new Date('2026-06-30'),
    },
  });

  const invoiceStatuses: InvoiceStatus[] = [
    'PAID', 'PAID', 'PAID', 'PAID', 'PAID', 'PAID', 'PAID', 'PAID',
    'PARTIAL', 'PARTIAL', 'PARTIAL', 'PARTIAL', 'PARTIAL', 'PARTIAL',
    'OVERDUE', 'OVERDUE', 'OVERDUE', 'OVERDUE', 'OVERDUE', 'OVERDUE',
  ];

  const mandatoryCodes = ['TUITION', 'ADMISSION', 'EXAM'];
  const invoices: Array<{ id: string; studentId: string; totalAmount: number; paidAmount: number; status: InvoiceStatus }> = [];

  for (let i = 0; i < 20; i++) {
    const student = students[i]!;
    const status = invoiceStatuses[i]!;
    let totalAmount = 0;
    const lineItems: Array<{ feeHeadId: string; description: string; amount: number }> = [];

    for (const code of mandatoryCodes) {
      const feeHeadId = feeHeadIds[code]!;
      const def = FEE_HEAD_DEFS.find((d) => d.code === code)!;
      lineItems.push({ feeHeadId, description: def.name, amount: def.amount });
      totalAmount += def.amount;
    }

    let paidAmount = 0;
    if (status === 'PAID') paidAmount = totalAmount;
    else if (status === 'PARTIAL') paidAmount = Math.round(totalAmount * 0.4);
    else paidAmount = 0;

    const dueDate =
      status === 'OVERDUE'
        ? new Date('2025-05-15')
        : new Date('2025-09-30');

    const invoice = await prisma.studentInvoice.create({
      data: {
        schoolId: greenfield.id,
        studentId: student.id,
        invoiceNo: `INV-${ACADEMIC_YEAR.replace('-', '')}-${String(i + 1).padStart(4, '0')}`,
        academicYear: ACADEMIC_YEAR,
        term: i % 2 === 0 ? 'Term 1' : 'Term 2',
        totalAmount,
        paidAmount,
        dueDate,
        status,
        lateFine: status === 'OVERDUE' ? 500 : 0,
        lineItems: { create: lineItems },
      },
    });

    invoices.push({ id: invoice.id, studentId: student.id, totalAmount, paidAmount, status });
  }

  const paymentMethods: PaymentMethod[] = ['UPI', 'CARD', 'NET_BANKING', 'CASH', 'UPI'];
  let paymentIndex = 0;

  for (const invoice of invoices) {
    if (paymentIndex >= 15) break;
    if (invoice.paidAmount <= 0) continue;

    await prisma.payment.create({
      data: {
        schoolId: greenfield.id,
        studentId: invoice.studentId,
        invoiceId: invoice.id,
        amount: invoice.paidAmount,
        method: paymentMethods[paymentIndex % paymentMethods.length]!,
        status: PaymentStatus.COMPLETED,
        transactionId: `TXN-${String(paymentIndex + 1).padStart(6, '0')}`,
        gatewayRef: `rzp_test_${paymentIndex + 1}`,
        receiptNo: `RCP-${String(paymentIndex + 1).padStart(5, '0')}`,
        paidAt: new Date('2025-08-01'),
        metadata: { source: 'seed', gateway: 'razorpay' },
      },
    });
    paymentIndex++;
  }

  await prisma.paymentGatewayConfig.create({
    data: {
      schoolId: greenfield.id,
      provider: 'razorpay',
      isEnabled: true,
      isTestMode: true,
      encryptedConfig: {
        keyId: 'rzp_test_xxxxxxxx',
        keySecret: '********',
        webhookSecret: '********',
      },
    },
  });
}

async function seedPortalData(greenfield: { id: string }): Promise<void> {
  const parentUser = await prisma.user.findUnique({
    where: { email: 'parent@greenfield.eduai365.ai' },
  });
  const teacherUser = await prisma.user.findUnique({
    where: { email: 'teacher@greenfield.eduai365.ai' },
  });

  const chioma = await prisma.student.findUnique({
    where: { schoolId_admissionNo: { schoolId: greenfield.id, admissionNo: 'GFA-2025-0042' } },
  });
  const james = await prisma.student.findUnique({
    where: { schoolId_admissionNo: { schoolId: greenfield.id, admissionNo: 'GFA-2025-0051' } },
  });

  if (parentUser && chioma) {
    await prisma.parentStudent.upsert({
      where: { parentId_studentId: { parentId: parentUser.id, studentId: chioma.id } },
      update: { relation: 'Mother' },
      create: { parentId: parentUser.id, studentId: chioma.id, relation: 'Mother' },
    });
  }

  if (parentUser && james) {
    await prisma.parentStudent.upsert({
      where: { parentId_studentId: { parentId: parentUser.id, studentId: james.id } },
      update: { relation: 'Guardian' },
      create: { parentId: parentUser.id, studentId: james.id, relation: 'Guardian' },
    });
  }

  void teacherUser;

  const midTerm = await prisma.exam.findFirst({
    where: { schoolId: greenfield.id, name: 'Mid-Term Examination' },
  });

  if (midTerm && chioma) {
    const subjects = await prisma.subject.findMany({
      where: {
        schoolId: greenfield.id,
        code: { in: ['MATH101', 'ENG101', 'SCI101', 'SOC101', 'PHY101', 'CHE101'] },
      },
    });

    const marksByCode: Record<string, number> = {
      MATH101: 88,
      ENG101: 92,
      SCI101: 85,
      SOC101: 78,
      PHY101: 81,
      CHE101: 76,
    };

    for (const subject of subjects) {
      const marks = marksByCode[subject.code] ?? 75;
      const maxMarks = subject.code === 'SOC101' ? 80 : 100;
      const pct = (marks / maxMarks) * 100;
      const grade =
        pct >= 90 ? 'A+' : pct >= 80 ? 'A' : pct >= 70 ? 'B+' : pct >= 60 ? 'B' : 'C';

      await prisma.examResult.upsert({
        where: {
          examId_studentId_subjectId: {
            examId: midTerm.id,
            studentId: chioma.id,
            subjectId: subject.id,
          },
        },
        update: { marksObtained: marks, maxMarks, grade },
        create: {
          examId: midTerm.id,
          studentId: chioma.id,
          subjectId: subject.id,
          marksObtained: marks,
          maxMarks,
          grade,
        },
      });
    }
  }

  const class8 = await prisma.class.findFirst({
    where: { schoolId: greenfield.id, name: 'Class 8', academicYear: ACADEMIC_YEAR },
  });

  if (class8 && james) {
    await prisma.student.update({
      where: { id: james.id },
      data: { classId: class8.id },
    });
  }

  // ─── Seed Attendance Records for past 30 days ───
  const today = new Date();
  for (let i = 0; i < 30; i++) {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
    if (date.getDay() === 0) continue; // Skip Sundays
    date.setHours(0, 0, 0, 0);

    const statusChioma = i % 15 === 0 ? 'ABSENT' : i % 25 === 0 ? 'LATE' : 'PRESENT';
    const statusJames = i % 12 === 0 ? 'ABSENT' : i % 20 === 0 ? 'LATE' : 'PRESENT';

    if (chioma) {
      await prisma.attendanceRecord.upsert({
        where: { studentId_date: { studentId: chioma.id, date } },
        update: { status: statusChioma, classId: chioma.classId ?? '' },
        create: {
          schoolId: greenfield.id,
          studentId: chioma.id,
          classId: chioma.classId ?? '',
          date,
          status: statusChioma,
        },
      });
    }

    if (james) {
      await prisma.attendanceRecord.upsert({
        where: { studentId_date: { studentId: james.id, date } },
        update: { status: statusJames, classId: james.classId ?? '' },
        create: {
          schoolId: greenfield.id,
          studentId: james.id,
          classId: james.classId ?? '',
          date,
          status: statusJames,
        },
      });
    }
  }

  // ─── Seed Parent Notifications (Inbox Messages) ───
  if (parentUser) {
    const logExists = await prisma.notificationLog.findFirst({
      where: { recipientId: parentUser.id, subject: 'Welcome to parent portal' },
    });
    if (!logExists) {
      await prisma.notificationLog.create({
        data: {
          schoolId: greenfield.id,
          channel: 'IN_APP',
          status: 'DELIVERED',
          recipientId: parentUser.id,
          recipientContact: parentUser.email,
          subject: 'Welcome to parent portal',
          body: 'Welcome to the eduAI365 parent portal. You can now track your child\'s academics, fees, and attendance.',
          sentAt: new Date(Date.now() - 259200000),
        },
      });

      await prisma.notificationLog.create({
        data: {
          schoolId: greenfield.id,
          channel: 'IN_APP',
          status: 'DELIVERED',
          recipientId: parentUser.id,
          recipientContact: parentUser.email,
          subject: 'Term 2 Fee Invoice Issued',
          body: 'Invoice INV-2025-001 for Term 2 tuition fee has been generated and is due on 30 June.',
          sentAt: new Date(Date.now() - 86400000),
        },
      });
    }
  }

  // ─── Seed Clubs & Club Memberships ───
  let scienceClub = await prisma.club.findFirst({
    where: { schoolId: greenfield.id, name: 'Science Club' },
  });
  if (!scienceClub) {
    scienceClub = await prisma.club.create({
      data: {
        schoolId: greenfield.id,
        name: 'Science Club',
        category: 'Academics',
        maxMembers: 50,
      },
    });
  }

  let debateClub = await prisma.club.findFirst({
    where: { schoolId: greenfield.id, name: 'Debate Society' },
  });
  if (!debateClub) {
    debateClub = await prisma.club.create({
      data: {
        schoolId: greenfield.id,
        name: 'Debate Society',
        category: 'Arts',
        maxMembers: 30,
      },
    });
  }

  if (chioma) {
    await prisma.clubMembership.upsert({
      where: { clubId_studentId: { clubId: scienceClub.id, studentId: chioma.id } },
      update: { status: 'ACTIVE' },
      create: {
        clubId: scienceClub.id,
        studentId: chioma.id,
        status: 'ACTIVE',
      },
    });

    await prisma.clubMembership.upsert({
      where: { clubId_studentId: { clubId: debateClub.id, studentId: chioma.id } },
      update: { status: 'ACTIVE' },
      create: {
        clubId: debateClub.id,
        studentId: chioma.id,
        status: 'ACTIVE',
      },
    });
  }
}

async function seedHrData(greenfield: { id: string }, demoPasswordHash: string): Promise<void> {
  const existing = await prisma.employeeProfile.count({ where: { schoolId: greenfield.id } });
  if (existing > 0) return;

  const extraStaff = [
    {
      email: 'physics.teacher@greenfield.eduai365.ai',
      firstName: 'Anita',
      lastName: 'Desai',
      role: 'TEACHER' as const,
      department: 'Science',
      designation: 'Physics Teacher',
      employmentType: 'TEACHING' as const,
    },
    {
      email: 'chemistry.teacher@greenfield.eduai365.ai',
      firstName: 'Rajesh',
      lastName: 'Kumar',
      role: 'TEACHER' as const,
      department: 'Science',
      designation: 'Chemistry Teacher',
      employmentType: 'TEACHING' as const,
    },
    {
      email: 'office.admin@greenfield.eduai365.ai',
      firstName: 'Helen',
      lastName: 'Obi',
      role: 'RECEPTIONIST' as const,
      department: 'Administration',
      designation: 'Office Administrator',
      employmentType: 'NON_TEACHING' as const,
    },
    {
      email: 'lab.assistant@greenfield.eduai365.ai',
      firstName: 'Mohammed',
      lastName: 'Yusuf',
      role: 'TEACHER' as const,
      department: 'Science',
      designation: 'Lab Assistant',
      employmentType: 'CONTRACT' as const,
    },
    {
      email: 'sports.coach@greenfield.eduai365.ai',
      firstName: 'Kevin',
      lastName: 'Osei',
      role: 'TEACHER' as const,
      department: 'Sports',
      designation: 'Sports Coach',
      employmentType: 'CONTRACT' as const,
    },
  ];

  for (const staff of extraStaff) {
    await createUser({
      email: staff.email,
      passwordHash: demoPasswordHash,
      firstName: staff.firstName,
      lastName: staff.lastName,
      role: staff.role,
      schoolId: greenfield.id,
    });
  }

  const staffDefs: Array<{
    email: string;
    employeeId: string;
    department: string;
    designation: string;
    employmentType: 'TEACHING' | 'NON_TEACHING' | 'CONTRACT';
    basicSalary: number;
    joinDate: string;
    dateOfBirth?: string;
  }> = [
    {
      email: 'principal@greenfield.eduai365.ai',
      employeeId: 'EMP-0001',
      department: 'Administration',
      designation: 'Principal',
      employmentType: 'TEACHING',
      basicSalary: 85000,
      joinDate: '2018-04-01',
      dateOfBirth: '1975-05-12',
    },
    {
      email: 'teacher@greenfield.eduai365.ai',
      employeeId: 'EMP-0002',
      department: 'Mathematics',
      designation: 'Senior Teacher',
      employmentType: 'TEACHING',
      basicSalary: 55000,
      joinDate: '2020-06-15',
      dateOfBirth: '1985-08-23',
    },
    {
      email: 'librarian@greenfield.eduai365.ai',
      employeeId: 'EMP-0003',
      department: 'Library',
      designation: 'Head Librarian',
      employmentType: 'NON_TEACHING',
      basicSalary: 42000,
      joinDate: '2019-08-01',
      dateOfBirth: '1990-11-04',
    },
    {
      email: 'accountant@greenfield.eduai365.ai',
      employeeId: 'EMP-0004',
      department: 'Finance',
      designation: 'Senior Accountant',
      employmentType: 'NON_TEACHING',
      basicSalary: 48000,
      joinDate: '2021-01-10',
      dateOfBirth: '1988-03-14',
    },
    {
      email: 'hr@greenfield.eduai365.ai',
      employeeId: 'EMP-0005',
      department: 'Human Resources',
      designation: 'HR Manager',
      employmentType: 'NON_TEACHING',
      basicSalary: 52000,
      joinDate: '2022-03-01',
      dateOfBirth: '1983-09-27',
    },
    {
      email: 'physics.teacher@greenfield.eduai365.ai',
      employeeId: 'EMP-0006',
      department: 'Science',
      designation: 'Physics Teacher',
      employmentType: 'TEACHING',
      basicSalary: 50000,
      joinDate: '2021-07-01',
      dateOfBirth: '1989-12-10',
    },
    {
      email: 'chemistry.teacher@greenfield.eduai365.ai',
      employeeId: 'EMP-0007',
      department: 'Science',
      designation: 'Chemistry Teacher',
      employmentType: 'TEACHING',
      basicSalary: 50000,
      joinDate: '2022-01-15',
      dateOfBirth: '1991-04-20',
    },
    {
      email: 'office.admin@greenfield.eduai365.ai',
      employeeId: 'EMP-0008',
      department: 'Administration',
      designation: 'Office Administrator',
      employmentType: 'NON_TEACHING',
      basicSalary: 35000,
      joinDate: '2023-05-01',
      dateOfBirth: '1995-02-28',
    },
    {
      email: 'lab.assistant@greenfield.eduai365.ai',
      employeeId: 'EMP-0009',
      department: 'Science',
      designation: 'Lab Assistant',
      employmentType: 'CONTRACT',
      basicSalary: 28000,
      joinDate: '2024-07-01',
      dateOfBirth: '1997-07-15',
    },
    {
      email: 'sports.coach@greenfield.eduai365.ai',
      employeeId: 'EMP-0010',
      department: 'Sports',
      designation: 'Sports Coach',
      employmentType: 'CONTRACT',
      basicSalary: 32000,
      joinDate: '2024-08-15',
      dateOfBirth: '1986-06-18',
    },
  ];

  const employeeUserIds: string[] = [];

  for (const def of staffDefs) {
    const user = await prisma.user.findUnique({ where: { email: def.email } });
    if (!user) continue;

    employeeUserIds.push(user.id);

    const hra = Math.round(def.basicSalary * 0.4);
    const da = Math.round(def.basicSalary * 0.2);

    await prisma.employeeProfile.create({
      data: {
        userId: user.id,
        schoolId: greenfield.id,
        employeeId: def.employeeId,
        department: def.department,
        designation: def.designation,
        joinDate: new Date(def.joinDate),
        bloodGroup: ['O+', 'A+', 'B+', 'AB+'][employeeUserIds.length % 4]!,
        qualifications: [{ degree: 'B.Ed', year: 2015 + (employeeUserIds.length % 5) }],
        payGrade: def.basicSalary >= 80000 ? 'Grade-I' : def.basicSalary >= 50000 ? 'Grade-II' : 'Grade-III',
        basicSalary: def.basicSalary,
        hra,
        da,
        pfPercent: 12,
        tdsPercent: 5,
        employmentType: def.employmentType,
        dateOfBirth: def.dateOfBirth ? new Date(def.dateOfBirth) : undefined,
      },
    });

    for (const [type, total] of [
      ['CL', 12],
      ['SL', 10],
      ['EL', 15],
    ] as const) {
      await prisma.leaveBalance.create({
        data: {
          employeeId: user.id,
          type,
          total,
          used: 0,
          remaining: total,
        },
      });
    }
  }

  const teacherUser = await prisma.user.findUnique({
    where: { email: 'teacher@greenfield.eduai365.ai' },
  });
  const physicsTeacher = await prisma.user.findUnique({
    where: { email: 'physics.teacher@greenfield.eduai365.ai' },
  });

  const pendingLeaves = [
    {
      employeeEmail: 'teacher@greenfield.eduai365.ai',
      type: 'CL' as const,
      startDate: '2025-06-20',
      endDate: '2025-06-22',
      days: 3,
      reason: 'Family wedding',
    },
    {
      employeeEmail: 'physics.teacher@greenfield.eduai365.ai',
      type: 'SL' as const,
      startDate: '2025-06-18',
      endDate: '2025-06-19',
      days: 2,
      reason: 'Medical appointment',
    },
    {
      employeeEmail: 'chemistry.teacher@greenfield.eduai365.ai',
      type: 'CL' as const,
      startDate: '2025-06-25',
      endDate: '2025-06-26',
      days: 2,
      reason: 'Personal work',
    },
    {
      employeeEmail: 'librarian@greenfield.eduai365.ai',
      type: 'EL' as const,
      startDate: '2025-07-01',
      endDate: '2025-07-05',
      days: 5,
      reason: 'Annual vacation',
    },
    {
      employeeEmail: 'lab.assistant@greenfield.eduai365.ai',
      type: 'CL' as const,
      startDate: '2025-06-17',
      endDate: '2025-06-17',
      days: 1,
      reason: 'Urgent personal matter',
    },
  ];

  for (const leave of pendingLeaves) {
    const emp = await prisma.user.findUnique({ where: { email: leave.employeeEmail } });
    if (!emp) continue;

    await prisma.leaveRequest.create({
      data: {
        schoolId: greenfield.id,
        employeeId: emp.id,
        type: leave.type,
        startDate: new Date(leave.startDate),
        endDate: new Date(leave.endDate),
        days: leave.days,
        reason: leave.reason,
        status: 'PENDING',
        substituteId:
          leave.employeeEmail === 'teacher@greenfield.eduai365.ai' && physicsTeacher
            ? physicsTeacher.id
            : undefined,
      },
    });
  }

  const payrollRun = await prisma.payrollRun.create({
    data: {
      schoolId: greenfield.id,
      month: 5,
      year: 2025,
      status: 'PROCESSED',
      processedAt: new Date('2025-06-01'),
    },
  });

  let totalPayable = 0;
  let totalPf = 0;
  let totalTds = 0;
  let netPayable = 0;

  const profiles = await prisma.employeeProfile.findMany({
    where: { schoolId: greenfield.id },
  });

  for (const emp of profiles) {
    const basic = Number(emp.basicSalary);
    const hra = Number(emp.hra);
    const da = Number(emp.da);
    const gross = basic + hra + da;
    const pf = Math.round(gross * 0.12 * 100) / 100;
    const tds = Math.round(gross * 0.05 * 100) / 100;
    const net = Math.round((gross - pf - tds) * 100) / 100;

    totalPayable += gross;
    totalPf += pf;
    totalTds += tds;
    netPayable += net;

    await prisma.payrollEntry.create({
      data: {
        payrollRunId: payrollRun.id,
        employeeId: emp.userId,
        basic,
        hra,
        da,
        pf,
        tds,
        net,
        status: 'PROCESSED',
      },
    });
  }

  await prisma.payrollRun.update({
    where: { id: payrollRun.id },
    data: { totalPayable, totalPf, totalTds, netPayable },
  });

  const class8 = await prisma.class.findFirst({
    where: { schoolId: greenfield.id, name: 'Class 8', academicYear: ACADEMIC_YEAR },
  });
  const class8SectionA = class8
    ? await prisma.section.findFirst({
        where: { classId: class8.id, name: 'A' },
      })
    : null;

  if (class8 && teacherUser && physicsTeacher) {
    const chemistryTeacher = await prisma.user.findUnique({
      where: { email: 'chemistry.teacher@greenfield.eduai365.ai' },
    });

    const subs = [
      {
        absentId: teacherUser.id,
        substituteId: physicsTeacher.id,
        period: 1,
        score: 0.92,
      },
      {
        absentId: teacherUser.id,
        substituteId: chemistryTeacher?.id ?? physicsTeacher.id,
        period: 3,
        score: 0.85,
      },
      {
        absentId: physicsTeacher.id,
        substituteId: teacherUser.id,
        period: 2,
        score: 0.88,
      },
    ];

    for (const sub of subs) {
      await prisma.substitutionAssignment.create({
        data: {
          schoolId: greenfield.id,
          absentTeacherId: sub.absentId,
          substituteTeacherId: sub.substituteId,
          classId: class8.id,
          sectionId: class8SectionA?.id,
          date: new Date('2025-06-17'),
          period: sub.period,
          status: 'ASSIGNED',
          aiMatchScore: sub.score,
        },
      });
    }
  }
}

async function seedOperationsData(
  greenfield: { id: string },
  demoPasswordHash: string,
): Promise<void> {
  const existing = await prisma.libraryBook.count({ where: { schoolId: greenfield.id } });
  if (existing > 0) return;

  await createUser({
    email: 'transport@greenfield.eduai365.ai',
    passwordHash: demoPasswordHash,
    firstName: 'Kofi',
    lastName: 'Mensah',
    role: 'TRANSPORT_MANAGER',
    schoolId: greenfield.id,
    phone: '+234-801-000-0008',
  });

  const teacher = await prisma.user.findUnique({
    where: { email: 'teacher@greenfield.eduai365.ai' },
  });
  const sportsCoach = await prisma.user.findUnique({
    where: { email: 'sports.coach@greenfield.eduai365.ai' },
  });

  const libraryBooks = [
    { title: 'Things Fall Apart', author: 'Chinua Achebe', isbn: '978-0435905489', category: 'Fiction', totalCopies: 5, shelf: 'A-01' },
    { title: 'Purple Hibiscus', author: 'Chimamanda Ngozi Adichie', isbn: '978-0007189885', category: 'Fiction', totalCopies: 4, shelf: 'A-02' },
    { title: 'Half of a Yellow Sun', author: 'Chimamanda Ngozi Adichie', isbn: '978-0007200283', category: 'Fiction', totalCopies: 3, shelf: 'A-03' },
    { title: 'Weep Not, Child', author: 'Ngugi wa Thiong\'o', isbn: '978-0435908305', category: 'Fiction', totalCopies: 4, shelf: 'A-04' },
    { title: 'The Alchemist', author: 'Paulo Coelho', isbn: '978-0061122415', category: 'Fiction', totalCopies: 6, shelf: 'A-05' },
    { title: 'Mathematics for Secondary Schools', author: 'J. Smith', isbn: '978-0198402423', category: 'Textbook', totalCopies: 10, shelf: 'B-01' },
    { title: 'Essential Physics', author: 'R. Johnson', isbn: '978-0521708203', category: 'Textbook', totalCopies: 8, shelf: 'B-02' },
    { title: 'Chemistry Principles', author: 'M. Brown', isbn: '978-0321910295', category: 'Textbook', totalCopies: 8, shelf: 'B-03' },
    { title: 'Biology Today', author: 'L. Green', isbn: '978-0133669510', category: 'Textbook', totalCopies: 7, shelf: 'B-04' },
    { title: 'World History Atlas', author: 'Oxford Press', isbn: '978-0199133641', category: 'Reference', totalCopies: 3, shelf: 'C-01' },
    { title: 'Oxford English Dictionary', author: 'Oxford Press', isbn: '978-0198611868', category: 'Reference', totalCopies: 2, shelf: 'C-02' },
    { title: 'A Brief History of Time', author: 'Stephen Hawking', isbn: '978-0553380163', category: 'Science', totalCopies: 4, shelf: 'D-01' },
    { title: 'Sapiens', author: 'Yuval Noah Harari', isbn: '978-0062316097', category: 'Science', totalCopies: 5, shelf: 'D-02' },
    { title: 'Coding for Kids', author: 'A. Patel', isbn: '978-1119555157', category: 'Technology', totalCopies: 6, shelf: 'E-01' },
    { title: 'Introduction to Python', author: 'G. van Rossum', isbn: '978-1593276034', category: 'Technology', totalCopies: 5, shelf: 'E-02' },
    { title: 'African Poetry Anthology', author: 'Various', isbn: '978-0435910100', category: 'Poetry', totalCopies: 4, shelf: 'F-01' },
    { title: 'Sports Science Handbook', author: 'FIFA Press', isbn: '978-3952338299', category: 'Sports', totalCopies: 3, shelf: 'G-01' },
    { title: 'Art & Design Basics', author: 'R. Turner', isbn: '978-0132943698', category: 'Arts', totalCopies: 4, shelf: 'H-01' },
    { title: 'Music Theory Fundamentals', author: 'B. White', isbn: '978-0849764465', category: 'Arts', totalCopies: 3, shelf: 'H-02' },
    { title: 'Environmental Studies', author: 'UNESCO', isbn: '978-9231034678', category: 'Science', totalCopies: 5, shelf: 'D-03' },
  ];

  const createdBooks: Array<{ id: string; availableCopies: number }> = [];
  for (const book of libraryBooks) {
    const record = await prisma.libraryBook.create({
      data: {
        schoolId: greenfield.id,
        ...book,
        availableCopies: book.totalCopies,
      },
    });
    createdBooks.push({ id: record.id, availableCopies: record.availableCopies });
  }

  const students = await prisma.student.findMany({
    where: { schoolId: greenfield.id },
    take: 15,
    orderBy: { admissionNo: 'asc' },
  });

  const issueDates = [
    { daysAgo: 5, dueIn: -3 },
    { daysAgo: 10, dueIn: -8 },
    { daysAgo: 3, dueIn: 11 },
    { daysAgo: 7, dueIn: 7 },
    { daysAgo: 14, dueIn: -5 },
    { daysAgo: 2, dueIn: 12 },
    { daysAgo: 20, dueIn: -15, returned: true },
    { daysAgo: 30, dueIn: -25, returned: true },
    { daysAgo: 1, dueIn: 13 },
    { daysAgo: 6, dueIn: 8 },
  ];

  for (const [index, issue] of issueDates.entries()) {
    const book = createdBooks[index % createdBooks.length]!;
    const student = students[index % students.length]!;
    const issuedAt = new Date();
    issuedAt.setDate(issuedAt.getDate() - issue.daysAgo);
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + issue.dueIn);

    await prisma.libraryIssue.create({
      data: {
        bookId: book.id,
        studentId: student.id,
        issuedAt,
        dueDate,
        returnedAt: issue.returned ? new Date() : undefined,
        fineAmount: issue.returned && issue.dueIn < 0 ? Math.abs(issue.dueIn) * 10 : undefined,
      },
    });

    if (!issue.returned) {
      await prisma.libraryBook.update({
        where: { id: book.id },
        data: { availableCopies: { decrement: 1 } },
      });
    }
  }

  const routes = [
    {
      name: 'North Route',
      code: 'NR-01',
      stops: [
        { name: 'City Centre', lat: 6.5244, lng: 3.3792 },
        { name: 'Victoria Island', lat: 6.4281, lng: 3.4219 },
        { name: 'Lekki Phase 1', lat: 6.4474, lng: 3.4700 },
      ],
      distanceKm: 18.5,
      driverName: 'Emmanuel Okon',
      driverPhone: '+234-803-111-0001',
      vehicle: { registrationNo: 'LAG-1234-AB', capacity: 45, gpsDeviceId: 'GPS-NR-001' },
    },
    {
      name: 'East Route',
      code: 'ER-02',
      stops: [
        { name: 'Surulere', lat: 6.4969, lng: 3.3534 },
        { name: 'Yaba', lat: 6.5158, lng: 3.3711 },
        { name: 'Mainland Gate', lat: 6.5355, lng: 3.3087 },
      ],
      distanceKm: 12.3,
      driverName: 'Fatima Bello',
      driverPhone: '+234-803-111-0002',
      vehicle: { registrationNo: 'LAG-5678-CD', capacity: 40, gpsDeviceId: 'GPS-ER-002' },
    },
    {
      name: 'West Route',
      code: 'WR-03',
      stops: [
        { name: 'Ikeja GRA', lat: 6.5833, lng: 3.3515 },
        { name: 'Allen Avenue', lat: 6.6018, lng: 3.3515 },
        { name: 'Ogba', lat: 6.6342, lng: 3.3369 },
      ],
      distanceKm: 15.7,
      driverName: 'John Adeyemi',
      driverPhone: '+234-803-111-0003',
      vehicle: { registrationNo: 'LAG-9012-EF', capacity: 50 },
    },
  ];

  const routeRecords: Array<{ id: string; stops: Array<{ name: string }> }> = [];
  for (const route of routes) {
    const record = await prisma.transportRoute.create({
      data: {
        schoolId: greenfield.id,
        name: route.name,
        code: route.code,
        stops: route.stops,
        distanceKm: route.distanceKm,
        driverName: route.driverName,
        driverPhone: route.driverPhone,
        vehicles: {
          create: route.vehicle,
        },
      },
    });
    routeRecords.push({ id: record.id, stops: route.stops });
  }

  for (const [index, student] of students.slice(0, 8).entries()) {
    const route = routeRecords[index % routeRecords.length]!;
    const stop = route.stops[index % route.stops.length]!;
    await prisma.studentTransport.create({
      data: {
        studentId: student.id,
        routeId: route.id,
        stopName: stop.name,
        pickupTime: `${6 + (index % 3)}:${index % 2 === 0 ? '30' : '00'}`,
      },
    });
  }

  const bloodGroups = ['O+', 'A+', 'B+', 'AB+', 'O-', 'A-'];
  for (const [index, student] of students.slice(0, 12).entries()) {
    await prisma.healthRecord.create({
      data: {
        studentId: student.id,
        bloodGroup: bloodGroups[index % bloodGroups.length],
        allergies: index % 4 === 0 ? ['Peanuts'] : index % 5 === 0 ? ['Dust', 'Pollen'] : [],
        vaccinations: [
          { name: 'BCG', date: '2010-05-01' },
          { name: 'MMR', date: '2012-08-15' },
          { name: 'COVID-19', date: '2021-06-20' },
        ],
        bmi: 18 + (index % 8),
        lastCheckup: new Date('2025-03-15'),
      },
    });
  }

  const infirmaryComplaints = [
    { complaint: 'Headache and fever', treatment: 'Paracetamol, rest advised', referred: false },
    { complaint: 'Sprained ankle during sports', treatment: 'Ice pack, bandage', referred: false },
    { complaint: 'Allergic reaction', treatment: 'Antihistamine administered', referred: true },
    { complaint: 'Stomach ache', treatment: 'Antacid, light diet', referred: false },
    { complaint: 'Minor cut on finger', treatment: 'Cleaned and bandaged', referred: false },
  ];

  for (const [index, visit] of infirmaryComplaints.entries()) {
    const student = students[index % students.length]!;
    await prisma.infirmaryVisit.create({
      data: {
        studentId: student.id,
        visitDate: new Date(`2025-06-${String(10 + index).padStart(2, '0')}`),
        ...visit,
      },
    });
  }

  const clubs = [
    { name: 'Science Club', category: 'Academic', advisorId: teacher?.id, maxMembers: 30 },
    { name: 'Debate Society', category: 'Academic', advisorId: teacher?.id, maxMembers: 25 },
    { name: 'Football Team', category: 'Sports', advisorId: sportsCoach?.id, maxMembers: 22 },
    { name: 'Drama Club', category: 'Arts', maxMembers: 20 },
    { name: 'Coding Club', category: 'Technology', maxMembers: 25 },
    { name: 'Environmental Club', category: 'Service', maxMembers: 30 },
  ];

  const clubRecords: Array<{ id: string; maxMembers: number }> = [];
  for (const club of clubs) {
    const record = await prisma.club.create({
      data: {
        schoolId: greenfield.id,
        name: club.name,
        category: club.category,
        advisorId: club.advisorId,
        maxMembers: club.maxMembers,
        memberCount: 0,
      },
    });
    clubRecords.push({ id: record.id, maxMembers: club.maxMembers });
  }

  for (const [clubIndex, club] of clubRecords.entries()) {
    const memberCount = Math.min(4 + clubIndex, club.maxMembers);
    for (let i = 0; i < memberCount; i++) {
      const student = students[(clubIndex * 2 + i) % students.length]!;
      await prisma.clubMembership.create({
        data: {
          clubId: club.id,
          studentId: student.id,
          status: 'ACTIVE',
        },
      });
    }
    await prisma.club.update({
      where: { id: club.id },
      data: { memberCount },
    });
  }

  const uniformItems = [
    { name: 'School Shirt', size: 'S', sku: 'UNI-SHT-S', stock: 50, price: 2500 },
    { name: 'School Shirt', size: 'M', sku: 'UNI-SHT-M', stock: 80, price: 2500 },
    { name: 'School Shirt', size: 'L', sku: 'UNI-SHT-L', stock: 60, price: 2500 },
    { name: 'School Trousers', size: 'S', sku: 'UNI-TRS-S', stock: 45, price: 3200 },
    { name: 'School Trousers', size: 'M', sku: 'UNI-TRS-M', stock: 70, price: 3200 },
    { name: 'School Skirt', size: 'S', sku: 'UNI-SKT-S', stock: 40, price: 2800 },
    { name: 'School Blazer', size: 'M', sku: 'UNI-BLZ-M', stock: 35, price: 5500 },
    { name: 'PE Kit', size: 'M', sku: 'UNI-PE-M', stock: 55, price: 3500 },
  ];

  const uniformRecords: Array<{ id: string; price: number; name: string; size: string }> = [];
  for (const item of uniformItems) {
    const record = await prisma.uniformItem.create({
      data: { schoolId: greenfield.id, ...item },
    });
    uniformRecords.push({
      id: record.id,
      price: Number(record.price),
      name: record.name,
      size: record.size,
    });
  }

  for (let i = 0; i < 3; i++) {
    const student = students[i]!;
    const shirt = uniformRecords[i % 3]!;
    const trousers = uniformRecords[3 + (i % 2)]!;
    const items = [
      { itemId: shirt.id, name: shirt.name, size: shirt.size, quantity: 2, unitPrice: shirt.price },
      { itemId: trousers.id, name: trousers.name, size: trousers.size, quantity: 1, unitPrice: trousers.price },
    ];
    const totalAmount = items.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
    await prisma.uniformOrder.create({
      data: {
        studentId: student.id,
        items,
        status: i === 0 ? 'PENDING' : 'CONFIRMED',
        totalAmount,
      },
    });
  }

  const bookstoreItems = [
    { title: 'Mathematics Class 8', isbn: '978-0198402423', classGrade: 'Class 8', price: 3500, stock: 40 },
    { title: 'English Reader Class 8', isbn: '978-0198369818', classGrade: 'Class 8', price: 2800, stock: 35 },
    { title: 'Science Class 8', isbn: '978-0198392588', classGrade: 'Class 8', price: 3200, stock: 30 },
    { title: 'Social Studies Class 8', isbn: '978-0198392595', classGrade: 'Class 8', price: 2600, stock: 25 },
    { title: 'Mathematics Grade 10', isbn: '978-0199138744', classGrade: 'Grade 10', price: 3800, stock: 30 },
    { title: 'Physics Grade 10', isbn: '978-0199138745', classGrade: 'Grade 10', price: 4000, stock: 28 },
    { title: 'Chemistry Grade 10', isbn: '978-0199138746', classGrade: 'Grade 10', price: 3900, stock: 28 },
    { title: 'Biology Grade 10', isbn: '978-0199138747', classGrade: 'Grade 10', price: 3700, stock: 25 },
  ];

  const bookstoreRecords: Array<{ id: string }> = [];
  for (const item of bookstoreItems) {
    const record = await prisma.bookstoreItem.create({
      data: { schoolId: greenfield.id, ...item },
    });
    bookstoreRecords.push({ id: record.id });
  }

  for (let i = 0; i < 4; i++) {
    const student = students[i + 5]!;
    const item = bookstoreRecords[i]!;
    await prisma.bookstoreIssue.create({
      data: {
        studentId: student.id,
        itemId: item.id,
        issuedAt: new Date(`2025-06-${String(1 + i).padStart(2, '0')}`),
        returnedAt: i < 2 ? new Date(`2025-06-${String(10 + i).padStart(2, '0')}`) : undefined,
        damageFine: i === 1 ? 500 : undefined,
      },
    });
    await prisma.bookstoreItem.update({
      where: { id: item.id },
      data: { stock: { decrement: 1 } },
    });
    if (i < 2) {
      await prisma.bookstoreItem.update({
        where: { id: item.id },
        data: { stock: { increment: 1 } },
      });
    }
  }
}

async function seedExtendedData(
  greenfield: { id: string },
  demoPasswordHash: string,
): Promise<void> {
  const existing = await prisma.asset.count({ where: { schoolId: greenfield.id } });
  if (existing > 0) return;

  await createUser({
    email: 'hostel.warden@greenfield.eduai365.ai',
    passwordHash: demoPasswordHash,
    firstName: 'Grace',
    lastName: 'Okonkwo',
    role: 'HOSTEL_WARDEN',
    schoolId: greenfield.id,
    phone: '+234-801-000-0010',
  });

  const teacher = await prisma.user.findUnique({
    where: { email: 'teacher@greenfield.eduai365.ai' },
  });
  const labAssistant = await prisma.user.findUnique({
    where: { email: 'lab.assistant@greenfield.eduai365.ai' },
  });

  const assets = [
    {
      name: 'Epson Projector X500',
      category: 'AV Equipment',
      serialNo: 'GF-PRJ-001',
      qrCode: 'QR-GF-PRJ-001',
      location: 'Main Hall',
      purchaseDate: new Date('2022-08-15'),
      value: 185000,
      depreciationRate: 15,
      status: 'AVAILABLE' as const,
    },
    {
      name: 'Dell OptiPlex Lab PC',
      category: 'Computers',
      serialNo: 'GF-PC-042',
      qrCode: 'QR-GF-PC-042',
      location: 'Computer Lab 1',
      purchaseDate: new Date('2023-01-10'),
      value: 420000,
      depreciationRate: 20,
      status: 'AVAILABLE' as const,
    },
    {
      name: 'HP LaserJet Pro',
      category: 'Office Equipment',
      serialNo: 'GF-PRT-007',
      location: 'Admin Office',
      purchaseDate: new Date('2021-11-20'),
      value: 95000,
      depreciationRate: 10,
      status: 'CHECKED_OUT' as const,
    },
    {
      name: 'Microscope Set (x10)',
      category: 'Lab Equipment',
      serialNo: 'GF-LAB-MS-01',
      location: 'Biology Lab',
      purchaseDate: new Date('2020-06-01'),
      value: 320000,
      depreciationRate: 12,
      status: 'AVAILABLE' as const,
    },
    {
      name: 'Student Desk & Chair Set',
      category: 'Furniture',
      serialNo: 'GF-FUR-120',
      location: 'Store Room B',
      purchaseDate: new Date('2019-09-01'),
      value: 45000,
      depreciationRate: 8,
      status: 'MAINTENANCE' as const,
    },
  ];

  const createdAssets: Array<{ id: string; status: string }> = [];
  for (const asset of assets) {
    const record = await prisma.asset.create({
      data: { schoolId: greenfield.id, ...asset },
    });
    createdAssets.push({ id: record.id, status: record.status });
  }

  if (teacher && labAssistant) {
    const checkedOutAsset = createdAssets.find((a) => a.status === 'CHECKED_OUT');
    if (checkedOutAsset) {
      await prisma.assetCheckout.create({
        data: {
          assetId: checkedOutAsset.id,
          employeeId: teacher.id,
          checkedOutAt: new Date('2025-06-10'),
        },
      });
    }
  }

  const alumniProfiles = [
    {
      name: 'Adaeze Nwankwo',
      batchYear: 2018,
      profession: 'Software Engineer',
      email: 'adaeze.nw@alumni.greenfield.edu',
      phone: '+234-802-100-2001',
      city: 'Lagos',
      country: 'Nigeria',
      linkedin: 'https://linkedin.com/in/adaezenw',
    },
    {
      name: 'Chukwuemeka Okafor',
      batchYear: 2016,
      profession: 'Medical Doctor',
      email: 'emeka.ok@alumni.greenfield.edu',
      phone: '+234-803-200-3002',
      city: 'Abuja',
      country: 'Nigeria',
    },
    {
      name: 'Fatima Bello',
      batchYear: 2020,
      profession: 'Architect',
      email: 'fatima.b@alumni.greenfield.edu',
      phone: '+234-804-300-4003',
      city: 'Kano',
      country: 'Nigeria',
      linkedin: 'https://linkedin.com/in/fatimabello',
    },
    {
      name: 'James Osei',
      batchYear: 2015,
      profession: 'Investment Banker',
      email: 'james.o@alumni.greenfield.edu',
      phone: '+233-20-400-5004',
      city: 'Accra',
      country: 'Ghana',
    },
    {
      name: 'Priya Sharma',
      batchYear: 2019,
      profession: 'Data Scientist',
      email: 'priya.s@alumni.greenfield.edu',
      phone: '+91-98765-43210',
      city: 'Mumbai',
      country: 'India',
    },
  ];

  for (const profile of alumniProfiles) {
    await prisma.alumniProfile.create({
      data: { schoolId: greenfield.id, ...profile },
    });
  }

  await prisma.alumniCampaign.createMany({
    data: [
      {
        schoolId: greenfield.id,
        title: 'Class of 2018 Scholarship Fund',
        goal: 5000000,
        raised: 1850000,
        status: 'ACTIVE',
      },
      {
        schoolId: greenfield.id,
        title: 'New Science Lab Equipment',
        goal: 12000000,
        raised: 4200000,
        status: 'ACTIVE',
      },
      {
        schoolId: greenfield.id,
        title: 'Sports Complex Renovation',
        goal: 8000000,
        raised: 8000000,
        status: 'COMPLETED',
      },
    ],
  });

  const blockA = await prisma.hostelBlock.create({
    data: { schoolId: greenfield.id, name: 'Boys Hostel Block A', code: 'BHA' },
  });
  const blockB = await prisma.hostelBlock.create({
    data: { schoolId: greenfield.id, name: 'Girls Hostel Block B', code: 'GHB' },
  });

  const roomsA = await Promise.all([
    prisma.hostelRoom.create({
      data: { blockId: blockA.id, roomNumber: '101', capacity: 4, floor: 1 },
    }),
    prisma.hostelRoom.create({
      data: { blockId: blockA.id, roomNumber: '102', capacity: 4, floor: 1 },
    }),
    prisma.hostelRoom.create({
      data: { blockId: blockA.id, roomNumber: '201', capacity: 2, floor: 2 },
    }),
  ]);

  const roomsB = await Promise.all([
    prisma.hostelRoom.create({
      data: { blockId: blockB.id, roomNumber: '101', capacity: 4, floor: 1 },
    }),
    prisma.hostelRoom.create({
      data: { blockId: blockB.id, roomNumber: '102', capacity: 4, floor: 1 },
    }),
  ]);

  const students = await prisma.student.findMany({
    where: { schoolId: greenfield.id },
    take: 6,
    orderBy: { admissionNo: 'asc' },
  });

  for (const [index, student] of students.slice(0, 4).entries()) {
    const room = index < 2 ? roomsA[index]! : roomsB[index - 2]!;
    await prisma.hostelResident.create({
      data: {
        studentId: student.id,
        roomId: room.id,
        checkIn: new Date('2025-01-15'),
      },
    });
  }

  if (students[4]) {
    await prisma.hostelResident.create({
      data: {
        studentId: students[4].id,
        roomId: roomsA[0]!.id,
        checkIn: new Date('2024-08-01'),
        checkOut: new Date('2025-05-31'),
      },
    });
  }

  const inventoryItems = [
    { name: 'A4 Copy Paper (Ream)', sku: 'INV-PPR-A4', category: 'Stationery', quantity: 120, reorderLevel: 30 },
    { name: 'Whiteboard Markers (Box)', sku: 'INV-MKR-WB', category: 'Stationery', quantity: 18, reorderLevel: 10 },
    { name: 'Hand Sanitizer (5L)', sku: 'INV-SAN-5L', category: 'Hygiene', quantity: 8, reorderLevel: 12 },
    { name: 'Science Lab Gloves (Box)', sku: 'INV-GLV-LAB', category: 'Lab Supplies', quantity: 45, reorderLevel: 20 },
    { name: 'Printer Toner Cartridge', sku: 'INV-TNR-HP', category: 'Office Supplies', quantity: 5, reorderLevel: 8 },
    { name: 'Cleaning Detergent (20L)', sku: 'INV-DET-20L', category: 'Maintenance', quantity: 15, reorderLevel: 5 },
    { name: 'First Aid Bandages (Pack)', sku: 'INV-FA-BND', category: 'Medical', quantity: 22, reorderLevel: 10 },
    { name: 'Sports Cones (Set of 10)', sku: 'INV-SPT-CNE', category: 'Sports', quantity: 6, reorderLevel: 4 },
  ];

  for (const item of inventoryItems) {
    await prisma.inventoryItem.create({
      data: { schoolId: greenfield.id, ...item },
    });
  }
}

async function seedCommsData(greenfield: { id: string }): Promise<void> {
  const existing = await prisma.notice.count({ where: { schoolId: greenfield.id } });
  if (existing > 0) return;

  const principal = await prisma.user.findUnique({
    where: { email: 'principal@greenfield.eduai365.ai' },
  });
  const parent = await prisma.user.findUnique({
    where: { email: 'parent@greenfield.eduai365.ai' },
  });
  const grade10 = await prisma.class.findFirst({
    where: { schoolId: greenfield.id, name: 'Grade 10' },
  });

  if (!principal) return;

  const notices = [
    {
      title: 'Mid-Term Examination Schedule',
      body: 'Mid-term exams begin Monday, 23 June. Students must report by 8:00 AM with hall tickets.',
      category: 'EXAM' as const,
      isPinned: true,
    },
    {
      title: 'Annual Sports Day — 28 June',
      body: 'All students are invited to participate in the annual sports day. House-wise events start at 9:00 AM.',
      category: 'SPORTS' as const,
      isPinned: false,
    },
    {
      title: 'Independence Day Holiday',
      body: 'School will remain closed on 1 October for Independence Day celebrations.',
      category: 'HOLIDAY' as const,
      isPinned: false,
    },
    {
      title: 'Science Fair Registration Open',
      body: 'Register your projects with class teachers by Friday. Themes: sustainability and innovation.',
      category: 'ACADEMIC' as const,
      isPinned: false,
    },
    {
      title: 'Parent-Teacher Meeting Reminder',
      body: 'PTM scheduled for Saturday, 5 July from 10:00 AM to 1:00 PM in the main auditorium.',
      category: 'GENERAL' as const,
      isPinned: true,
    },
  ];

  for (const notice of notices) {
    await prisma.notice.create({
      data: {
        schoolId: greenfield.id,
        createdById: principal.id,
        ...notice,
      },
    });
  }

  const circular = await prisma.circular.create({
    data: {
      schoolId: greenfield.id,
      title: 'Fee Payment Reminder — Term 2',
      body: 'Term 2 fees are due by 30 June. Pay online via the parent portal or at the accounts office.',
      audienceFilter: grade10
        ? { classIds: [grade10.id], roles: ['PARENT'] }
        : { roles: ['PARENT'] },
      createdById: principal.id,
    },
  });

  const campaign = await prisma.broadcastCampaign.create({
    data: {
      schoolId: greenfield.id,
      title: 'Welcome Back — New Term',
      message: 'Welcome back to Greenfield Academy! We wish you a productive and joyful term ahead.',
      channels: ['EMAIL', 'IN_APP'],
      audienceFilter: { roles: ['STUDENT', 'PARENT'] },
      status: 'COMPLETED',
      sentAt: new Date('2025-06-01'),
      createdById: principal.id,
      totalRecipients: 6,
      deliveredCount: 5,
      failedCount: 1,
    },
  });

  const students = await prisma.student.findMany({
    where: { schoolId: greenfield.id },
    take: 3,
    include: { user: true },
  });

  const now = new Date();
  for (const [index, student] of students.entries()) {
    if (!student.user) continue;
    await prisma.notificationLog.create({
      data: {
        schoolId: greenfield.id,
        channel: 'IN_APP',
        status: 'DELIVERED',
        recipientId: student.user.id,
        recipientContact: student.user.email,
        subject: campaign.title,
        body: campaign.message,
        campaignId: campaign.id,
        sentAt: now,
        deliveredAt: now,
      },
    });
    await prisma.notificationLog.create({
      data: {
        schoolId: greenfield.id,
        channel: index === 0 ? 'SMS' : 'EMAIL',
        status: index === 0 ? 'FAILED' : 'DELIVERED',
        recipientId: student.user.id,
        recipientContact: index === 0 ? student.user.email : student.user.email,
        subject: circular.title,
        body: circular.body,
        circularId: circular.id,
        sentAt: now,
        deliveredAt: index === 0 ? undefined : now,
        failedAt: index === 0 ? now : undefined,
        errorMessage: index === 0 ? 'Missing valid phone number' : undefined,
      },
    });
  }

  if (parent) {
    const thread = await prisma.complaintThread.create({
      data: {
        schoolId: greenfield.id,
        subject: 'Bus pickup delay on East Route',
        description: 'The school bus on East Route has been arriving 20 minutes late for the past week.',
        status: 'UNDER_REVIEW',
        submittedById: parent.id,
        assignedToId: principal.id,
        messages: {
          create: [
            {
              senderId: parent.id,
              body: 'The school bus on East Route has been arriving 20 minutes late for the past week.',
              isStaffReply: false,
            },
            {
              senderId: principal.id,
              body: 'Thank you for reporting this. We have contacted the transport manager and will update you within 48 hours.',
              isStaffReply: true,
            },
          ],
        },
      },
    });
    void thread;
  }
}

async function createUser(params: {
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  schoolId?: string | null;
  phone?: string;
}): Promise<void> {
  await prisma.user.upsert({
    where: { email: params.email },
    update: {
      passwordHash: params.passwordHash,
      firstName: params.firstName,
      lastName: params.lastName,
      role: params.role,
      schoolId: params.schoolId ?? null,
      phone: params.phone,
      isActive: true,
    },
    create: {
      email: params.email,
      passwordHash: params.passwordHash,
      firstName: params.firstName,
      lastName: params.lastName,
      role: params.role,
      schoolId: params.schoolId ?? null,
      phone: params.phone,
      isActive: true,
    },
  });
}

async function main(): Promise<void> {
  console.log('Seeding eduAI365 database...');

  const [adminPasswordHash, demoPasswordHash] = await Promise.all([
    hashPassword('AlgoAdmin#2026'),
    hashPassword('AlgoDemo#2026'),
  ]);

  const permissionIdByCode = await seedPermissions();
  await seedRolePermissions(permissionIdByCode);
  const planIdByCode = await seedPlans();

  await createUser({
    email: 'admin@eduai365.ai',
    passwordHash: adminPasswordHash,
    firstName: 'Super',
    lastName: 'Admin',
    role: 'SUPER_ADMIN',
    schoolId: null,
  });

  const greenfield = await prisma.school.upsert({
    where: { slug: 'greenfield' },
    update: {
      name: 'Greenfield Academy',
      plan: 'PRO',
      isVerified: true,
      isActive: true,
      primaryColor: '#16a34a',
      domain: 'greenfield.eduai365.ai',
      studentCount: 850,
      settings: { timezone: 'Africa/Lagos', locale: 'en-NG' },
    },
    create: {
      name: 'Greenfield Academy',
      slug: 'greenfield',
      plan: 'PRO',
      isVerified: true,
      isActive: true,
      primaryColor: '#16a34a',
      domain: 'greenfield.eduai365.ai',
      studentCount: 850,
      settings: { timezone: 'Africa/Lagos', locale: 'en-NG' },
    },
  });

  const summit = await prisma.school.upsert({
    where: { slug: 'summit' },
    update: {
      name: 'Summit International',
      plan: 'ENTERPRISE',
      isVerified: true,
      isActive: true,
      primaryColor: '#2563eb',
      domain: 'summit.eduai365.ai',
      studentCount: 3200,
      settings: { timezone: 'Africa/Nairobi', locale: 'en-KE' },
    },
    create: {
      name: 'Summit International',
      slug: 'summit',
      plan: 'ENTERPRISE',
      isVerified: true,
      isActive: true,
      primaryColor: '#2563eb',
      domain: 'summit.eduai365.ai',
      studentCount: 3200,
      settings: { timezone: 'Africa/Nairobi', locale: 'en-KE' },
    },
  });

  const stJudes = await prisma.school.upsert({
    where: { slug: 'st-judes' },
    update: {
      name: "St Jude's Primary",
      plan: 'CORE',
      isVerified: true,
      isActive: true,
      primaryColor: '#dc2626',
      domain: 'st-judes.eduai365.ai',
      studentCount: 420,
      settings: { timezone: 'Africa/Accra', locale: 'en-GH' },
    },
    create: {
      name: "St Jude's Primary",
      slug: 'st-judes',
      plan: 'CORE',
      isVerified: true,
      isActive: true,
      primaryColor: '#dc2626',
      domain: 'st-judes.eduai365.ai',
      studentCount: 420,
      settings: { timezone: 'Africa/Accra', locale: 'en-GH' },
    },
  });

  for (const [school, planCode] of [
    [greenfield, 'PRO'],
    [summit, 'ENTERPRISE'],
    [stJudes, 'CORE'],
  ] as const) {
    const planId = planIdByCode.get(planCode);
    if (!planId) continue;

    const existing = await prisma.subscription.findFirst({
      where: { schoolId: school.id, status: 'ACTIVE' },
    });

    if (!existing) {
      const plan = PLANS.find((p) => p.code === planCode)!;
      await prisma.subscription.create({
        data: {
          schoolId: school.id,
          planId,
          status: 'ACTIVE',
          mrr: plan.priceMonthly,
        },
      });
    }
  }

  const greenfieldUsers = [
    {
      email: 'principal@greenfield.eduai365.ai',
      firstName: 'Amara',
      lastName: 'Okafor',
      role: 'PRINCIPAL' as const,
      phone: '+234-801-000-0001',
    },
    {
      email: 'teacher@greenfield.eduai365.ai',
      firstName: 'David',
      lastName: 'Mensah',
      role: 'TEACHER' as const,
      phone: '+234-801-000-0002',
    },
    {
      email: 'student@greenfield.eduai365.ai',
      firstName: 'Chioma',
      lastName: 'Adeyemi',
      role: 'STUDENT' as const,
    },
    {
      email: 'parent@greenfield.eduai365.ai',
      firstName: 'Fatima',
      lastName: 'Adeyemi',
      role: 'PARENT' as const,
      phone: '+234-801-000-0003',
    },
    {
      email: 'librarian@greenfield.eduai365.ai',
      firstName: 'Grace',
      lastName: 'Wanjiru',
      role: 'LIBRARIAN' as const,
      phone: '+234-801-000-0004',
    },
    {
      email: 'admission@greenfield.eduai365.ai',
      firstName: 'Samuel',
      lastName: 'Eze',
      role: 'RECEPTIONIST' as const,
      phone: '+234-801-000-0005',
    },
    {
      email: 'accountant@greenfield.eduai365.ai',
      firstName: 'Ngozi',
      lastName: 'Okonkwo',
      role: 'ACCOUNTANT' as const,
      phone: '+234-801-000-0006',
    },
    {
      email: 'hr@greenfield.eduai365.ai',
      firstName: 'Rashmi',
      lastName: 'Patel',
      role: 'HR_MANAGER' as const,
      phone: '+234-801-000-0007',
    },
  ];

  for (const user of greenfieldUsers) {
    await createUser({
      ...user,
      passwordHash: demoPasswordHash,
      schoolId: greenfield.id,
    });
  }

  await createUser({
    email: 'admin@summit.eduai365.ai',
    passwordHash: demoPasswordHash,
    firstName: 'James',
    lastName: 'Kamau',
    role: 'SCHOOL_ADMIN',
    schoolId: summit.id,
    phone: '+254-712-000-0001',
  });

  await createUser({
    email: 'admin@st-judes.eduai365.ai',
    passwordHash: demoPasswordHash,
    firstName: 'Mary',
    lastName: 'Boateng',
    role: 'SCHOOL_ADMIN',
    schoolId: stJudes.id,
    phone: '+233-24-000-0001',
  });

  const grade10 = await prisma.class.upsert({
    where: {
      schoolId_name_academicYear: {
        schoolId: greenfield.id,
        name: 'Grade 10',
        academicYear: '2025-2026',
      },
    },
    update: { grade: '10', isActive: true },
    create: {
      schoolId: greenfield.id,
      name: 'Grade 10',
      grade: '10',
      academicYear: '2025-2026',
      isActive: true,
    },
  });

  const sectionA = await prisma.section.upsert({
    where: { classId_name: { classId: grade10.id, name: 'A' } },
    update: { isActive: true, capacity: 40 },
    create: {
      schoolId: greenfield.id,
      classId: grade10.id,
      name: 'A',
      capacity: 40,
      isActive: true,
    },
  });

  const mainMathSub = await prisma.subject.findFirst({
    where: { schoolId: greenfield.id, code: 'MATH101' },
  });
  if (mainMathSub) {
    await prisma.subject.update({
      where: { id: mainMathSub.id },
      data: { name: 'Mathematics', isActive: true },
    });
  } else {
    await prisma.subject.create({
      data: {
        schoolId: greenfield.id,
        name: 'Mathematics',
        code: 'MATH101',
        isActive: true,
      },
    });
  }

  const mainEngSub = await prisma.subject.findFirst({
    where: { schoolId: greenfield.id, code: 'ENG101' },
  });
  if (mainEngSub) {
    await prisma.subject.update({
      where: { id: mainEngSub.id },
      data: { name: 'English Language', isActive: true },
    });
  } else {
    await prisma.subject.create({
      data: {
        schoolId: greenfield.id,
        name: 'English Language',
        code: 'ENG101',
        isActive: true,
      },
    });
  }

  const studentUser = await prisma.user.findUnique({
    where: { email: 'student@greenfield.eduai365.ai' },
  });

  if (studentUser) {
    await prisma.student.upsert({
      where: { schoolId_admissionNo: { schoolId: greenfield.id, admissionNo: 'GFA-2025-0042' } },
      update: {
        firstName: 'Chioma',
        lastName: 'Adeyemi',
        userId: studentUser.id,
        classId: grade10.id,
        sectionId: sectionA.id,
        status: 'ACTIVE',
      },
      create: {
        schoolId: greenfield.id,
        userId: studentUser.id,
        admissionNo: 'GFA-2025-0042',
        firstName: 'Chioma',
        lastName: 'Adeyemi',
        classId: grade10.id,
        sectionId: sectionA.id,
        status: 'ACTIVE',
      },
    });
  }

  await seedAcademicsData(greenfield);
  await seedFinanceData(greenfield);
  await seedPortalData(greenfield);
  await seedHrData(greenfield, demoPasswordHash);
  await seedOperationsData(greenfield, demoPasswordHash);
  await seedExtendedData(greenfield, demoPasswordHash);
  await seedCommsData(greenfield);

  console.log('Seed completed successfully.');
  console.log('  Super Admin: admin@eduai365.ai / AlgoAdmin#2026');
  console.log('  Demo users:  AlgoDemo#2026');
}

main()
  .catch((error: unknown) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
