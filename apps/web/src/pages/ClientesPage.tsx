import { useCallback, useEffect, useState } from 'react';
import { apiClient } from '../lib/api';
import { Input, Panel, Select } from '../components/ui';
import { useToast } from '../components/Toast';

export function ClientesPage() {
  const [tiers, setTiers] = useState<Array<{ id: string; nome: string }>>([]);
  const [items, setItems] = useState<Array<{ id: string; nome: string; tierId: string; marginMeta?: number }>>([]);
  const [nome, setNome] = useState('');
  const [tierId, setTierId] = useState('');
  const [marginMeta, setMarginMeta] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [editNome, setEditNome] = useState('');
  const [editTier, setEditTier] = useState('');
  const [editMarginMeta, setEditMarginMeta] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const { push } = useToast();

  const load = useCallback(async () => {
    try {
      const [t, c] = await Promise.all([apiClient.listTiers(), apiClient.listClientes()]);
      setTiers(t);
      setItems(c);
    } catch (error: unknown) {
      push({ type: 'error', message: getErrorMessage(error) });
    }
  }, [push]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="px-6 py-6">
      <Header title="Clientes" description="Cadastre clientes por Tier" />

      <div className="grid gap-6 xl:grid-cols-3 enter">
        <Panel>
          <h3 className="text-xs md:text-sm font-semibold">Novo Cliente</h3>
          <Select
            value={tierId}
            onChange={(e) => setTierId(e.target.value)}
            className="mt-3"
          >
            <option value="">Selecione o Tier</option>
            {tiers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nome}
              </option>
            ))}
          </Select>
          <Input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Nome do cliente"
            className="mt-3"
          />
          <Input
            value={marginMeta}
            onChange={(e) => setMarginMeta(e.target.value)}
            placeholder="Margin Meta (%)"
            className="mt-3"
          />
          {fieldError && <p className="mt-1 text-xs text-hangar-red">{fieldError}</p>}
          <button
            className="action-btn action-btn-save mt-3 w-full"
            onClick={async () => {
              if (!tierId) {
                setFieldError('Tier é obrigatório');
                return;
              }
              if (!nome.trim()) {
                setFieldError('Nome é obrigatório');
                return;
              }
              setFieldError(null);
              try {
                const meta = marginMeta ? Number(marginMeta.replace(',', '.')) : undefined;
                await apiClient.createCliente({ tier_id: tierId, nome, margin_meta: meta });
                setNome('');
                setTierId('');
                setMarginMeta('');
                push({ type: 'success', message: 'Cliente criado' });
                load();
              } catch (error: unknown) {
                push({ type: 'error', message: getErrorMessage(error) });
              }
            }}
          >
            Salvar
          </button>
        </Panel>
        <Panel className="xl:col-span-2">
          <h3 className="text-xs md:text-sm font-semibold">Lista</h3>
          <div className="mt-3 overflow-x-auto text-xs md:text-sm">
            <table className="w-full">
              <thead className="text-left text-xs text-hangar-muted">
                <tr>
                  <th className="py-2">Cliente</th>
                  <th className="py-2">Tier</th>
                  <th className="py-2">Margin Meta</th>
                  <th className="py-2">Ações</th>
                </tr>
              </thead>
              <tbody>
                {items.map((c) => (
                  <tr key={c.id} className="border-t border-hangar-slate/20">
                    {editId === c.id ? (
                      <>
                        <td className="py-2">
                          <Input value={editNome} onChange={(e) => setEditNome(e.target.value)} />
                        </td>
                        <td className="py-2">
                          <Select value={editTier} onChange={(e) => setEditTier(e.target.value)}>
                            <option value="">Selecione o Tier</option>
                            {tiers.map((t) => (
                              <option key={t.id} value={t.id}>
                                {t.nome}
                              </option>
                            ))}
                          </Select>
                        </td>
                        <td className="py-2">
                          <Input value={editMarginMeta} onChange={(e) => setEditMarginMeta(e.target.value)} placeholder="Margin Meta (%)" />
                        </td>
                        <td className="py-2">
                          <div className="flex items-center gap-2">
                            <button
                              className="action-btn action-btn-save"
                              onClick={async () => {
                                if (!editTier) {
                                  setEditError('Tier é obrigatório');
                                  return;
                                }
                                if (!editNome.trim()) {
                                  setEditError('Nome é obrigatório');
                                  return;
                                }
                                setEditError(null);
                                const meta = editMarginMeta ? Number(editMarginMeta.replace(',', '.')) : undefined;
                                await apiClient.updateCliente(c.id, { nome: editNome, tier_id: editTier, margin_meta: meta });
                                setEditId(null);
                                push({ type: 'success', message: 'Cliente atualizado' });
                                load();
                              }}
                            >
                              Salvar
                            </button>
                            {editError && <span className="text-xs text-hangar-red">{editError}</span>}
                            <button className="action-btn action-btn-cancel" onClick={() => setEditId(null)}>Cancelar</button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="py-2">{c.nome}</td>
                        <td className="py-2 text-hangar-muted">{tiers.find((t) => t.id === c.tierId)?.nome ?? '—'}</td>
                        <td className="py-2 text-hangar-muted">{formatPercent(c.marginMeta)}</td>
                        <td className="py-2">
                          <div className="flex items-center gap-2">
                            <button
                              className="action-btn action-btn-edit"
                              onClick={() => {
                                setEditId(c.id);
                                setEditNome(c.nome);
                                setEditTier(c.tierId);
                                setEditMarginMeta(c.marginMeta !== undefined && c.marginMeta !== null ? String(c.marginMeta) : '');
                              }}
                            >
                              Editar
                            </button>
                            <button
                              className="action-btn action-btn-delete"
                              onClick={async () => {
                                if (!window.confirm('Excluir este cliente?')) return;
                                await apiClient.deleteCliente(c.id);
                                push({ type: 'success', message: 'Cliente excluído' });
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

function formatPercent(value?: number) {
  if (value === undefined || value === null) return '--';
  return `${Number(value).toFixed(1)}%`;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Erro inesperado';
}
