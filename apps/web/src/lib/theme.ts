export type Theme = 'light' | 'dark';

const THEME_KEY = 'hangar_theme';

export function getInitialTheme(): Theme {
  const stored = localStorage.getItem(THEME_KEY);
  if (stored === 'light' || stored === 'dark') return stored;
  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  return prefersDark ? 'dark' : 'light';
}

export function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  localStorage.setItem(THEME_KEY, theme);
}

export function listenThemeSync(onChange: (theme: Theme) => void) {
  function handler(e: StorageEvent) {
    if (e.key === THEME_KEY && (e.newValue === 'light' || e.newValue === 'dark')) {
      onChange(e.newValue);
    }
  }
  window.addEventListener('storage', handler);
  return () => window.removeEventListener('storage', handler);
}
