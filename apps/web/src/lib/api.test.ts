import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const okJsonResponse = (body: unknown) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json' }
  });

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

describe('apiClient', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
    installStorageMock();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('stores and clears auth token', async () => {
    const mod = await import('./api');

    mod.setAuthToken('abc123');
    expect(mod.getAuthToken()).toBe('abc123');
    expect(localStorage.getItem('hangar_token')).toBe('abc123');

    mod.setAuthToken('');
    expect(mod.getAuthToken()).toBe('');
    expect(localStorage.getItem('hangar_token')).toBeNull();
  });

  it('sends auth header when token is set', async () => {
    const fetchMock = vi.fn().mockResolvedValue(okJsonResponse([]));
    vi.stubGlobal('fetch', fetchMock);
    const mod = await import('./api');

    mod.setAuthToken('token-1');
    await mod.apiClient.listTiers();

    const [, init] = fetchMock.mock.calls[0];
    const headers = init.headers as Headers;
    expect(headers.get('Authorization')).toBe('Bearer token-1');
  });

  it('does not send JSON content-type for POST requests without body', async () => {
    const fetchMock = vi.fn().mockResolvedValue(okJsonResponse({ ok: true }));
    vi.stubGlobal('fetch', fetchMock);
    const mod = await import('./api');

    mod.setAuthToken('token-1');
    await mod.apiClient.approveUser('u-1');

    const [, init] = fetchMock.mock.calls[0];
    const headers = init.headers as Headers;
    expect(headers.get('Authorization')).toBe('Bearer token-1');
    expect(headers.has('Content-Type')).toBe(false);
  });

  it('builds query params for dashboard with multi-filters', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      okJsonResponse({
        series_mensal: [],
        totais: {},
        planned_vs_realizado: [],
        cliente_share: []
      })
    );
    vi.stubGlobal('fetch', fetchMock);
    const mod = await import('./api');

    await mod.apiClient.getDashboard({
      tierId: ['t1', '', 't2'],
      clienteId: 'c1',
      projetoId: ['p1', 'p2'],
      ano: 2026,
      status: 'planejado'
    });

    const [url] = fetchMock.mock.calls[0];
    expect(String(url)).toBe('/api/dashboard?tier_id=t1&tier_id=t2&cliente_id=c1&projeto_id=p1&projeto_id=p2&ano=2026&status=planejado');
  });

  it('returns CSV payload as text when API responds with text/csv', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response('coluna\nvalor', {
        status: 200,
        headers: { 'content-type': 'text/csv; charset=utf-8' }
      })
    );
    vi.stubGlobal('fetch', fetchMock);
    const mod = await import('./api');

    const csv = await mod.apiClient.exportAuditLogs();
    expect(csv).toBe('coluna\nvalor');
  });

  it('throws API error body when response is not ok', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response('unauthorized', {
        status: 401,
        headers: { 'content-type': 'text/plain' }
      })
    );
    vi.stubGlobal('fetch', fetchMock);
    const mod = await import('./api');

    await expect(mod.apiClient.me()).rejects.toThrow('unauthorized');
  });
});
