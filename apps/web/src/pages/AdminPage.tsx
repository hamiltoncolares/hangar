import { useEffect, useState } from 'react';
import { apiClient } from '../lib/api';
import { Button, Panel, Select } from '../components/ui';
import { useToast } from '../components/Toast';

type Tier = { id: string; nome: string };
type UserRow = {
  id: string;
  email: string;
  name?: string | null;
  role: string;
  status: string;
  createdAt: string;
  tiers: Tier[];
};

export function AdminPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const [editTierIds, setEditTierIds] = useState<string[]>([]);
  const { push } = useToast();

  const load = async () => {
    const [u, t] = await Promise.all([apiClient.listUsers(), apiClient.listTiers()]);
    setUsers(u);
    setTiers(t);
  };

  useEffect(() => {
    load().catch((e) => push({ type: 'error', message: e.message }));
  }, []);

  return (
    <div className="px-6 py-6">
      <Header title="Admin" description="Aprovar usuários e gerenciar acessos" />
      <Panel>
        <div className="mb-3 flex items-center justify-between">
          <div className="text-xs text-hangar-muted">Logs de auditoria</div>
          <Button
            onClick={async () => {
              const csv = await apiClient.exportAuditLogs();
              const blob = new Blob([csv as unknown as string], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'audit-logs.csv';
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            Exportar logs
          </Button>
        </div>
        <div className="overflow-x-auto text-xs md:text-sm">
          <table className="w-full">
            <thead className="text-left text-xs text-hangar-muted">
              <tr>
                <th className="py-2">Usuário</th>
                <th className="py-2">Status</th>
                <th className="py-2">Role</th>
                <th className="py-2">Tiers</th>
                <th className="py-2">Ações</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t border-hangar-slate/20">
                  <td className="py-2">
                    <div>{u.name || u.email}</div>
                    <div className="text-[10px] text-hangar-muted">{u.email}</div>
                  </td>
                  <td className="py-2 text-hangar-muted">{u.status}</td>
                  <td className="py-2 text-hangar-muted">{u.role}</td>
                  <td className="py-2 text-hangar-muted">
                    {u.tiers.length ? u.tiers.map((t) => t.nome).join(', ') : '—'}
                  </td>
                  <td className="py-2">
                    {editId === u.id ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <Select
                          multiple
                          value={editTierIds}
                          onChange={(e) =>
                            setEditTierIds(Array.from(e.target.selectedOptions).map((o) => o.value))
                          }
                          className="min-w-[180px]"
                        >
                          {tiers.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.nome}
                            </option>
                          ))}
                        </Select>
                        <Button
                          onClick={async () => {
                            await apiClient.setUserTiers(u.id, editTierIds);
                            setEditId(null);
                            push({ type: 'success', message: 'Tiers atualizados' });
                            load();
                          }}
                        >
                          Salvar
                        </Button>
                        <button className="text-xs text-hangar-muted" onClick={() => setEditId(null)}>
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center gap-2">
                        {u.status === 'pending' && (
                          <Button
                            onClick={async () => {
                              await apiClient.approveUser(u.id);
                              push({ type: 'success', message: 'Usuário aprovado' });
                              load();
                            }}
                          >
                            Aprovar
                          </Button>
                        )}
                        {u.role !== 'admin' && (
                          <Button
                            onClick={async () => {
                              await apiClient.promoteUser(u.id);
                              push({ type: 'success', message: 'Usuário promovido a admin' });
                              load();
                            }}
                          >
                            Tornar admin
                          </Button>
                        )}
                        <button
                          className="text-xs text-hangar-cyan"
                          onClick={() => {
                            setEditId(u.id);
                            setEditTierIds(u.tiers.map((t) => t.id));
                          }}
                        >
                          Editar tiers
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
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
