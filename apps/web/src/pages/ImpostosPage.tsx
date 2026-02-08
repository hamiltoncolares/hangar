import { useEffect, useState } from 'react';
import { apiClient } from '../lib/api';
import { Button, Input, Panel, Select } from '../components/ui';
import { useToast } from '../components/Toast';
import { isDate } from '../lib/validators';

export function ImpostosPage() {
  const [projetos, setProjetos] = useState<Array<{ id: string; nome: string }>>([]);
  const [items, setItems] = useState<
    Array<{ id: string; projetoId: string; percentual: number; vigenciaInicio: string; vigenciaFim?: string }>
  >([]);
  const [projetoId, setProjetoId] = useState('');
  const [percentual, setPercentual] = useState('');
  const [inicio, setInicio] = useState('');
  const [fim, setFim] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [editProjeto, setEditProjeto] = useState('');
  const [editPercentual, setEditPercentual] = useState('');
  const [editInicio, setEditInicio] = useState('');
  const [editFim, setEditFim] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const { push } = useToast();

  const load = async () => {
    const [p, i] = await Promise.all([apiClient.listProjetos(), apiClient.listImpostos()]);
    setProjetos(p);
    setItems(i);
  };

  useEffect(() => {
    load().catch((e) => push({ type: 'error', message: e.message }));
  }, []);

  return (
    <div className="px-6 py-6">
      <Header title="Impostos" description="Histórico de impostos por projeto" />

      <div className="grid gap-6 xl:grid-cols-3 enter">
        <Panel>
          <h3 className="text-xs md:text-sm font-semibold">Novo Imposto</h3>
          <Select
            value={projetoId}
            onChange={(e) => setProjetoId(e.target.value)}
            className="mt-3"
          >
            <option value="">Selecione o Projeto</option>
            {projetos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </Select>
          <Input
            value={percentual}
            onChange={(e) => setPercentual(e.target.value)}
            placeholder="Percentual (ex: 12)"
            className="mt-3"
          />
          <Input
            value={inicio}
            onChange={(e) => setInicio(e.target.value)}
            placeholder="Início (YYYY-MM-DD)"
            className="mt-3"
          />
          <Input
            value={fim}
            onChange={(e) => setFim(e.target.value)}
            placeholder="Fim (YYYY-MM-DD)"
            className="mt-3"
          />
          {fieldError && <p className="mt-1 text-xs text-hangar-red">{fieldError}</p>}
          <Button
            onClick={async () => {
              if (!projetoId) {
                setFieldError('Projeto é obrigatório');
                return;
              }
              if (!percentual) {
                setFieldError('Percentual é obrigatório');
                return;
              }
              if (!inicio) {
                setFieldError('Início é obrigatório');
                return;
              }
              if (!isDate(inicio)) {
                setFieldError('Início deve ser YYYY-MM-DD');
                return;
              }
              if (fim && !isDate(fim)) {
                setFieldError('Fim deve ser YYYY-MM-DD');
                return;
              }
              setFieldError(null);
              try {
                await apiClient.createImposto({
                  projeto_id: projetoId,
                  percentual: parsePtNumber(percentual),
                  vigencia_inicio: inicio,
                  vigencia_fim: fim || undefined
                });
                setProjetoId('');
                setPercentual('');
                setInicio('');
                setFim('');
                push({ type: 'success', message: 'Imposto criado' });
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
            {items.map((i) => (
              <li key={i.id} className="flex items-center justify-between border-b border-hangar-slate/20 pb-2">
                {editId === i.id ? (
                  <div className="flex w-full items-center gap-2">
                    <Select value={editProjeto} onChange={(e) => setEditProjeto(e.target.value)}>
                      <option value="">Selecione o Projeto</option>
                      {projetos.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nome}
                        </option>
                      ))}
                    </Select>
                    <Input value={editPercentual} onChange={(e) => setEditPercentual(e.target.value)} />
                    <Input value={editInicio} onChange={(e) => setEditInicio(e.target.value)} />
                    <Input value={editFim} onChange={(e) => setEditFim(e.target.value)} />
                    <Button
                      onClick={async () => {
                        if (!editProjeto) return setEditError('Projeto é obrigatório');
                        if (!editPercentual) return setEditError('Percentual é obrigatório');
                        if (!editInicio) return setEditError('Início é obrigatório');
                        if (!isDate(editInicio)) return setEditError('Início deve ser YYYY-MM-DD');
                        if (editFim && !isDate(editFim)) return setEditError('Fim deve ser YYYY-MM-DD');
                        setEditError(null);
                        await apiClient.updateImposto(i.id, {
                          percentual: parsePtNumber(editPercentual),
                          vigencia_inicio: editInicio,
                          vigencia_fim: editFim || undefined
                        });
                        setEditId(null);
                        push({ type: 'success', message: 'Imposto atualizado' });
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
                    <span>{projetos.find((p) => p.id === i.projetoId)?.nome ?? '—'}</span>
                    <span className="text-xs text-hangar-muted">{i.percentual}%</span>
                    <div className="flex items-center gap-2">
                      <button
                        className="text-xs text-hangar-cyan"
                        onClick={() => {
                          setEditId(i.id);
                          setEditProjeto(i.projetoId);
                          setEditPercentual(String(i.percentual));
                          setEditInicio(i.vigenciaInicio?.slice(0, 10));
                          setEditFim(i.vigenciaFim?.slice(0, 10) ?? '');
                        }}
                      >
                        Editar
                      </button>
                      <button
                        className="text-xs text-hangar-red"
                        onClick={async () => {
                          if (!window.confirm('Excluir este imposto?')) return;
                          await apiClient.deleteImposto(i.id);
                          push({ type: 'success', message: 'Imposto excluído' });
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

function parsePtNumber(value: string) {
  const normalized = value.replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, '');
  const n = Number(normalized);
  return Number.isNaN(n) ? 0 : n;
}
