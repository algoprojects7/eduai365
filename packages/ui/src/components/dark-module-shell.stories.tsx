import type { Meta, StoryObj } from '@storybook/react';
import { StatusBadge } from './badge';
import { DarkBentoCard, DarkModuleShell } from './dark-module-shell';
import { KpiBentoCard } from './kpi-bento-card';

const meta: Meta = {
  title: 'Themes/Cinematic Dark',
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj;

export const PayrollShell: Story = {
  render: () => (
    <DarkModuleShell>
      <div className="mx-auto max-w-container px-8 py-8">
        <h1 className="text-headline-lg font-bold">Payroll Control Center</h1>
        <p className="mt-1 text-body-md text-white/60">Financial Year 2024-25 | Phase 2 Disbursement</p>
        <div className="mt-8 grid gap-6 md:grid-cols-4">
          <DarkBentoCard glow>
            <p className="text-label-md uppercase text-white/50">Total Payable</p>
            <p className="mt-2 text-headline-lg font-bold">₹42.3L</p>
            <StatusBadge status="active" className="mt-2" />
          </DarkBentoCard>
          <DarkBentoCard>
            <p className="text-label-md uppercase text-white/50">Net Disbursed</p>
            <p className="mt-2 text-headline-lg font-bold">₹37.3L</p>
          </DarkBentoCard>
          <DarkBentoCard>
            <p className="text-label-md uppercase text-white/50">Payroll Finalization</p>
            <p className="mt-2 text-headline-lg font-bold text-warning">3 Days</p>
            <StatusBadge status="critical" className="mt-2" />
          </DarkBentoCard>
        </div>
      </div>
    </DarkModuleShell>
  ),
};

export const LightVsDarkComparison: Story = {
  render: () => (
    <div className="grid md:grid-cols-2">
      <div className="p-6">
        <KpiBentoCard label="Collection Rate" value="92%" trend={{ value: '+4%', direction: 'up' }} />
      </div>
      <DarkModuleShell className="min-h-[200px] p-6">
        <DarkBentoCard>
          <p className="text-label-md uppercase text-white/50">Collection Rate</p>
          <p className="mt-2 text-headline-lg font-bold">92%</p>
        </DarkBentoCard>
      </DarkModuleShell>
    </div>
  ),
};
