'use client';

import { useEffect, useState } from 'react';
import type { AiLessonPlan, AiLessonPlanRequest } from '@eduai365/shared-types';
import { Badge, Button } from '@eduai365/ui';
import { Sparkles, X } from 'lucide-react';
import { apiFetch } from '@/lib/api';

interface LessonPlanModalProps {
  open: boolean;
  onClose: () => void;
  defaults?: Partial<AiLessonPlanRequest>;
}

const EMPTY_FORM: AiLessonPlanRequest = {
  subject: '',
  topic: '',
  grade: '',
  durationMinutes: 45,
};

export function LessonPlanModal({ open, onClose, defaults }: LessonPlanModalProps) {
  const [form, setForm] = useState<AiLessonPlanRequest>(EMPTY_FORM);
  const [plan, setPlan] = useState<AiLessonPlan | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm({ ...EMPTY_FORM, ...defaults });
      setPlan(null);
      setError(null);
    }
  }, [defaults, open]);

  if (!open) return null;

  async function handleGenerate(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setGenerating(true);

    try {
      const result = await apiFetch<AiLessonPlan>('/ai/lesson-plan/generate', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      setPlan(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate lesson plan');
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="glass-panel-dark max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-white/10 p-6 shadow-ai-glow">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-ai-violet" />
              <h2 className="text-title-lg font-semibold text-white">AI Lesson Plan</h2>
            </div>
            <p className="mt-1 text-body-md text-white/50">
              Generate a structured lesson outline for your next class
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-white/50 transition hover:bg-white/10 hover:text-white"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {!plan ? (
          <form onSubmit={(e) => void handleGenerate(e)} className="mt-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-label-md text-white/60">Subject</label>
                <input
                  required
                  value={form.subject}
                  onChange={(e) => setForm((prev) => ({ ...prev, subject: e.target.value }))}
                  placeholder="Mathematics"
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-body-md text-white outline-none focus:border-secondary"
                />
              </div>
              <div>
                <label className="mb-1 block text-label-md text-white/60">Grade / Class</label>
                <input
                  required
                  value={form.grade}
                  onChange={(e) => setForm((prev) => ({ ...prev, grade: e.target.value }))}
                  placeholder="Grade 8-A"
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-body-md text-white outline-none focus:border-secondary"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-label-md text-white/60">Topic</label>
              <input
                required
                value={form.topic}
                onChange={(e) => setForm((prev) => ({ ...prev, topic: e.target.value }))}
                placeholder="Fractions and decimals"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-body-md text-white outline-none focus:border-secondary"
              />
            </div>

            <div>
              <label className="mb-1 block text-label-md text-white/60">Duration (minutes)</label>
              <input
                required
                type="number"
                min={15}
                max={180}
                value={form.durationMinutes}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    durationMinutes: Number(e.target.value),
                  }))
                }
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-body-md text-white outline-none focus:border-secondary"
              />
            </div>

            {error && (
              <p className="rounded-lg bg-error/10 px-3 py-2 text-body-md text-error">{error}</p>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" variant="ai" disabled={generating}>
                {generating ? 'Generating…' : 'Generate Plan'}
              </Button>
            </div>
          </form>
        ) : (
          <div className="mt-6 space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="ai">{plan.source === 'ollama' ? 'Ollama' : 'AI Draft'}</Badge>
              <Badge variant="outline">{plan.durationMinutes} min</Badge>
            </div>

            <div>
              <h3 className="text-title-lg font-semibold text-white">{plan.title}</h3>
              <p className="mt-1 text-body-md text-white/60">
                {plan.subject} · {plan.grade}
              </p>
            </div>

            <PlanSection title="Learning Objectives" items={plan.objectives} />
            <PlanSection title="Materials" items={plan.materials} />
            <PlanBlock title="Warm-up" content={plan.warmUp} />
            <PlanBlock title="Main Activity" content={plan.mainActivity} />
            <PlanBlock title="Assessment" content={plan.assessment} />
            <PlanBlock title="Homework" content={plan.homework} />
            <PlanBlock title="Differentiation" content={plan.differentiation} />

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={() => setPlan(null)}>
                Edit Inputs
              </Button>
              <Button type="button" variant="ai" onClick={onClose}>
                Done
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PlanSection({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <h4 className="text-body-md font-semibold text-white">{title}</h4>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-body-md text-white/75">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function PlanBlock({ title, content }: { title: string; content: string }) {
  return (
    <div>
      <h4 className="text-body-md font-semibold text-white">{title}</h4>
      <p className="mt-2 whitespace-pre-wrap text-body-md leading-relaxed text-white/75">
        {content}
      </p>
    </div>
  );
}
