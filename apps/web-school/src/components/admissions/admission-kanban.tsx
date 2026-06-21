'use client';

import { Badge, Button } from '@eduai365/ui';
import { ArrowRight, Sparkles } from 'lucide-react';
import {
  ADMISSION_STAGES,
  type AdmissionApplication,
  type AdmissionStage,
} from '@/types/academics';

const STAGE_COLORS: Record<AdmissionStage, { header: string; border: string }> = {
  INQUIRY: { header: 'bg-slate-100 text-slate-700', border: 'border-slate-200' },
  APPLICATION: { header: 'bg-blue-50 text-blue-800', border: 'border-blue-200' },
  ENTRANCE_TEST: { header: 'bg-violet-50 text-violet-800', border: 'border-violet-200' },
  INTERVIEW: { header: 'bg-amber-50 text-amber-800', border: 'border-amber-200' },
  OFFER: { header: 'bg-emerald-50 text-emerald-800', border: 'border-emerald-200' },
  FEE_PAID: { header: 'bg-teal-50 text-teal-800', border: 'border-teal-200' },
  ENROLLED: { header: 'bg-green-50 text-green-800', border: 'border-green-200' },
};

function nextStage(current: AdmissionStage): AdmissionStage | null {
  const index = ADMISSION_STAGES.findIndex((s) => s.id === current);
  if (index < 0 || index >= ADMISSION_STAGES.length - 1) return null;
  const next = ADMISSION_STAGES[index + 1];
  return next?.id ?? null;
}

export interface AdmissionKanbanProps {
  applications: AdmissionApplication[];
  movingId: string | null;
  onMove: (id: string, stage: AdmissionStage) => void;
}

export function AdmissionKanban({ applications, movingId, onMove }: AdmissionKanbanProps) {
  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex min-w-[1120px] gap-3">
        {ADMISSION_STAGES.map((stage) => {
          const cards = applications.filter((app) => app.stage === stage.id);
          const colors = STAGE_COLORS[stage.id] ?? STAGE_COLORS.INQUIRY;

          return (
            <div
              key={stage.id}
              className={`flex w-[160px] shrink-0 flex-col rounded-xl border bg-white/80 ${colors.border}`}
            >
              <div className={`rounded-t-xl px-3 py-2.5 ${colors.header}`}>
                <p className="text-label-md font-semibold uppercase tracking-wide">{stage.label}</p>
                <p className="text-xs opacity-70">{cards.length}</p>
              </div>

              <div className="flex flex-1 flex-col gap-2 p-2">
                {cards.length === 0 && (
                  <p className="px-1 py-6 text-center text-xs text-on-surface-variant">Empty</p>
                )}

                {cards.map((app) => {
                  const advance = nextStage(app.stage);
                  const isMoving = movingId === app.id;

                  return (
                    <div
                      key={app.id}
                      className="group rounded-lg border border-gray-200/80 bg-white p-3 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <p className="text-body-md font-semibold text-on-surface">{app.applicantName}</p>
                      <p className="mt-0.5 text-xs text-on-surface-variant">{app.targetClass}</p>

                      {app.aiScore != null && (
                        <Badge
                          variant="ai"
                          className="mt-2 gap-1"
                          style={{ color: '#7C3AED', backgroundColor: 'rgba(124, 58, 237, 0.1)' }}
                        >
                          <Sparkles className="h-3 w-3" />
                          {Math.round(app.aiScore)}% likelihood
                        </Badge>
                      )}

                      {advance && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-2 w-full justify-between text-xs"
                          disabled={isMoving}
                          onClick={() => onMove(app.id, advance)}
                        >
                          {isMoving ? 'Moving…' : 'Move →'}
                          {!isMoving && <ArrowRight className="h-3.5 w-3.5" />}
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
