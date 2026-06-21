import type { Meta, StoryObj } from '@storybook/react';
import { TrendingUp, Users, Brain } from 'lucide-react';
import { KpiBentoCard } from './kpi-bento-card';

const meta: Meta<typeof KpiBentoCard> = {
  title: 'Components/KpiBentoCard',
  component: KpiBentoCard,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="max-w-sm p-6"><Story /></div>],
};

export default meta;
type Story = StoryObj<typeof KpiBentoCard>;

export const ActiveSchools: Story = {
  args: {
    label: 'Active Schools',
    value: 48,
    icon: Users,
    trend: { value: '+12%', direction: 'up' },
  },
};

export const MRR: Story = {
  args: {
    label: 'MRR',
    value: '₹18.4L',
    icon: TrendingUp,
    trend: { value: '+ ₹14k', direction: 'up' },
    iconClassName: 'bg-ai-violet/10',
  },
};

export const AIOperations: Story = {
  args: {
    label: 'AI Operations',
    value: '2.1M',
    icon: Brain,
    iconClassName: 'bg-ai-violet/10 [&_svg]:text-ai-violet',
  },
};
