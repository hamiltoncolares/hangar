import { useEffect, useState } from 'react';
import { apiClient } from '../lib/api';
import { Button, Input, Panel, Select } from '../components/ui';
import { useToast } from '../components/Toast';

export function ProjetosPage() {
  const [clientes, setClientes] = useState<Array<{ id: string; nome: string }>>([]);
  const [items, setItems] = useState<Array<{ id: string; nome: string; clienteId: string; status: string; marginMeta?: number }>>([]);
  const [nome, setNome] = useState('');
  const [clienteId, setClienteId] = useState('');
  const [status, setStatus] = useState('ativo');
  const [marginMeta, setMarginMeta] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [editNome, setEditNome] = useState('');
  const [editCliente, setEditCliente] = useState('');
  const [editStatus, setEditStatus] = useState('ativo');
  const [editMarginMeta, setEditMarginMeta] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const { push } = useToast();

  const load = async () => {
    const [c, p] = await Promise.all([apiClient.listClientes(), apiClient.listProjetos()]);
    setClientes(c);
    setItems(p);
  };

  useEffect(() => {
    load().catch((e) => push({ type: 'error', message: e.message }));
  }, []);

  return (
    <div className="px-6 py-6">
      <Header title="Projetos" description="Cadastre projetos por cliente" />

      <div className="grid gap-6 xl:grid-cols-3 enter">
        <Panel>
          <h3 className="text-xs md:text-sm font-semibold">Novo Projeto</h3>
          <Select
            value={clienteId}
            onChange={(e) => setClienteId(e.target.value)}
            className="mt-3"
          >
            <option value="">Selecione o Cliente</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </Select>
          <Input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Nome do projeto"
            className="mt-3"
          />
          <Input
            value={marginMeta}
            onChange={(e) => setMarginMeta(e.target.value)}
            placeholder="Margin Meta (%)"
            className="mt-3"
          />
          {fieldError && <p className="mt-1 text-xs text-hangar-red">{fieldError}</p>}
          <Select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="mt-3"
          >
            <option value="ativo">Ativo</option>
            <option value="pausado">Pausado</option>
          </Select>
          <Button
            onClick={async () => {
              if (!clienteId) {
                setFieldError('Cliente é obrigatório');
                return;
              }
              if (!nome.trim()) {
                setFieldError('Nome é obrigatório');
                return;
              }
              setFieldError(null);
              try {
                const meta = marginMeta ? Number(marginMeta.replace(',', '.')) : undefined;
                await apiClient.createProjeto({ cliente_id: clienteId, nome, status, margin_meta: meta });
                setNome('');
                setClienteId('');
                setMarginMeta('');
                push({ type: 'success', message: 'Projeto criado' });
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
          <h3 className="text-xs md:text-sm font-semibold">Lista</h3>
          <div className="mt-3 overflow-x-auto text-xs md:text-sm">
            <table className="w-full">
              <thead className="text-left text-xs text-hangar-muted">
                <tr>
                  <th className="py-2">Projeto</th>
                  <th className="py-2">Cliente</th>
                  <th className="py-2">Status</th>
                  <th className="py-2">Margin Meta</th>
                  <th className="py-2">Ações</th>
                </tr>
              </thead>
              <tbody>
                {items.map((p) => (
                  <tr key={p.id} className="border-t border-hangar-slate/20">
                    {editId === p.id ? (
                      <>
                        <td className="py-2">
                          <Input value={editNome} onChange={(e) => setEditNome(e.target.value)} />
                        </td>
                        <td className="py-2">
                          <Select value={editCliente} onChange={(e) => setEditCliente(e.target.value)}>
                            <option value="">Selecione o Cliente</option>
                            {clientes.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.nome}
                              </option>
                            ))}
                          </Select>
                        </td>
                        <td className="py-2">
                          <Select value={editStatus} onChange={(e) => setEditStatus(e.target.value)}>
                            <option value="ativo">Ativo</option>
                            <option value="pausado">Pausado</option>
                          </Select>
                        </td>
                        <td className="py-2">
                          <Input value={editMarginMeta} onChange={(e) => setEditMarginMeta(e.target.value)} placeholder="Margin Meta (%)" />
                        </td>
                        <td className="py-2">
                          <div className="flex items-center gap-2">
                            <Button
                              onClick={async () => {
                                if (!editCliente) {
                                  setEditError('Cliente é obrigatório');
                                  return;
                                }
                                if (!editNome.trim()) {
                                  setEditError('Nome é obrigatório');
                                  return;
                                }
                                setEditError(null);
                                const meta = editMarginMeta ? Number(editMarginMeta.replace(',', '.')) : undefined;
                                await apiClient.updateProjeto(p.id, { nome: editNome, cliente_id: editCliente, status: editStatus, margin_meta: meta });
                                setEditId(null);
                                push({ type: 'success', message: 'Projeto atualizado' });
                                load();
                              }}
                            >
                              Salvar
                            </Button>
                            {editError && <span className="text-xs text-hangar-red">{editError}</span>}
                            <button className="text-xs text-hangar-muted" onClick={() => setEditId(null)}>Cancelar</button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="py-2">{p.nome}</td>
                        <td className="py-2 text-hangar-muted">{clientes.find((c) => c.id === p.clienteId)?.nome ?? '—'}</td>
                        <td className="py-2 text-hangar-muted">{p.status}</td>
                        <td className="py-2 text-hangar-muted">{formatPercent(p.marginMeta)}</td>
                        <td className="py-2">
                          <div className="flex items-center gap-2">
                            <button
                              className="text-xs text-hangar-cyan"
                              onClick={() => {
                                setEditId(p.id);
                                setEditNome(p.nome);
                                setEditCliente(p.clienteId);
                                setEditStatus(p.status);
                                setEditMarginMeta(p.marginMeta !== undefined && p.marginMeta !== null ? String(p.marginMeta) : '');
                              }}
                            >
                              Editar
                            </button>
                            <button
                              className="text-xs text-hangar-red"
                              onClick={async () => {
                                if (!window.confirm('Excluir este projeto?')) return;
                                await apiClient.deleteProjeto(p.id);
                                push({ type: 'success', message: 'Projeto excluído' });
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
