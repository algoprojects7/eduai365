import * as React from 'react';
import { cn } from '../lib/cn';

export interface TabItem {
  id: string;
  label: string;
  badge?: string | number;
}

export interface TabGroupProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export function TabGroup({ tabs, activeTab, onChange, className }: TabGroupProps) {
  return (
    <div className={cn('flex gap-1 border-b border-gray-300/20', className)}>
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              'relative flex items-center gap-2 px-4 py-3 text-body-md font-medium transition-colors',
              isActive
                ? 'text-secondary'
                : 'text-on-surface-variant hover:text-on-surface',
            )}
          >
            {tab.label}
            {tab.badge !== undefined && (
              <span className="rounded-full bg-error/10 px-2 py-0.5 text-xs font-semibold text-error">
                {tab.badge}
              </span>
            )}
            {isActive && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-secondary" />
            )}
          </button>
        );
      })}
    </div>
  );
}
