'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, Send, Sparkles, X } from 'lucide-react';
import * as React from 'react';
import type { AiChatResponse, AiCopilotRole } from '@eduai365/shared-types';
import { aiPulse } from '../motion/presets';
import { cn } from '../lib/cn';
import { Button } from './button';

export interface AiCopilotPanelProps {
  role: AiCopilotRole;
  sendMessage: (message: string) => Promise<AiChatResponse>;
  label?: string;
  title?: string;
  placeholder?: string;
  className?: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const ROLE_LABELS: Record<AiCopilotRole, string> = {
  PRINCIPAL: 'Principal Assistant',
  VICE_PRINCIPAL: 'Principal Assistant',
  SCHOOL_ADMIN: 'Admin Assistant',
  TEACHER: 'Teacher Assistant',
  STUDENT: 'Study Coach',
  PARENT: 'Parent Assistant',
};

export function AiCopilotPanel({
  role,
  sendMessage,
  label = 'AI Copilot',
  title,
  placeholder = 'Ask anything about your school data…',
  className,
}: AiCopilotPanelProps) {
  const [open, setOpen] = React.useState(false);
  const [input, setInput] = React.useState('');
  const [sending, setSending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const listRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLTextAreaElement>(null);

  const panelTitle = title ?? ROLE_LABELS[role];

  React.useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
  }, [open]);

  React.useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, sending]);

  async function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || sending) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: trimmed,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setSending(true);
    setError(null);

    try {
      const response = await sendMessage(trimmed);
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: response.reply,
        },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reach AI assistant');
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void handleSend();
    }
  }

  return (
    <>
      <motion.button
        type="button"
        aria-label={label}
        aria-expanded={open}
        onClick={() => setOpen(true)}
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

      <AnimatePresence>
        {open && (
          <>
            <motion.button
              type="button"
              aria-label="Close AI copilot backdrop"
              className="fixed inset-0 z-50 bg-primary-container/20 backdrop-blur-[2px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />

            <motion.aside
              role="dialog"
              aria-label={panelTitle}
              className="fixed bottom-0 right-0 top-0 z-50 flex w-full max-w-md flex-col border-l border-surface-faint bg-white shadow-popover"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            >
              <header className="flex items-center justify-between border-b border-surface-faint px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-ai-violet/10">
                    <Sparkles className="h-5 w-5 text-ai-violet" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-title-lg font-semibold text-on-surface">{panelTitle}</p>
                    <p className="text-label-md uppercase tracking-wider text-on-surface-variant">
                      Powered by eduAI365
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  aria-label="Close"
                  onClick={() => setOpen(false)}
                  className="rounded-lg p-2 text-on-surface-variant transition hover:bg-surface-faint"
                >
                  <X className="h-5 w-5" />
                </button>
              </header>

              <div ref={listRef} className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
                {messages.length === 0 && !sending && (
                  <div className="rounded-lg border border-dashed border-ai-violet/30 bg-ai-violet/5 px-4 py-6 text-center">
                    <p className="text-body-md text-on-surface-variant">
                      Ask about attendance trends, fee forecasts, policies, or anything in your portal.
                    </p>
                  </div>
                )}

                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      'max-w-[90%] rounded-lg px-4 py-3 text-body-md leading-relaxed',
                      message.role === 'user'
                        ? 'ml-auto bg-secondary text-white'
                        : 'mr-auto border border-surface-faint bg-surface-faint/80 text-on-surface',
                    )}
                  >
                    {message.content}
                  </div>
                ))}

                {sending && (
                  <div className="mr-auto flex items-center gap-2 rounded-lg border border-surface-faint bg-surface-faint/80 px-4 py-3 text-body-md text-on-surface-variant">
                    <Loader2 className="h-4 w-4 animate-spin text-ai-violet" />
                    Thinking…
                  </div>
                )}
              </div>

              {error && (
                <div className="mx-5 mb-3 rounded-lg bg-error/10 px-3 py-2 text-body-md text-error">
                  {error}
                </div>
              )}

              <footer className="border-t border-surface-faint px-5 py-4">
                <div className="flex items-end gap-2">
                  <textarea
                    ref={inputRef}
                    rows={2}
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    disabled={sending}
                    className="min-h-[3rem] flex-1 resize-none rounded-lg border border-surface-faint bg-white px-3 py-2 text-body-md text-on-surface outline-none transition focus:border-ai-electric focus:ring-2 focus:ring-ai-electric/20 disabled:opacity-60"
                  />
                  <Button
                    variant="ai"
                    size="icon"
                    aria-label="Send message"
                    disabled={!input.trim() || sending}
                    onClick={() => void handleSend()}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </footer>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
