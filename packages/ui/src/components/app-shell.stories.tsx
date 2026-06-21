import type { Meta, StoryObj } from '@storybook/react';
import {
  GraduationCap,
  LayoutDashboard,
  Users,
  BookOpen,
  Wallet,
  Sparkles,
  Settings,
} from 'lucide-react';
import { AppShell } from './app-shell';
import { Button } from './button';
import { KpiBentoCard } from './kpi-bento-card';
import { AiInsightCard } from './ai-insight-card';
import { AiCopilotFab } from './ai-copilot-fab';
import { Footer } from './footer';

const meta: Meta<typeof AppShell> = {
  title: 'Layout/AppShell',
  component: AppShell,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof AppShell>;

const sidebarItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, active: true },
  { id: 'students', label: 'Students', icon: Users },
  { id: 'academics', label: 'Academics', icon: BookOpen },
  { id: 'finance', label: 'Finance', icon: Wallet },
  { id: 'ai', label: 'AI Insights', icon: Sparkles },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export const SchoolAdminDashboard: Story = {
  render: () => (
    <>
      <AppShell
        sidebar={{
          subtitle: 'Admin Portal',
          items: sidebarItems,
          footerItems: [
            { id: 'help', label: 'Help Center', icon: BookOpen },
            { id: 'logout', label: 'Logout', icon: Settings },
          ],
          actionButton: (
            <Button variant="ai" className="w-full">
              + New Report
            </Button>
          ),
        }}
        search={{ placeholder: 'Search students, staff, or records...' }}
        header={
          <div className="mt-4 flex items-center justify-between">
            <div>
              <h1 className="text-headline-lg font-bold">Greenfield Academy</h1>
              <p className="text-body-md text-on-surface-variant">Principal Sharma</p>
            </div>
          </div>
        }
        footer={
          <Footer
            linkGroups={[
              {
                title: 'Platform',
                links: [
                  { label: 'Features', href: '#' },
                  { label: 'Admissions', href: '#' },
                  { label: 'LMS Integration', href: '#' },
                ],
              },
              {
                title: 'Support',
                links: [
                  { label: 'Security', href: '#' },
                  { label: 'Privacy Policy', href: '#' },
                  { label: 'Contact Support', href: '#' },
                ],
              },
            ]}
          />
        }
      >
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <KpiBentoCard
            label="Enrolled Students"
            value="1,240"
            icon={Users}
            trend={{ value: '+12%', direction: 'up' }}
          />
          <KpiBentoCard
            label="Active Staff"
            value="112"
            icon={GraduationCap}
            trend={{ value: 'Stable', direction: 'neutral' }}
          />
          <KpiBentoCard
            label="Avg. Attendance"
            value="94.2%"
            icon={LayoutDashboard}
            trend={{ value: '-0.8%', direction: 'down' }}
          />
          <KpiBentoCard
            label="Fees Collected"
            value="₹8.2L / ₹9.1L"
            icon={Wallet}
            trend={{ value: 'Target 90%', direction: 'up' }}
          />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 bento-card min-h-[240px]">
            <h3 className="text-title-lg font-semibold">Attendance Trends (30 Days)</h3>
            <p className="mt-2 text-body-md text-on-surface-variant">Chart placeholder — use Recharts in app</p>
          </div>
          <AiInsightCard
            title="Dropout Risk Alert"
            description="14 students in Grade 10-C show declining engagement scores. Action recommended."
            actionLabel="View Students"
          />
        </div>
      </AppShell>
      <AiCopilotFab />
    </>
  ),
};
