import { useEffect, useState } from 'react';
import { apiClient } from '../lib/api';
import { Button, Input, Panel, Select } from '../components/ui';
import { useToast } from '../components/Toast';

export function ProjetosPage() {
  const [clientes, setClientes] = useState<Array<{ id: string; nome: string }>>([]);
  const [items, setItems] = useState<Array<{ id: string; nome: string; clienteId: string; status: string }>>([]);
  const [nome, setNome] = useState('');
  const [clienteId, setClienteId] = useState('');
  const [status, setStatus] = useState('ativo');
  const [editId, setEditId] = useState<string | null>(null);
  const [editNome, setEditNome] = useState('');
  const [editCliente, setEditCliente] = useState('');
  const [editStatus, setEditStatus] = useState('ativo');
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
                await apiClient.createProjeto({ cliente_id: clienteId, nome, status });
                setNome('');
                setClienteId('');
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
          <ul className="mt-3 space-y-2 text-xs md:text-sm">
            {items.map((p) => (
              <li key={p.id} className="flex items-center justify-between border-b border-hangar-slate/20 pb-2">
                {editId === p.id ? (
                  <div className="flex w-full items-center gap-2">
                    <Select value={editCliente} onChange={(e) => setEditCliente(e.target.value)}>
                      <option value="">Selecione o Cliente</option>
                      {clientes.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nome}
                        </option>
                      ))}
                    </Select>
                    <Input value={editNome} onChange={(e) => setEditNome(e.target.value)} />
                    <Select value={editStatus} onChange={(e) => setEditStatus(e.target.value)}>
                      <option value="ativo">Ativo</option>
                      <option value="pausado">Pausado</option>
                    </Select>
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
                        await apiClient.updateProjeto(p.id, { nome: editNome, cliente_id: editCliente, status: editStatus });
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
                ) : (
                  <>
                    <span>{p.nome}</span>
                    <span className="text-xs text-hangar-muted">{clientes.find((c) => c.id === p.clienteId)?.nome ?? '—'}</span>
                    <div className="flex items-center gap-2">
                      <button
                        className="text-xs text-hangar-cyan"
                        onClick={() => {
                          setEditId(p.id);
                          setEditNome(p.nome);
                          setEditCliente(p.clienteId);
                          setEditStatus(p.status);
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
                  </>
                )}
              </li>
            ))}
          </ul>
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
