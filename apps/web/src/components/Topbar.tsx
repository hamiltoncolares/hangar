import type { ReactNode } from 'react';
import { Theme } from '../lib/theme';

export function Topbar({
  theme,
  onToggleTheme,
  title,
  subtitle,
  children,
  onMenu,
  rightActions
}: {
  theme: Theme;
  onToggleTheme: () => void;
  title: string;
  subtitle: string;
  children?: ReactNode;
  onMenu?: () => void;
  rightActions?: ReactNode;
}) {
  return (
    <div className="relative z-[1000] isolate border-b border-hangar-slate/30 bg-hangar-panel px-4 md:px-6 py-3 md:py-4 hud-panel">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
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
        <div className="flex flex-wrap items-center gap-2 md:flex-nowrap md:justify-end">
          {rightActions}
          <button
            onClick={onToggleTheme}
            aria-label="Alternar tema"
            className="relative inline-flex h-8 w-16 items-center rounded-full border border-hangar-slate/40 bg-hangar-panel/90 px-1 transition hover:bg-hangar-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-hangar-cyan/50"
          >
            <span className="absolute left-2 text-hangar-muted">
              <SunIcon />
            </span>
            <span className="absolute right-2 text-hangar-muted">
              <MoonIcon />
            </span>
            <span
              className={`absolute top-1 h-6 w-6 rounded-full bg-hangar-panel shadow-md transition ${
                theme === 'dark' ? 'translate-x-7 border border-hangar-slate/50' : 'translate-x-0 border border-hangar-cyan/40'
              }`}
            />
          </button>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 md:mt-4">
        {children}
      </div>
    </div>
  );
}

function SunIcon() {
  return (
    <svg viewBox="0 0 640 640" width="14" height="14" aria-hidden="true">
      <path
        fill="currentColor"
        d="M210.2 53.9C217.6 50.8 226 51.7 232.7 56.1L320.5 114.3L408.3 56.1C415 51.7 423.4 50.9 430.8 53.9C438.2 56.9 443.4 63.5 445 71.3L465.9 174.5L569.1 195.4C576.9 197 583.5 202.4 586.5 209.7C589.5 217 588.7 225.5 584.3 232.2L526.1 320L584.3 407.8C588.7 414.5 589.5 422.9 586.5 430.3C583.5 437.7 576.9 443.1 569.1 444.6L465.8 465.4L445 568.7C443.4 576.5 438 583.1 430.7 586.1C423.4 589.1 414.9 588.3 408.2 583.9L320.4 525.7L232.6 583.9C225.9 588.3 217.5 589.1 210.1 586.1C202.7 583.1 197.3 576.5 195.8 568.7L175 465.4L71.7 444.5C63.9 442.9 57.3 437.5 54.3 430.2C51.3 422.9 52.1 414.4 56.5 407.7L114.7 320L56.5 232.2C52.1 225.5 51.3 217.1 54.3 209.7C57.3 202.3 63.9 196.9 71.7 195.4L175 174.6L195.9 71.3C197.5 63.5 202.9 56.9 210.2 53.9zM239.6 320C239.6 275.6 275.6 239.6 320 239.6C364.4 239.6 400.4 275.6 400.4 320C400.4 364.4 364.4 400.4 320 400.4C275.6 400.4 239.6 364.4 239.6 320zM448.4 320C448.4 249.1 390.9 191.6 320 191.6C249.1 191.6 191.6 249.1 191.6 320C191.6 390.9 249.1 448.4 320 448.4C390.9 448.4 448.4 390.9 448.4 320z"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 512 512" width="14" height="14" aria-hidden="true">
      <path
        fill="currentColor"
        d="M239.3 48.7c-107.1 8.5-191.3 98.1-191.3 207.3 0 114.9 93.1 208 208 208 33.3 0 64.7-7.8 92.6-21.7-103.4-23.4-180.6-115.8-180.6-226.3 0-65.8 27.4-125.1 71.3-167.3zM0 256c0-141.4 114.6-256 256-256 19.4 0 38.4 2.2 56.7 6.3 9.9 2.2 17.3 10.5 18.5 20.5s-4 19.8-13.1 24.4c-60.6 30.2-102.1 92.7-102.1 164.8 0 101.6 82.4 184 184 184 5 0 9.9-.2 14.8-.6 10.1-.8 19.6 4.8 23.8 14.1s2 20.1-5.3 27.1C387.3 484.8 324.8 512 256 512 114.6 512 0 397.4 0 256z"
      />
    </svg>
  );
}
