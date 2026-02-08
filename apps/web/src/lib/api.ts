export type DashboardPoint = {
  mes: string;
  receita_bruta: number;
  receita_liquida: number;
  custo: number;
  margem_bruta: number;
  margem_liquida: number;
  margem_bruta_pct: number;
  margem_liquida_pct: number;
};

export type DashboardResponse = {
  series_mensal: DashboardPoint[];
  totais: Omit<DashboardPoint, 'mes'>;
};

const API_BASE = import.meta.env.VITE_API_URL || '/api';

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Request failed');
  }
  return res.json() as Promise<T>;
}

export const apiClient = {
  getDashboard: (params: { tierId?: string; clienteId?: string; projetoId?: string; ano?: number; status?: string }) => {
    const q = new URLSearchParams();
    if (params.tierId) q.set('tier_id', params.tierId);
    if (params.clienteId) q.set('cliente_id', params.clienteId);
    if (params.projetoId) q.set('projeto_id', params.projetoId);
    if (params.ano) q.set('ano', String(params.ano));
    if (params.status) q.set('status', params.status);
    return api<DashboardResponse>(`/dashboard?${q.toString()}`);
  },

  listTiers: () => api<Array<{ id: string; nome: string }>>('/tiers'),
  createTier: (data: { nome: string }) => api('/tiers', { method: 'POST', body: JSON.stringify(data) }),

  listClientes: (tierId?: string) =>
    api<Array<{ id: string; nome: string; tierId: string }>>(`/clientes${tierId ? `?tier_id=${tierId}` : ''}`),
  createCliente: (data: { tier_id: string; nome: string }) =>
    api('/clientes', { method: 'POST', body: JSON.stringify(data) }),

  listProjetos: (clienteId?: string) =>
    api<Array<{ id: string; nome: string; clienteId: string; status: string }>>(
      `/projetos${clienteId ? `?cliente_id=${clienteId}` : ''}`
    ),
  createProjeto: (data: { cliente_id: string; nome: string; status?: string }) =>
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
    status: 'planejado' | 'realizado';
    observacoes?: string;
  }) => api('/registros', { method: 'POST', body: JSON.stringify(data) })
  ,
  updateTier: (id: string, data: { nome?: string }) =>
    api(`/tiers/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteTier: (id: string) => api(`/tiers/${id}`, { method: 'DELETE' }),

  updateCliente: (id: string, data: { tier_id?: string; nome?: string }) =>
    api(`/clientes/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteCliente: (id: string) => api(`/clientes/${id}`, { method: 'DELETE' }),

  updateProjeto: (id: string, data: { cliente_id?: string; nome?: string; status?: string }) =>
    api(`/projetos/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteProjeto: (id: string) => api(`/projetos/${id}`, { method: 'DELETE' }),

  updateImposto: (id: string, data: { percentual?: number; vigencia_inicio?: string; vigencia_fim?: string }) =>
    api(`/impostos/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteImposto: (id: string) => api(`/impostos/${id}`, { method: 'DELETE' }),

  updateRegistro: (id: string, data: any) =>
    api(`/registros/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteRegistro: (id: string) => api(`/registros/${id}`, { method: 'DELETE' })
};
