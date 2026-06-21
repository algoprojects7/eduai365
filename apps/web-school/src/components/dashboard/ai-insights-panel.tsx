'use client';

import { useEffect, useState } from 'react';
import { AiInsightCard } from '@eduai365/ui';
import type { AiDashboardInsights, AiInsightSeverity } from '@eduai365/shared-types';
import { apiFetch } from '@/lib/api';

const SEVERITY_BADGE: Record<AiInsightSeverity, string> = {
  info: 'AI INSIGHT',
  warning: 'ATTENTION',
  critical: 'CRITICAL',
};

export function AiInsightsPanel() {
  const [insights, setInsights] = useState<AiDashboardInsights | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadInsights() {
      try {
        const data = await apiFetch<AiDashboardInsights>(
          '/ai/insights/dashboard?role=PRINCIPAL',
        );
        if (!cancelled) {
          setInsights(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load AI insights');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadInsights();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="bento-card py-10 text-center text-on-surface-variant">
        Loading AI insights…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-error/10 px-4 py-3 text-body-md text-error">{error}</div>
    );
  }

  if (!insights?.cards.length) {
    return (
      <div className="bento-card py-10 text-center text-on-surface-variant">
        No AI insights available yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {insights.cards.map((card) => (
        <AiInsightCard
          key={card.id}
          title={card.title}
          badge={SEVERITY_BADGE[card.severity]}
          confidence={card.metric}
          description={card.summary}
          actionLabel={card.actionLabel}
          onAction={() => undefined}
        />
      ))}
    </div>
  );
}
