export type DashboardPoint = {
  mes: string;
  receita_bruta: number;
  receita_liquida: number;
  custo: number;
  margem_bruta: number;
  margem_liquida: number;
  margin_meta_pct: number;
  margem_bruta_pct: number;
  margem_liquida_pct: number;
};

export type DashboardResponse = {
  series_mensal: DashboardPoint[];
  totais: Omit<DashboardPoint, 'mes'>;
  planned_vs_realizado: Array<{ mes: string; planejado: number; realizado: number; custo_planejado: number; custo_realizado: number }>;
  cliente_share: Array<{ id: string; nome: string; receita_bruta: number; pct: number }>;
};

export type GoalsResponse = {
  tiers: Array<{ id: string; nome: string; meta_pct: number; atual_pct: number }>;
  clientes: Array<{ id: string; nome: string; meta_pct: number; atual_pct: number }>;
  projetos: Array<{ id: string; nome: string; meta_pct: number; atual_pct: number }>;
  series_mensal: Array<{ mes: string; meta_pct: number; atual_pct: number }>;
  series_trimestral: Array<{ mes: string; meta_pct: number; atual_pct: number }>;
};

const API_BASE = import.meta.env.VITE_API_URL || '/api';
const AUTH_KEY = 'hangar_token';
let authToken = typeof window !== 'undefined' ? localStorage.getItem(AUTH_KEY) || '' : '';

export function setAuthToken(token: string) {
  authToken = token;
  if (typeof window === 'undefined') return;
  if (token) localStorage.setItem(AUTH_KEY, token);
  else localStorage.removeItem(AUTH_KEY);
}

export function getAuthToken() {
  return authToken;
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
    },
    ...init
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Request failed');
  }
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('text/csv')) {
    const text = await res.text();
    return text as unknown as T;
  }
  return res.json() as Promise<T>;
}

