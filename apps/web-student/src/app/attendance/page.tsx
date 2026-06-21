'use client';

import { useEffect, useState } from 'react';
import { Badge, Button, KpiBentoCard } from '@eduai365/ui';
import {
  CalendarDays,
  Download,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Sparkles,
  TrendingUp,
  FileSpreadsheet,
} from 'lucide-react';
import { StudentShell } from '@/components/student-shell';
import { apiFetch } from '@/lib/api';
import type { AuthenticatedUser } from '@eduai365/shared-types';

interface AttendanceDay {
  date: string;
  status: string;
}

interface RawStudentAttendance {
  month: string;
  heatmap: AttendanceDay[];
  overallPercent: number;
}

export default function AttendancePage() {
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1);
  const [attendanceData, setAttendanceData] = useState<RawStudentAttendance | null>(null);
  const [userProfile, setUserProfile] = useState<AuthenticatedUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const years = [2024, 2025, 2026, 2027];
  const months = [
    { value: 1, name: 'January' },
    { value: 2, name: 'February' },
    { value: 3, name: 'March' },
    { value: 4, name: 'April' },
    { value: 5, name: 'May' },
    { value: 6, name: 'June' },
    { value: 7, name: 'July' },
    { value: 8, name: 'August' },
    { value: 9, name: 'September' },
    { value: 10, name: 'October' },
    { value: 11, name: 'November' },
    { value: 12, name: 'December' },
  ];

  useEffect(() => {
    let cancelled = false;
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const [me, attendance] = await Promise.all([
          apiFetch<AuthenticatedUser>('/auth/me'),
          apiFetch<RawStudentAttendance>(`/student/attendance?year=${selectedYear}&month=${selectedMonth}`),
        ]);
        if (!cancelled) {
          setUserProfile(me);
          setAttendanceData(attendance);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load attendance data');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    void loadData();
    return () => {
      cancelled = true;
    };
  }, [selectedYear, selectedMonth]);

  const heatmap = attendanceData?.heatmap ?? [];
  const overallPercent = attendanceData?.overallPercent ?? 0;

  // Process stats
  const totalDays = heatmap.length;
  const presentDays = heatmap.filter((d) => d.status === 'PRESENT').length;
  const lateDays = heatmap.filter((d) => d.status === 'LATE').length;
  const absentDays = heatmap.filter((d) => d.status === 'ABSENT').length;
  
  // Use backend percentage if database record count matches, else use calculated percentage
  const displayPercent = overallPercent;

  // Generate calendar grid cells
  const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
  const calendarCells = [];

  // Get index of the first day of the month (0 = Sunday, 1 = Monday, etc.)
  // Let's start the week on Sunday
  const firstDayIndex = new Date(selectedYear, selectedMonth - 1, 1).getDay();

  // Padding cells before the 1st of the month
  for (let i = 0; i < firstDayIndex; i++) {
    calendarCells.push({
      isPadding: true,
      dayNum: 0,
      dateStr: '',
      status: '',
      dayName: '',
    });
  }



  for (let d = 1; d <= daysInMonth; d++) {
    const currentDate = new Date(selectedYear, selectedMonth - 1, d);
    const yyyy = currentDate.getFullYear();
    const mm = String(currentDate.getMonth() + 1).padStart(2, '0');
    const dd = String(currentDate.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;
    const dayOfWeek = currentDate.getDay();
    const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'long' });

    let status = 'unmarked';
    if (dayOfWeek === 0) {
      status = 'weekend'; // Sunday is weekend
    } else {
      const match = heatmap.find((item) => item.date === dateStr);
      if (match) {
        status = match.status; // PRESENT, ABSENT, LATE, HOLIDAY
      } else if (currentDate > now) {
        status = 'future';
      }
    }

    calendarCells.push({
      isPadding: false,
      dayNum: d,
      dateStr,
      status,
      dayName,
    });
  }

  // Export to CSV Handler
  const handleExportCSV = () => {
    if (!attendanceData || !userProfile) return;

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const studentName = `${userProfile.firstName} ${userProfile.lastName}`;
    const selectedMonthName = monthNames[selectedMonth - 1];

    let csvContent = `eduAI365 - Student Attendance Report\r\n`;
    csvContent += `Student Name,${studentName}\r\n`;
    csvContent += `Report Period,${selectedMonthName} ${selectedYear}\r\n`;
    csvContent += `Attendance Percentage,${displayPercent}%\r\n`;
    csvContent += `Total School Days,${totalDays}\r\n`;
    csvContent += `Days Present,${presentDays}\r\n`;
    csvContent += `Days Late,${lateDays}\r\n`;
    csvContent += `Days Absent,${absentDays}\r\n\r\n`;

    csvContent += `Date,Day,Status,Details\r\n`;

    // Filter to marked days in heatmap
    heatmap.forEach((day) => {
      const dateObj = new Date(day.date);
      const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
      let statusLabel = day.status;
      let detail = '';
      if (day.status === 'PRESENT') {
        statusLabel = 'Present';
        detail = 'On Time';
      } else if (day.status === 'LATE') {
        statusLabel = 'Late';
        detail = 'Excused/Arrived Late';
      } else if (day.status === 'ABSENT') {
        statusLabel = 'Absent';
        detail = 'Unexcused Absence';
      } else if (day.status === 'HOLIDAY') {
        statusLabel = 'Holiday';
        detail = 'School Holiday';
      }
      csvContent += `${day.date},${dayName},${statusLabel},${detail}\r\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `attendance_report_${studentName.replace(/\s+/g, '_')}_${selectedMonthName}_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const statusStyles: Record<string, string> = {
    PRESENT: 'bg-success/10 text-success border border-success/30 hover:bg-success/20 hover:shadow-[0_0_12px_rgba(16,185,129,0.2)]',
    LATE: 'bg-warning/10 text-warning border border-warning/30 hover:bg-warning/20 hover:shadow-[0_0_12px_rgba(245,158,11,0.2)]',
    ABSENT: 'bg-error/10 text-error border border-error/30 hover:bg-error/20 hover:shadow-[0_0_12px_rgba(239,68,68,0.2)]',
    HOLIDAY: 'bg-info/10 text-info border border-info/30 hover:bg-info/20 hover:shadow-[0_0_12px_rgba(14,165,233,0.2)]',
    weekend: 'bg-surface-container-high/40 text-on-surface-variant/70 border border-transparent opacity-80',
    future: 'border border-dashed border-gray-300 text-gray-300 bg-transparent opacity-50 cursor-not-allowed',
    unmarked: 'border border-gray-200 text-on-surface-variant/40 bg-surface-faint',
  };

  // Recommendations content
  const getAttendanceRecommendations = () => {
    if (displayPercent >= 95) {
      return {
        title: 'Outstanding Discipline!',
        color: 'text-success border-success/30 bg-success/5',
        description: 'You are maintaining an excellent attendance record, which strongly correlates with high academic performance. Keep up the consistency!'
      };
    } else if (displayPercent >= 85) {
      return {
        title: 'Solid Attendance Standing',
        color: 'text-primary border-primary/30 bg-primary/5',
        description: 'You are meeting the school\'s general attendance expectations. Try to minimize late arrivals to maximize classroom engagement and learning.'
      };
    } else {
      return {
        title: 'Attendance Warning (Below 85%)',
        color: 'text-error border-error/30 bg-error/5',
        description: 'Your attendance is currently below the recommended 85% threshold. This might affect your academic grading and exam eligibility. Consider planning morning routines or contacting teachers if you are experiencing health issues.'
      };
    }
  };

  const advice = getAttendanceRecommendations();

  return (
    <StudentShell>
      <div className="space-y-8">
        <header>
          <div className="flex items-center gap-2">
            <CalendarDays className="h-6 w-6 text-primary" strokeWidth={1.5} />
            <h1 className="text-headline-lg font-bold text-on-surface">My Attendance Record</h1>
          </div>
          <p className="mt-1 text-body-md text-on-surface-variant">
            Track daily attendance logs, view monthly heatmap grids, and generate downloadable official monthly reports.
          </p>
        </header>

        {/* Generator & Exporter Filter Panel */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-surface-container-high pb-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex flex-col">
              <label className="text-label-sm font-semibold text-on-surface-variant mb-1">Select Month</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="rounded-lg border border-gray-300/50 bg-white px-3 py-2 text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {months.map((m) => (
                  <option key={m.value} value={m.value}>{m.name}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col">
              <label className="text-label-sm font-semibold text-on-surface-variant mb-1">Select Year</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="rounded-lg border border-gray-300/50 bg-white px-3 py-2 text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          <Button
            variant="primary"
            onClick={handleExportCSV}
            disabled={loading || !attendanceData}
            className="sm:self-end"
          >
            <Download className="h-4 w-4" />
            Generate & Export Report
          </Button>
        </div>

        {loading && (
          <div className="bento-card py-16 text-center text-on-surface-variant">
            Loading attendance records…
          </div>
        )}

        {error && !loading && (
          <div className="rounded-lg bg-error/10 px-4 py-3 text-body-md text-error">{error}</div>
        )}

        {!loading && !error && attendanceData && (
          <>
            {/* KPI statistics cards */}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <KpiBentoCard
                label="Monthly Attendance"
                value={`${displayPercent}%`}
                icon={CalendarDays}
                trend={
                  displayPercent >= 95
                    ? { value: 'Excellent standing', direction: 'up' }
                    : displayPercent >= 85
                      ? { value: 'Good standing', direction: 'neutral' }
                      : { value: 'Action required', direction: 'down' }
                }
              />
              <KpiBentoCard
                label="Total School Days"
                value={totalDays}
                icon={CalendarDays}
              />
              <KpiBentoCard
                label="Present Days"
                value={presentDays}
                icon={CheckCircle}
                iconClassName="text-success"
              />
              <KpiBentoCard
                label="Absent / Late"
                value={`${absentDays} / ${lateDays}`}
                icon={XCircle}
                iconClassName="text-error"
              />
            </div>

            {/* Heatmap & Recommendations side-by-side */}
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Heatmap Calendar card */}
              <section className="bento-card lg:col-span-2 space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-title-lg font-bold text-on-surface">
                    {months.find((m) => m.value === selectedMonth)?.name} {selectedYear} Heatmap
                  </h2>
                  <Badge variant="info">Visual Grid</Badge>
                </div>

                <div className="grid grid-cols-7 gap-2 text-center text-label-md font-semibold text-on-surface-variant">
                  <div>Sun</div>
                  <div>Mon</div>
                  <div>Tue</div>
                  <div>Wed</div>
                  <div>Thu</div>
                  <div>Fri</div>
                  <div>Sat</div>
                </div>

                <div className="grid grid-cols-7 gap-2">
                  {calendarCells.map((cell, idx) => {
                    if (cell.isPadding) {
                      return <div key={`pad-${idx}`} className="aspect-square opacity-0 pointer-events-none" />;
                    }

                    return (
                      <div
                        key={cell.dateStr}
                        className={`aspect-square flex flex-col items-center justify-center rounded-xl font-semibold text-body-md transition-all duration-300 relative ${statusStyles[cell.status] || ''}`}
                        title={`${cell.dateStr}: ${cell.status}`}
                      >
                        <span>{cell.dayNum}</span>
                        {cell.status !== 'weekend' && cell.status !== 'future' && cell.status !== 'unmarked' && (
                          <span className={`absolute bottom-1.5 h-1.5 w-1.5 rounded-full ${
                            cell.status === 'PRESENT' ? 'bg-success' :
                            cell.status === 'LATE' ? 'bg-warning' :
                            cell.status === 'ABSENT' ? 'bg-error' :
                            'bg-info'
                          }`} />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Heatmap Legend */}
                <div className="flex flex-wrap gap-4 pt-4 border-t border-surface-container-high text-label-md text-on-surface-variant justify-center">
                  <span className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-full bg-success" /> Present
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-full bg-warning" /> Late
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-full bg-error" /> Absent
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-full bg-info" /> Holiday
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-lg bg-surface-container-high border border-transparent" /> Weekend
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-lg border border-dashed border-gray-300" /> Future / Unmarked
                  </span>
                </div>
              </section>

              {/* AI Analysis and Recommendations */}
              <section className="bento-card flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-ai-violet animate-pulse" strokeWidth={1.5} />
                    <h3 className="text-title-lg font-bold text-on-surface">AI Insights & Advice</h3>
                  </div>

                  <div className={`rounded-xl border p-4 flex flex-col gap-2 ${advice.color}`}>
                    <p className="font-bold text-body-md">{advice.title}</p>
                    <p className="text-label-lg opacity-90 leading-relaxed">{advice.description}</p>
                  </div>

                  <div className="space-y-3 pt-2">
                    <h4 className="text-label-md uppercase tracking-wider text-on-surface-variant font-bold">Action Plan</h4>
                    
                    {lateDays > 2 && (
                      <div className="p-3.5 rounded-xl border border-warning/20 bg-warning/5 flex items-start gap-2 text-label-lg text-on-surface-variant">
                        <Clock className="h-4.5 w-4.5 text-warning flex-shrink-0 mt-0.5" />
                        <p>Adjust morning departure times by 10-15 minutes to eliminate late arrivals (currently {lateDays} instances).</p>
                      </div>
                    )}

                    {absentDays > 1 && (
                      <div className="p-3.5 rounded-xl border border-error/20 bg-error/5 flex items-start gap-2 text-label-lg text-on-surface-variant">
                        <AlertCircle className="h-4.5 w-4.5 text-error flex-shrink-0 mt-0.5" />
                        <p>Follow up with subject teachers to recover lecture notes and class files for the {absentDays} missed school days.</p>
                      </div>
                    )}

                    <div className="p-3.5 rounded-xl border border-gray-200 bg-surface-faint flex items-start gap-2 text-label-lg text-on-surface-variant">
                      <TrendingUp className="h-4.5 w-4.5 text-primary flex-shrink-0 mt-0.5" />
                      <p>Maintain consistent attendance to ensure full preparation for the upcoming term examinations.</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-info/20 bg-info/5 flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-info flex-shrink-0 mt-0.5" strokeWidth={2} />
                  <div>
                    <p className="font-semibold text-info text-body-md">Did you know?</p>
                    <p className="text-label-lg text-on-surface-variant/80 mt-0.5 leading-relaxed">
                      Maintaining an attendance rate above 90% is highly correlated with securing higher grades.
                    </p>
                  </div>
                </div>
              </section>
            </div>

            {/* Detailed Daily Table Logs */}
            <section className="bento-card space-y-6">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-secondary" strokeWidth={1.5} />
                <h2 className="text-title-lg font-bold text-on-surface">Daily Attendance Details</h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-body-md">
                  <thead>
                    <tr className="border-b border-gray-200 text-label-md uppercase tracking-wider text-on-surface-variant font-semibold">
                      <th className="pb-3 pt-2 font-semibold">Date</th>
                      <th className="pb-3 pt-2 font-semibold">Day</th>
                      <th className="pb-3 pt-2 font-semibold text-center">Status</th>
                      <th className="pb-3 pt-2 font-semibold text-right">Remarks / Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {/* Render marked days in reverse order (newest first) */}
                    {[...heatmap].reverse().map((day) => {
                      const dateObj = new Date(day.date);
                      const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
                      return (
                        <tr key={day.date} className="hover:bg-surface-faint/30">
                          <td className="py-3.5 font-medium text-on-surface">{day.date}</td>
                          <td className="py-3.5 text-on-surface-variant">{dayName}</td>
                          <td className="py-3.5 text-center">
                            <span className={`inline-block rounded-full px-2.5 py-0.5 text-label-md font-bold ${
                              day.status === 'PRESENT'
                                ? 'bg-success/10 text-success'
                                : day.status === 'LATE'
                                  ? 'bg-warning/10 text-warning'
                                  : day.status === 'ABSENT'
                                    ? 'bg-error/10 text-error'
                                    : 'bg-info/10 text-info'
                            }`}>
                              {day.status}
                            </span>
                          </td>
                          <td className="py-3.5 text-right text-on-surface-variant italic">
                            {day.status === 'PRESENT' && 'On Time'}
                            {day.status === 'LATE' && 'Arrived late (excused)'}
                            {day.status === 'ABSENT' && 'Unexcused Absence'}
                            {day.status === 'HOLIDAY' && 'School Holiday'}
                          </td>
                        </tr>
                      );
                    })}
                    {heatmap.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-on-surface-variant italic">
                          No marked attendance logs for this period.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </div>
    </StudentShell>
  );
}
