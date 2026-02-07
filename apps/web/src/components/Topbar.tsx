import type { ReactNode } from 'react';
import { Theme } from '../lib/theme';

export function Topbar({
  theme,
  onToggleTheme,
  title,
  subtitle,
  children
}: {
  theme: Theme;
  onToggleTheme: () => void;
  title: string;
  subtitle: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-hangar-slate/30 bg-hangar-panel px-6 py-4 hud-panel">
      <div className="flex items-center gap-3">
        <div className="text-xl font-semibold">{title}</div>
        <div className="text-xs text-hangar-muted">{subtitle}</div>
      </div>
      <div className="flex items-center gap-4">
        {children}
        <button
          onClick={onToggleTheme}
          className="rounded-md border border-hangar-slate/40 px-3 py-2 text-xs text-hangar-muted transition hover:bg-hangar-surface"
        >
          {theme === 'dark' ? 'Light mode' : 'Dark mode'}
        </button>
      </div>
    </div>
  );
}
