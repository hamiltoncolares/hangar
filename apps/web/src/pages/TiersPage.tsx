import { useEffect, useState } from 'react';
import { apiClient } from '../lib/api';
import { Button, Input, Panel } from '../components/ui';
import { useToast } from '../components/Toast';

export function TiersPage() {
  const [items, setItems] = useState<Array<{ id: string; nome: string; marginMeta?: number }>>([]);
  const [nome, setNome] = useState('');
  const [marginMeta, setMarginMeta] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [editNome, setEditNome] = useState('');
  const [editMarginMeta, setEditMarginMeta] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const { push } = useToast();

  const load = () =>
    apiClient
      .listTiers()
      .then(setItems)
      .catch((e) => push({ type: 'error', message: e.message }));

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="px-6 py-6">
      <Header title="Tiers" description="Cadastre e organize seus tiers" />

      <div className="grid gap-6 xl:grid-cols-3 enter">
        <Panel>
          <h3 className="text-xs md:text-sm font-semibold">Novo Tier</h3>
          <Input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Nome do tier"
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
              if (!nome.trim()) {
                setFieldError('Nome é obrigatório');
                return;
              }
              setFieldError(null);
              try {
                const meta = marginMeta ? Number(marginMeta.replace(',', '.')) : undefined;
                await apiClient.createTier({ nome, margin_meta: meta });
                setNome('');
                setMarginMeta('');
                push({ type: 'success', message: 'Tier criado' });
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
            {items.map((t) => (
              <li key={t.id} className="flex items-center justify-between border-b border-hangar-slate/20 pb-2">
                {editId === t.id ? (
                  <div className="flex w-full items-center gap-2">
                    <Input value={editNome} onChange={(e) => setEditNome(e.target.value)} />
                    <Input value={editMarginMeta} onChange={(e) => setEditMarginMeta(e.target.value)} placeholder="Margin Meta (%)" />
                    <Button
                      onClick={async () => {
                        if (!editNome.trim()) {
                          setEditError('Nome é obrigatório');
                          return;
                        }
                        setEditError(null);
                        const meta = editMarginMeta ? Number(editMarginMeta.replace(',', '.')) : undefined;
                        await apiClient.updateTier(t.id, { nome: editNome, margin_meta: meta });
                        setEditId(null);
                        push({ type: 'success', message: 'Tier atualizado' });
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
                    <span>{t.nome}</span>
                    <div className="flex items-center gap-2">
                      <button
                        className="text-xs text-hangar-cyan"
                        onClick={() => {
                          setEditId(t.id);
                          setEditNome(t.nome);
                          setEditMarginMeta(t.marginMeta !== undefined && t.marginMeta !== null ? String(t.marginMeta) : '');
                        }}
                      >
                        Editar
                      </button>
                      <button
                        className="text-xs text-hangar-red"
                        onClick={async () => {
                          if (!window.confirm('Excluir este tier?')) return;
                          await apiClient.deleteTier(t.id);
                          push({ type: 'success', message: 'Tier excluído' });
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
