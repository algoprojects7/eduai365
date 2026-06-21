import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { aiPulse } from '../motion/presets';
import { cn } from '../lib/cn';

export interface AiCopilotFabProps {
  onClick?: () => void;
  className?: string;
  label?: string;
}

export function AiCopilotFab({ onClick, className, label = 'AI Copilot' }: AiCopilotFabProps) {
  return (
    <motion.button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={cn(
        'fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-ai-gradient text-white shadow-ai-glow-strong',
        className,
      )}
      animate={aiPulse.animate}
      transition={aiPulse.transition}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <Sparkles className="h-6 w-6" strokeWidth={1.5} />
    </motion.button>
  );
}