export const apiClient = {
  signup: (data: { email: string; password: string; name?: string }) =>
    api<{ ok: boolean; user: { id: string; email: string; role: string; status: string; name?: string | null } }>(
      '/auth/signup',
      { method: 'POST', body: JSON.stringify(data) }
    ),
  login: (data: { email: string; password: string }) =>
    api<{ token: string; user: { id: string; email: string; role: string; status: string; name?: string | null } }>(
      '/auth/login',
      { method: 'POST', body: JSON.stringify(data) }
    ),
  me: () =>
    api<{ user: { id: string; email: string; role: string; status: string; name?: string | null } }>('/auth/me'),

  listUsers: () =>
    api<
      Array<{
        id: string;
        email: string;
        name?: string | null;
        role: string;
        status: string;
        createdAt: string;
        tiers: Array<{ id: string; nome: string }>;
      }>
    >('/admin/users'),
  approveUser: (id: string) => api(`/admin/users/${id}/approve`, { method: 'POST' }),
  promoteUser: (id: string) => api(`/admin/users/${id}/promote`, { method: 'POST' }),
  setUserTiers: (id: string, tier_ids: string[]) =>
    api(`/admin/users/${id}/tiers`, { method: 'PUT', body: JSON.stringify({ tier_ids }) }),
  exportAuditLogs: () => api(`/admin/audit/export`),

  getDashboard: (params: {
    tierId?: string | string[];
    clienteId?: string | string[];
    projetoId?: string | string[];
    ano?: number;
    status?: string;
  }) => {
    const q = new URLSearchParams();
    if (params.tierId) {
      const ids = Array.isArray(params.tierId) ? params.tierId : [params.tierId];
      ids.filter(Boolean).forEach((id) => q.append('tier_id', id));
    }
    if (params.clienteId) {
      const ids = Array.isArray(params.clienteId) ? params.clienteId : [params.clienteId];
      ids.filter(Boolean).forEach((id) => q.append('cliente_id', id));
    }
    if (params.projetoId) {
      const ids = Array.isArray(params.projetoId) ? params.projetoId : [params.projetoId];
      ids.filter(Boolean).forEach((id) => q.append('projeto_id', id));
    }
    if (params.ano) q.set('ano', String(params.ano));
    if (params.status) q.set('status', params.status);
    return api<DashboardResponse>(`/dashboard?${q.toString()}`);
  },

  getGoals: (params: {
    tierId?: string | string[];
    clienteId?: string | string[];
    projetoId?: string | string[];
    ano?: number;
    status?: string;
  }) => {
    const q = new URLSearchParams();
    if (params.tierId) {
      const ids = Array.isArray(params.tierId) ? params.tierId : [params.tierId];
      ids.filter(Boolean).forEach((id) => q.append('tier_id', id));
    }
    if (params.clienteId) {
      const ids = Array.isArray(params.clienteId) ? params.clienteId : [params.clienteId];
      ids.filter(Boolean).forEach((id) => q.append('cliente_id', id));
    }
    if (params.projetoId) {
      const ids = Array.isArray(params.projetoId) ? params.projetoId : [params.projetoId];
      ids.filter(Boolean).forEach((id) => q.append('projeto_id', id));
    }
    if (params.ano) q.set('ano', String(params.ano));
    if (params.status) q.set('status', params.status);
    return api<GoalsResponse>(`/goals?${q.toString()}`);
  },

  listTiers: () => api<Array<{ id: string; nome: string; marginMeta?: number }>>('/tiers'),
  createTier: (data: { nome: string; margin_meta?: number }) => api('/tiers', { method: 'POST', body: JSON.stringify(data) }),

  listClientes: (tierId?: string) =>
    api<Array<{ id: string; nome: string; tierId: string; marginMeta?: number }>>(`/clientes${tierId ? `?tier_id=${tierId}` : ''}`),
  createCliente: (data: { tier_id: string; nome: string; margin_meta?: number }) =>
    api('/clientes', { method: 'POST', body: JSON.stringify(data) }),

  listProjetos: (clienteId?: string) =>
    api<Array<{ id: string; nome: string; clienteId: string; status: string; marginMeta?: number }>>(
      `/projetos${clienteId ? `?cliente_id=${clienteId}` : ''}`
    ),
  createProjeto: (data: { cliente_id: string; nome: string; status?: string; margin_meta?: number }) =>
    api('/projetos', { method: 'POST', body: JSON.stringify(data) }),

  listImpostos: (projetoId?: string) =>
    api<Array<{ id: string; projetoId: string; percentual: number; vigenciaInicio: string; vigenciaFim?: string }>>(
      `/impostos${projetoId ? `?projeto_id=${projetoId}` : ''}`
    ),
  createImposto: (data: { projeto_id: string; percentual: number; vigencia_inicio: string; vigencia_fim?: string }) =>
    api('/impostos', { method: 'POST', body: JSON.stringify(data) }),

  listRegistros: (params: { projetoId?: string; mesRef?: string; status?: string }) => {
    const q = new URLSearchParams();
    if (params.projetoId) q.set('projeto_id', params.projetoId);
    if (params.mesRef) q.set('mes_ref', params.mesRef);
    if (params.status) q.set('status', params.status);
    return api(
      `/registros${q.toString() ? `?${q.toString()}` : ''}`
    );
  },
  createRegistro: (data: {
    projeto_id: string;
    mes_ref: string;
    receita_bruta: number;
    imposto_id: string;
    receita_liquida?: number;
    custo_projetado: number;
    margin_meta?: number;
    status: 'planejado' | 'realizado';
    observacoes?: string;
  }) => api('/registros', { method: 'POST', body: JSON.stringify(data) })
  ,
  updateTier: (id: string, data: { nome?: string; margin_meta?: number }) =>
    api(`/tiers/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteTier: (id: string) => api(`/tiers/${id}`, { method: 'DELETE' }),

  updateCliente: (id: string, data: { tier_id?: string; nome?: string; margin_meta?: number }) =>
    api(`/clientes/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteCliente: (id: string) => api(`/clientes/${id}`, { method: 'DELETE' }),

  updateProjeto: (id: string, data: { cliente_id?: string; nome?: string; status?: string; margin_meta?: number }) =>
    api(`/projetos/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteProjeto: (id: string) => api(`/projetos/${id}`, { method: 'DELETE' }),

  updateImposto: (id: string, data: { percentual?: number; vigencia_inicio?: string; vigencia_fim?: string }) =>
    api(`/impostos/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteImposto: (id: string) => api(`/impostos/${id}`, { method: 'DELETE' }),

  updateRegistro: (id: string, data: any) =>
    api(`/registros/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteRegistro: (id: string) => api(`/registros/${id}`, { method: 'DELETE' })
};
