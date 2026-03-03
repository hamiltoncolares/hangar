import { beforeEach, describe, expect, it, vi } from 'vitest';
import { applyTheme, getInitialTheme, listenThemeSync } from './theme';

function installStorageMock() {
  const store = new Map<string, string>();
  const storage = {
    getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
    setItem: (key: string, value: string) => {
      store.set(key, String(value));
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    get length() {
      return store.size;
    }
  } satisfies Storage;

  vi.stubGlobal('localStorage', storage);
  Object.defineProperty(window, 'localStorage', {
    value: storage,
    configurable: true,
    writable: true
  });
}

function setMatchMedia(matches: boolean) {
  const fn = vi.fn().mockImplementation(() => ({
    matches,
    media: '(prefers-color-scheme: dark)',
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  }));

  vi.stubGlobal('matchMedia', fn);
  Object.defineProperty(window, 'matchMedia', {
    value: fn,
    configurable: true,
    writable: true
  });
}

describe('theme utils', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    installStorageMock();
    document.documentElement.className = '';
  });

  it('prefers stored theme when valid', () => {
    localStorage.setItem('hangar_theme', 'dark');
    expect(getInitialTheme()).toBe('dark');
  });

  it('falls back to system preference when no stored value', () => {
    setMatchMedia(true);
    expect(getInitialTheme()).toBe('dark');

    localStorage.clear();
    setMatchMedia(false);
    expect(getInitialTheme()).toBe('light');
  });

  it('applies theme class and persists it', () => {
    applyTheme('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem('hangar_theme')).toBe('dark');

    applyTheme('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(localStorage.getItem('hangar_theme')).toBe('light');
  });

  it('reacts to storage sync changes and can unsubscribe', () => {
    const onChange = vi.fn();
    const unsubscribe = listenThemeSync(onChange);

    window.dispatchEvent(new StorageEvent('storage', { key: 'hangar_theme', newValue: 'dark' }));
    window.dispatchEvent(new StorageEvent('storage', { key: 'hangar_theme', newValue: 'invalid' }));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('dark');

    unsubscribe();
    window.dispatchEvent(new StorageEvent('storage', { key: 'hangar_theme', newValue: 'light' }));
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});
