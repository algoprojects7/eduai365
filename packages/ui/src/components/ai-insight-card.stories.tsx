import type { Meta, StoryObj } from '@storybook/react';
import { AiInsightCard } from './ai-insight-card';

const meta: Meta<typeof AiInsightCard> = {
  title: 'Components/AiInsightCard',
  component: AiInsightCard,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="max-w-lg p-6"><Story /></div>],
};

export default meta;
type Story = StoryObj<typeof AiInsightCard>;

export const LightInsight: Story = {
  args: {
    title: 'Executive Academic Narrative',
    badge: 'AI ANALYSIS ACTIVE',
    confidence: 'Confidence: 98.4%',
    description: (
      <>
        Class <strong>10C</strong> shows a <span className="text-error font-semibold">12% performance decline</span> in Sciences — recommend intervention.
      </>
    ),
    actionLabel: 'View Recommendations',
  },
};

export const DarkPrediction: Story = {
  args: {
    variant: 'dark',
    title: 'AI Prediction',
    badge: 'REAL-TIME SYNTHESIS',
    description:
      'High conversion week predicted. 85% of Offer stage candidates will finalize payment by Friday.',
    actionLabel: 'View Logic',
  },
};
