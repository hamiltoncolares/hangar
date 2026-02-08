import { useEffect, useState } from 'react';
import { apiClient } from '../lib/api';
import { Button, Input, Panel, Select, TextArea } from '../components/ui';
import { useToast } from '../components/Toast';
import { isMonth } from '../lib/validators';

export function RegistrosPage() {
  const [projetos, setProjetos] = useState<Array<{ id: string; nome: string }>>([]);
  const [impostos, setImpostos] = useState<Array<{ id: string; projetoId: string; percentual: number }>>([]);
  const [items, setItems] = useState<any[]>([]);
  const [projetoId, setProjetoId] = useState('');
  const [impostoId, setImpostoId] = useState('');
  const [mesRef, setMesRef] = useState('');
  const [receitaBruta, setReceitaBruta] = useState('');
  const [custo, setCusto] = useState('');
  const [marginMeta, setMarginMeta] = useState('');
  const [status, setStatus] = useState<'planejado' | 'realizado'>('planejado');
  const [observacoes, setObservacoes] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [editProjeto, setEditProjeto] = useState('');
  const [editImposto, setEditImposto] = useState('');
  const [editMes, setEditMes] = useState('');
  const [editReceita, setEditReceita] = useState('');
  const [editCusto, setEditCusto] = useState('');
  const [editMarginMeta, setEditMarginMeta] = useState('');
  const [editStatus, setEditStatus] = useState<'planejado' | 'realizado'>('planejado');
  const [editObs, setEditObs] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const { push } = useToast();
  const [filterProjeto, setFilterProjeto] = useState('');
  const [filterStatus, setFilterStatus] = useState<'planejado' | 'realizado' | 'pipeline' | ''>('');
  const [filterMes, setFilterMes] = useState('');

  const load = async () => {
    const [p, i, r] = await Promise.all([
      apiClient.listProjetos(),
      apiClient.listImpostos(),
      apiClient.listRegistros({
        projetoId: filterProjeto || undefined,
        mesRef: filterMes || undefined,
        status: filterStatus && filterStatus !== 'pipeline' ? filterStatus : undefined
      })
    ]);
    setProjetos(p);
    setImpostos(i);
    if (Array.isArray(r)) {
      const arr = r as any[];
      setItems(filterStatus === 'pipeline' ? applyPipeline(arr) : arr);
    } else {
      setItems([]);
      push({ type: 'error', message: 'Resposta inválida para registros' });
    }
  };

  useEffect(() => {
    load().catch((e) => push({ type: 'error', message: e.message }));
  }, [filterProjeto, filterMes, filterStatus]);

  const impostosDoProjeto = impostos.filter((i) => i.projetoId === projetoId);

  return (
    <div className="px-6 py-6">
      <Header title="Registros Mensais" description="Entrada de receitas e custos por projeto" />

      <div className="grid gap-6 xl:grid-cols-3 enter">
        <Panel>
          <h3 className="text-xs md:text-sm font-semibold">Novo Registro</h3>
          <Select
            value={projetoId}
            onChange={(e) => {
              setProjetoId(e.target.value);
              setImpostoId('');
            }}
            className="mt-3"
          >
            <option value="">Selecione o Projeto</option>
            {projetos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </Select>
          <Select
            value={impostoId}
            onChange={(e) => setImpostoId(e.target.value)}
            className="mt-3"
          >
            <option value="">Selecione o Imposto</option>
            {impostosDoProjeto.map((i) => (
              <option key={i.id} value={i.id}>
                {i.percentual}%
              </option>
            ))}
          </Select>
          <Input
            value={mesRef}
            onChange={(e) => setMesRef(e.target.value)}
            placeholder="Mês (YYYY-MM)"
            className="mt-3"
          />
          <Input
            value={receitaBruta}
            onChange={(e) => setReceitaBruta(formatCurrencyInput(e.target.value))}
            placeholder="Receita bruta"
            className="mt-3"
          />
          <Input
            value={custo}
            onChange={(e) => setCusto(formatCurrencyInput(e.target.value))}
            placeholder="Custo projetado"
            className="mt-3"
          />
          <Input
            value={marginMeta}
            onChange={(e) => setMarginMeta(formatPercentInput(e.target.value))}
            placeholder="Margin Meta (%)"
            className="mt-3"
          />
          <Select
            value={status}
            onChange={(e) => setStatus(e.target.value as 'planejado' | 'realizado')}
            className="mt-3"
          >
            <option value="planejado">Planejado</option>
            <option value="realizado">Realizado</option>
          </Select>
          <TextArea
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            placeholder="Observações"
            className="mt-3"
          />
          {fieldError && <p className="mt-1 text-xs text-hangar-red">{fieldError}</p>}
          <Button
            onClick={async () => {
              if (!projetoId) return setFieldError('Projeto é obrigatório');
              if (!impostoId) return setFieldError('Imposto é obrigatório');
              if (!mesRef) return setFieldError('Mês é obrigatório');
              if (!isMonth(mesRef)) return setFieldError('Mês deve ser YYYY-MM');
              if (!receitaBruta) return setFieldError('Receita é obrigatória');
              if (!custo) return setFieldError('Custo é obrigatório');
              setFieldError(null);
              try {
                await apiClient.createRegistro({
                  projeto_id: projetoId,
                  imposto_id: impostoId,
                  mes_ref: mesRef,
                  receita_bruta: parseCurrency(receitaBruta),
                  custo_projetado: parseCurrency(custo),
                  ...(marginMeta.trim() ? { margin_meta: parsePercent(marginMeta) } : {}),
                  status,
                  observacoes
                });
                setProjetoId('');
                setImpostoId('');
                setMesRef('');
                setReceitaBruta('');
                setCusto('');
                setMarginMeta('');
                setObservacoes('');
                push({ type: 'success', message: 'Registro criado' });
                load();
              } catch (e: any) {
                push({ type: 'error', message: e.message });
              }
            }}
            className="mt-3 w-full"
          >
            Salvar
          </Button>
        </Panel>
        <Panel className="xl:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-xs md:text-sm font-semibold">Lista</h3>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <Select value={filterProjeto} onChange={(e) => setFilterProjeto(e.target.value)} className="w-40">
                <option value="">Todos os Projetos</option>
                {projetos.map((p) => (
                  <option key={p.id} value={p.id}>{p.nome}</option>
                ))}
              </Select>
              <Input value={filterMes} onChange={(e) => setFilterMes(e.target.value)} placeholder="YYYY-MM" className="w-28" />
              <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as any)} className="w-32">
                <option value="">Status</option>
                <option value="planejado">Planejado</option>
                <option value="realizado">Realizado</option>
                <option value="pipeline">Pipeline</option>
              </Select>
            </div>
          </div>
          <div className="mt-3 overflow-x-auto text-xs md:text-sm">
            <table className="w-full">
              <thead className="text-left text-xs text-hangar-muted">
                <tr>
                  <th className="py-2">Projeto</th>
                  <th className="py-2">Mês</th>
                  <th className="py-2">Receita</th>
                  <th className="py-2">Custo</th>
                  <th className="py-2">Margin Meta</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody>
              {(Array.isArray(items) ? items : []).map((r) => (
                <tr key={r.id} className="border-t border-hangar-slate/20 odd:bg-hangar-surface/40 hover:bg-hangar-surface/70 transition">
                    {editId === r.id ? (
                      <td colSpan={6} className="py-2">
                        <div className="grid gap-2 md:grid-cols-7">
                          <Select value={editProjeto} onChange={(e) => setEditProjeto(e.target.value)}>
                            <option value="">Projeto</option>
                            {projetos.map((p) => (
                              <option key={p.id} value={p.id}>{p.nome}</option>
                            ))}
                          </Select>
                          <Select value={editImposto} onChange={(e) => setEditImposto(e.target.value)}>
                            <option value="">Imposto</option>
                            {impostos.filter((i) => i.projetoId === editProjeto).map((i) => (
                              <option key={i.id} value={i.id}>{i.percentual}%</option>
                            ))}
                          </Select>
                          <Input value={editMes} onChange={(e) => setEditMes(e.target.value)} placeholder="YYYY-MM" />
                          <Input value={editReceita} onChange={(e) => setEditReceita(formatCurrencyInput(e.target.value))} placeholder="Receita" />
                          <Input value={editCusto} onChange={(e) => setEditCusto(formatCurrencyInput(e.target.value))} placeholder="Custo" />
                          <Input value={editMarginMeta} onChange={(e) => setEditMarginMeta(formatPercentInput(e.target.value))} placeholder="Margin %" />
                          <Select value={editStatus} onChange={(e) => setEditStatus(e.target.value as any)}>
                            <option value="planejado">Planejado</option>
                            <option value="realizado">Realizado</option>
                          </Select>
                          <TextArea value={editObs} onChange={(e) => setEditObs(e.target.value)} placeholder="Obs" />
                          <div className="flex items-center gap-2">
                            <Button
                              onClick={async () => {
                                if (!editProjeto) return setEditError('Projeto é obrigatório');
                                if (!editImposto) return setEditError('Imposto é obrigatório');
                                if (!editMes) return setEditError('Mês é obrigatório');
                                if (!isMonth(editMes)) return setEditError('Mês deve ser YYYY-MM');
                                if (!editReceita) return setEditError('Receita é obrigatória');
                                if (!editCusto) return setEditError('Custo é obrigatório');
                                setEditError(null);
                                await apiClient.updateRegistro(r.id, {
                                  projeto_id: editProjeto,
                                  imposto_id: editImposto,
                                  mes_ref: editMes,
                                  receita_bruta: parseCurrency(editReceita),
                                  custo_projetado: parseCurrency(editCusto),
                                  ...(editMarginMeta.trim() ? { margin_meta: parsePercent(editMarginMeta) } : {}),
                                  status: editStatus,
                                  observacoes: editObs
                                });
                                setEditId(null);
                                push({ type: 'success', message: 'Registro atualizado' });
                                load();
                              }}
                            >
                              Salvar
                            </Button>
                            {editError && <span className="text-xs text-hangar-red">{editError}</span>}
                            <button className="text-xs text-hangar-muted" onClick={() => setEditId(null)}>Cancelar</button>
                          </div>
                        </div>
                      </td>
                    ) : (
                      <>
                        <td className="py-2">{projetos.find((p) => p.id === r.projetoId)?.nome ?? '—'}</td>
                        <td className="py-2 text-hangar-muted">{String(r.mesRef).slice(0, 10)}</td>
                        <td className="py-2">{Number(r.receitaBruta).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                        <td className="py-2">{Number(r.custoProjetado).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                        <td className="py-2 text-hangar-muted">{formatPercent(r.marginMeta)}</td>
                        <td className="py-2">
                          <div className="flex items-center gap-2">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] ${
                                r.status === 'realizado'
                                  ? 'bg-hangar-green/15 text-hangar-green'
                                  : 'bg-hangar-orange/15 text-hangar-orange'
                              }`}
                            >
                              {r.status}
                            </span>
                            <button
                              className="text-xs text-hangar-cyan"
                              onClick={() => {
                                setEditId(r.id);
                                setEditProjeto(r.projetoId);
                                setEditImposto(r.impostoId);
                                setEditMes(String(r.mesRef).slice(0, 7));
                                setEditReceita(String(r.receitaBruta));
                                setEditCusto(String(r.custoProjetado));
                                setEditMarginMeta(r.marginMeta !== null && r.marginMeta !== undefined ? formatPercentInput(String(r.marginMeta)) : '');
                                setEditStatus(r.status);
                                setEditObs(r.observacoes ?? '');
                              }}
                            >
                              Editar
                            </button>
                            <button
                              className="text-xs text-hangar-red"
                              onClick={async () => {
                                if (!window.confirm('Excluir este registro?')) return;
                                await apiClient.deleteRegistro(r.id);
                                push({ type: 'success', message: 'Registro excluído' });
                                load();
                              }}
                            >
                              Excluir
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </div>
  );
}

function Header({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="text-xs text-hangar-muted">{description}</p>
    </div>
  );
}

function formatCurrencyInput(value: string) {
  const digits = value.replace(/\D/g, '');
  const number = Number(digits) / 100;
  return number.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function parseCurrency(value: string) {
  const digits = value.replace(/\D/g, '');
  return Number(digits) / 100;
}

function formatPercentInput(value: string) {
  const cleaned = value.replace(/[^\d.,]/g, '').replace(',', '.');
  return cleaned;
}

function parsePercent(value: string) {
  const cleaned = value.replace(',', '.');
  const num = Number(cleaned);
  return Number.isNaN(num) ? 0 : num;
}

function formatPercent(value?: number) {
  if (value === undefined || value === null) return '--';
  return `${Number(value).toFixed(1)}%`;
}

function applyPipeline(items: any[]) {
  const byKey = new Map<string, any>();
  for (const r of items) {
    const key = `${r.projetoId}-${String(r.mesRef).slice(0, 10)}`;
    const current = byKey.get(key);
    if (!current) {
      byKey.set(key, r);
      continue;
    }
    if (current.status === 'realizado') {
      if (r.status === 'realizado') {
        if (new Date(r.updatedAt) > new Date(current.updatedAt)) byKey.set(key, r);
      }
      continue;
    }
    if (r.status === 'realizado') {
      byKey.set(key, r);
      continue;
    }
    if (new Date(r.updatedAt) > new Date(current.updatedAt)) byKey.set(key, r);
  }
  return Array.from(byKey.values());
}
