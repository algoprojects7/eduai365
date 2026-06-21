import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './button';

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'ai', 'ghost', 'destructive', 'link'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'pill', 'icon'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = { args: { children: 'Get Started Free', variant: 'primary' } };
export const AIAction: Story = { args: { children: 'AI Auto-Generate Timetable', variant: 'ai' } };
export const Ghost: Story = { args: { children: 'Export CSV', variant: 'ghost' } };
export const Pill: Story = { args: { children: 'Request Demo', variant: 'primary', size: 'pill' } };
