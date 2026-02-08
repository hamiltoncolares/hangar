import type { ReactNode } from 'react';
import { Theme } from '../lib/theme';

export function Topbar({
  theme,
  onToggleTheme,
  title,
  subtitle,
  children,
  onMenu
}: {
  theme: Theme;
  onToggleTheme: () => void;
  title: string;
  subtitle: string;
  children?: ReactNode;
  onMenu?: () => void;
}) {
  return (
    <div className="relative z-[1000] isolate flex flex-wrap items-center justify-between gap-3 border-b border-hangar-slate/30 bg-hangar-panel px-4 md:px-6 py-3 md:py-4 hud-panel">
      <div className="flex items-center gap-2">
        {onMenu && (
          <button
            onClick={onMenu}
            className="mr-1 rounded-md border border-hangar-slate/40 px-2 py-1 text-[11px] text-hangar-muted transition hover:bg-hangar-surface md:hidden"
          >
            Menu
          </button>
        )}
        <div className="text-base md:text-xl font-semibold">{title}</div>
        <div className="text-[10px] md:text-xs text-hangar-muted">{subtitle}</div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {children}
        <button
          onClick={onToggleTheme}
          className="rounded-md border border-hangar-slate/40 px-3 py-2 text-[10px] md:text-xs text-hangar-muted transition hover:bg-hangar-surface"
        >
          {theme === 'dark' ? 'Light mode' : 'Dark mode'}
        </button>
      </div>
    </div>
  );
}
