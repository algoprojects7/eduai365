'use client';

import { useEffect, useState } from 'react';
import { Badge, TabGroup } from '@eduai365/ui';
import {
  AlertTriangle,
  Award,
  CheckCircle,
  FileSpreadsheet,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { ParentShell } from '@/components/parent-shell';
import { apiFetch } from '@/lib/api';
import type { ParentChild, ParentDashboard } from '@/types/parent';

interface ExamResultEntry {
  subject: string;
  score: number;
  marksObtained: number;
  maxMarks: number;
  grade: string;
  remarks: string;
}

interface ExamGroup {
  exam: {
    id: string;
    name: string;
    term: string;
    academicYear: string;
  };
  results: ExamResultEntry[];
}

export default function ParentResultsPage() {
  const [dashboard, setDashboard] = useState<ParentDashboard | null>(null);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [examsData, setExamsData] = useState<ExamGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [childLoading, setChildLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('Sessional');

  const TABS = ['Sessional', 'Half Yearly', 'Annual'];

  // 1. Load dashboard context to get children list
  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      try {
        const dash = await apiFetch<ParentDashboard>('/parent/dashboard');
        if (!cancelled) {
          const rawDash = dash as {
            parentName?: string;
            children?: Array<{
              id?: string;
              name?: string;
              firstName?: string;
              lastName?: string;
              class?: string;
              className?: string;
              section?: string;
            }>;
          };
          const normalisedChildren = Array.isArray(rawDash.children)
            ? rawDash.children.map((child) => {
                const nameParts = (child.name ?? '').split(' ');
                const firstName = child.firstName ?? nameParts[0] ?? '';
                const lastName = child.lastName ?? nameParts.slice(1).join(' ') ?? '';
                return {
                  id: child.id ?? '',
                  firstName,
                  lastName,
                  className: child.className ?? child.class ?? 'Unassigned',
                  section: child.section ?? '',
                };
              })
            : [];

          const normalisedDashboard: ParentDashboard = {
            parentName: rawDash.parentName ?? 'Parent',
            children: normalisedChildren,
          };

          setDashboard(normalisedDashboard);
          if (normalisedChildren.length > 0) {
            setSelectedChildId(normalisedChildren[0]?.id ?? null);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadDashboard();
    return () => {
      cancelled = true;
    };
  }, []);

  // 2. Load child-specific results when selectedChildId changes
  useEffect(() => {
    if (!selectedChildId) return;

    let cancelled = false;
    setChildLoading(true);
    setError(null);

    async function loadResults() {
      try {
        const response = await apiFetch<ExamGroup[]>(`/parent/children/${selectedChildId}/results`);
        if (!cancelled) {
          setExamsData(Array.isArray(response) ? response : []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load exam results');
        }
      } finally {
        if (!cancelled) {
          setChildLoading(false);
        }
      }
    }

    void loadResults();
    return () => {
      cancelled = true;
    };
  }, [selectedChildId]);

  const selectedChild = dashboard?.children.find((c) => c.id === selectedChildId);

  // Find result matching selected tab name (case-insensitive includes)
  const activeGroup = examsData.find((group) =>
    group.exam.name.toLowerCase().includes(activeTab.toLowerCase())
  );

  // Compute aggregate stats for the active exam
  const totalObtained = activeGroup?.results.reduce((sum, r) => sum + r.marksObtained, 0) ?? 0;
  const totalMax = activeGroup?.results.reduce((sum, r) => sum + r.maxMarks, 0) ?? 0;
  const overallPercentage = totalMax > 0 ? Math.round((totalObtained / totalMax) * 100) : 0;

  const getOverallGrade = (pct: number): string => {
    if (pct >= 90) return 'A+';
    if (pct >= 80) return 'A';
    if (pct >= 70) return 'B';
    if (pct >= 60) return 'C';
    if (pct >= 50) return 'D';
    return 'F';
  };

  // Track progress of subjects over exams (X-axis: Subjects, Y-axis: Marks Obtained)
  const progressChartData = (() => {
    const subjectsMap = new Map<string, Record<string, string | number>>();
    for (const group of examsData) {
      const examLabel = group.exam.name.replace(' Exam', '');
      for (const r of group.results) {
        if (!subjectsMap.has(r.subject)) {
          subjectsMap.set(r.subject, { subject: r.subject });
        }
        subjectsMap.get(r.subject)![examLabel] = r.score;
      }
    }
    return Array.from(subjectsMap.values());
  })();

  // Find weak subjects (score < 85)
  const weakSubjects = activeGroup?.results.filter((r) => r.score < 85) ?? [];

  const getImprovementTips = (subject: string): string[] => {
    const subLower = subject.toLowerCase();
    if (subLower.includes('sci')) {
      return [
        'Encourage reviewing core molecular structures and lab procedures together.',
        'Practice balance-of-equations questions and molecular weight calculations.',
        'Devote 20 minutes daily to active recall of biology taxonomy definitions.'
      ];
    }
    if (subLower.includes('phys')) {
      return [
        'Practice mathematical physics word problems daily.',
        'Help them draw clear force/field vector diagrams to visualize conceptual problems.',
        'Utilize formula cheat sheets to reinforce retention of kinematic laws.'
      ];
    }
    if (subLower.includes('chem')) {
      return [
        'Draw organic chain formulas and chemical groups regularly.',
        'Solve previous exam papers focusing on stoichiometry and periodic table rules.',
        'Help them join the chemistry peer study group to discuss complex chemical reactions.'
      ];
    }
    if (subLower.includes('biol')) {
      return [
        'Practice anatomy diagram labeling twice a week.',
        'Create structural flowcharts for photosynthesis and cellular cycles.',
        'Create biology flashcards for complex vocabulary terms.'
      ];
    }
    if (subLower.includes('math')) {
      return [
        'Solve at least 15 algebraic and geometric exercises daily.',
        'Encourage attempting practice tests under timed conditions to improve speed.',
        'Discuss hard calculus concepts with the teacher during office hours.'
      ];
    }
    if (subLower.includes('hin') || subLower.includes('lang') || subLower.includes('eng')) {
      return [
        'Practice comprehension exercises and grammar worksheets.',
        'Write short essays weekly to improve flow and structural writing.',
        'Read editorial articles to expand vocabulary and literary grasp.'
      ];
    }
    return [
      'Allocate 30 minutes of targeted daily study time for this subject.',
      'Review previous tests and homework errors to identify recurring patterns.',
      'Discuss challenging concepts with the course teacher after classes.'
    ];
  };

  return (
    <ParentShell>
      <div className="space-y-8">
        <header>
          <div className="flex items-center gap-2">
            <Award className="h-6 w-6 text-primary" strokeWidth={1.5} />
            <h1 className="text-headline-lg font-bold text-on-surface">Academic Results</h1>
          </div>
          <p className="mt-1 text-body-md text-on-surface-variant">
            View grades, marks breakdown, and check performance growth trends across sessional and term examinations for your children.
          </p>
        </header>

        {loading && (
          <div className="bento-card py-16 text-center text-on-surface-variant">
            Loading portal data…
          </div>
        )}

        {error && !loading && (
          <div className="rounded-lg bg-error/10 px-4 py-3 text-body-md text-error">{error}</div>
        )}

        {dashboard && !loading && (
          <>
            {/* Child selector */}
            {dashboard.children.length > 0 && (
              <TabGroup
                tabs={dashboard.children.map((child: ParentChild) => ({
                  id: child.id,
                  label: `${child.firstName} (${child.className}${child.section})`,
                }))}
                activeTab={selectedChildId ?? dashboard.children[0]?.id ?? ''}
                onChange={setSelectedChildId}
              />
            )}

            {childLoading && (
              <div className="bento-card py-16 text-center text-on-surface-variant">
                Loading {selectedChild?.firstName ?? 'child'}&apos;s results…
              </div>
            )}

            {!childLoading && !error && selectedChild && (
              <>
                {/* Tab Navigation for exam terms */}
                <div className="flex gap-2 border-b border-surface-container-high pb-1">
                  {TABS.map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`rounded-t-lg px-5 py-2.5 text-body-md font-semibold transition-all ${
                        activeTab === tab
                          ? 'border-b-2 border-primary text-primary font-bold'
                          : 'text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {/* If Results available, show them. Else show placeholder message */}
                {!activeGroup ? (
                  <div className="bento-card py-16 text-center text-on-surface-variant flex flex-col items-center justify-center space-y-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-warning/10">
                      <FileSpreadsheet className="h-8 w-8 text-warning" strokeWidth={1.5} />
                    </div>
                    <div className="space-y-1">
                      <p className="text-title-lg font-bold text-on-surface">No Results Published</p>
                      <p className="text-body-md text-on-surface-variant max-w-md mx-auto">
                        The report card for the <strong>{activeTab} Examination</strong> has not been published yet for {selectedChild.firstName}.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-6 lg:grid-cols-3">
                    {/* Detailed Table (col-span-2) */}
                    <section className="bento-card lg:col-span-2 space-y-6">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h2 className="text-title-lg font-bold text-on-surface">{activeGroup.exam.name}</h2>
                          <p className="text-body-md text-on-surface-variant mt-0.5">
                            {activeGroup.exam.term} · Academic Year: {activeGroup.exam.academicYear}
                          </p>
                        </div>
                        <Badge variant="success">Result Published</Badge>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-body-md">
                          <thead>
                            <tr className="border-b border-gray-200 text-label-md uppercase tracking-wider text-on-surface-variant font-semibold">
                              <th className="pb-3 pt-2 font-semibold">Subject</th>
                              <th className="pb-3 pt-2 font-semibold text-center">Marks Obtained</th>
                              <th className="pb-3 pt-2 font-semibold text-center">Max Marks</th>
                              <th className="pb-3 pt-2 font-semibold text-center">Percentage</th>
                              <th className="pb-3 pt-2 font-semibold text-center">Grade</th>
                              <th className="pb-3 pt-2 font-semibold text-right">Remarks</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {activeGroup.results.map((r) => (
                              <tr key={r.subject} className="hover:bg-surface-faint/30">
                                <td className="py-3.5 font-medium text-on-surface">{r.subject}</td>
                                <td className="py-3.5 text-center font-medium text-on-surface">
                                  {r.marksObtained}
                                </td>
                                <td className="py-3.5 text-center text-on-surface-variant font-medium">
                                  {r.maxMarks}
                                </td>
                                <td className="py-3.5 text-center font-semibold text-on-surface">
                                  {r.score}%
                                </td>
                                <td className="py-3.5 text-center">
                                  <span className={`inline-block rounded px-2.5 py-0.5 text-label-md font-bold ${
                                    ['O', 'A+', 'A', 'B'].includes(r.grade)
                                      ? 'bg-success/10 text-success'
                                      : ['C', 'D'].includes(r.grade)
                                        ? 'bg-info/10 text-info'
                                        : 'bg-warning/10 text-warning'
                                  }`}>
                                    {r.grade}
                                  </span>
                                </td>
                                <td className="py-3.5 text-right text-on-surface-variant italic max-w-xs truncate" title={r.remarks}>
                                  {r.remarks}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </section>

                    {/* Score Summary Box (col-span-1) */}
                    <section className="bento-card flex flex-col justify-between space-y-6">
                      <div>
                        <h3 className="text-title-md font-bold text-on-surface-variant uppercase tracking-wider">
                          Result Summary
                        </h3>
                        <div className="mt-6 flex flex-col items-center">
                          <div className="relative flex h-36 w-36 items-center justify-center rounded-full border-8 border-primary/10 bg-primary/5">
                            <div className="text-center">
                              <span className="text-display-sm font-extrabold text-primary">
                                {overallPercentage}%
                              </span>
                              <p className="text-label-md uppercase tracking-wider text-on-surface-variant">
                                Aggregate
                              </p>
                            </div>
                          </div>
                          <div className="mt-6 text-center space-y-1">
                            <p className="text-headline-sm font-bold text-on-surface">
                              Grade: {getOverallGrade(overallPercentage)}
                            </p>
                            <p className="text-body-md text-on-surface-variant font-semibold">
                              Total Score: {totalObtained} / {totalMax}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-xl border border-success/30 bg-success/5 p-4 flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-success text-body-md">Passed</p>
                          <p className="text-label-lg text-success/80 mt-0.5">
                            {selectedChild.firstName} cleared this exam successfully! View the growth chart below to track progress.
                          </p>
                        </div>
                      </div>
                    </section>
                  </div>
                )}

                {/* AI Weakness & Improvement Analyzer */}
                {activeGroup && (
                  <section className="bento-card space-y-6">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-ai-violet animate-pulse" strokeWidth={1.5} />
                      <h2 className="text-title-lg font-bold text-on-surface">
                        AI Report Card Analyzer & Recommendations
                      </h2>
                    </div>
                    <p className="text-body-md text-on-surface-variant">
                      We analyzed <strong>{selectedChild.firstName}&apos;s</strong> scores for the <strong>{activeGroup.exam.name}</strong>. Below are identified subject weaknesses and concrete, step-by-step revision strategies to support their studies.
                    </p>

                    {weakSubjects.length > 0 ? (
                      <div className="grid gap-6 md:grid-cols-2">
                        {/* Areas of Weakness */}
                        <div className="space-y-4">
                          <h3 className="text-title-md font-semibold text-warning flex items-center gap-2">
                            <AlertTriangle className="h-4.5 w-4.5" />
                            Subjects for Improvement (Score &lt; 85%)
                          </h3>
                          <div className="space-y-3">
                            {weakSubjects.map((r) => (
                              <div key={r.subject} className="p-4 rounded-xl border border-warning/20 bg-warning/5 flex justify-between items-center">
                                <div>
                                  <p className="font-semibold text-on-surface text-body-md">{r.subject}</p>
                                  <p className="text-label-md text-on-surface-variant mt-0.5">Grade: {r.grade} · Current Score: {r.score}%</p>
                                </div>
                                <span className="text-label-md font-bold text-warning rounded-full border border-warning/30 px-2.5 py-0.5 bg-warning/10">
                                  -{85 - r.score}% below target
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Actionable Recommendations */}
                        <div className="space-y-4">
                          <h3 className="text-title-md font-semibold text-primary flex items-center gap-2">
                            <TrendingUp className="h-4.5 w-4.5" strokeWidth={2} />
                            Improvement Action Plan for Parents
                          </h3>
                          <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
                            {weakSubjects.map((r) => (
                              <div key={r.subject} className="space-y-2">
                                <p className="font-bold text-on-surface text-body-md border-b pb-1 flex justify-between">
                                  <span>Action Plan for {r.subject}</span>
                                  <span className="text-primary text-label-md">Goal: 85%+</span>
                                </p>
                                <ul className="list-disc pl-4 space-y-1.5 text-body-md text-on-surface-variant">
                                  {getImprovementTips(r.subject).map((tip, idx) => (
                                    <li key={idx}>{tip}</li>
                                  ))}
                                </ul>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-success/30 bg-success/5 p-6 text-center space-y-3">
                        <CheckCircle className="h-10 w-10 text-success mx-auto" />
                        <div className="space-y-1">
                          <p className="font-bold text-success text-title-lg">Outstanding Performance!</p>
                          <p className="text-body-md text-success/80 max-w-2xl mx-auto">
                            Amazing job! {selectedChild.firstName} scored above 85% in all subjects for this term. Keep supporting and encouraging their consistent study habits!
                          </p>
                        </div>
                      </div>
                    )}
                  </section>
                )}

                {progressChartData.length > 0 && (
                  <section className="bento-card space-y-6">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-secondary" strokeWidth={1.5} />
                      <h2 className="text-title-lg font-bold text-on-surface">
                        Subject Performance Comparison (Growth Chart)
                      </h2>
                    </div>
                    <p className="text-body-md text-on-surface-variant">
                      Track academic scores to see performance trajectories for Sessional, Half-Yearly, and Annual exams side-by-side.
                    </p>

                    <div className="h-80 w-full pt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={progressChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid stroke="#f1f3f9" vertical={false} />
                          <XAxis dataKey="subject" stroke="#6b7280" fontSize={12} tickLine={false} />
                          <YAxis domain={[0, 100]} stroke="#6b7280" fontSize={12} tickLine={false} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#ffffff',
                              borderRadius: '8px',
                              border: '1px solid #e2e8f0',
                            }}
                            formatter={(value) => [`${value}%`]}
                          />
                          <Legend verticalAlign="top" height={36} iconType="circle" />
                          <Line type="monotone" dataKey="Sessional" stroke="#a855f7" strokeWidth={3} activeDot={{ r: 6 }} dot={{ r: 4 }} name="Sessional" />
                          <Line type="monotone" dataKey="Half Yearly" stroke="#0052d2" strokeWidth={3} activeDot={{ r: 6 }} dot={{ r: 4 }} name="Half Yearly" />
                          <Line type="monotone" dataKey="Annual" stroke="#10b981" strokeWidth={3} activeDot={{ r: 6 }} dot={{ r: 4 }} name="Annual" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </section>
                )}
              </>
            )}
          </>
        )}
      </div>
    </ParentShell>
  );
}
