import { useEffect, useState } from 'react';
import { apiClient } from '../lib/api';
import { Button, Input, Panel, Select } from '../components/ui';
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

  const load = async () => {
    const [t, c] = await Promise.all([apiClient.listTiers(), apiClient.listClientes()]);
    setTiers(t);
    setItems(c);
  };

  useEffect(() => {
    load().catch((e) => push({ type: 'error', message: e.message }));
  }, []);

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
          <Button
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
            {items.map((c) => (
              <li key={c.id} className="flex items-center justify-between border-b border-hangar-slate/20 pb-2">
                {editId === c.id ? (
                  <div className="flex w-full items-center gap-2">
                    <Select value={editTier} onChange={(e) => setEditTier(e.target.value)}>
                      <option value="">Selecione o Tier</option>
                      {tiers.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.nome}
                        </option>
                      ))}
                    </Select>
                    <Input value={editNome} onChange={(e) => setEditNome(e.target.value)} />
                    <Input value={editMarginMeta} onChange={(e) => setEditMarginMeta(e.target.value)} placeholder="Margin Meta (%)" />
                    <Button
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
                    </Button>
                    {editError && <span className="text-xs text-hangar-red">{editError}</span>}
                    <button className="text-xs text-hangar-muted" onClick={() => setEditId(null)}>Cancelar</button>
                  </div>
                ) : (
                  <>
                    <span>{c.nome}</span>
                    <span className="text-xs text-hangar-muted">{tiers.find((t) => t.id === c.tierId)?.nome ?? '—'}</span>
                    <div className="flex items-center gap-2">
                      <button
                        className="text-xs text-hangar-cyan"
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
                        className="text-xs text-hangar-red"
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
