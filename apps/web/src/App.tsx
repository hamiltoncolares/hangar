import { useEffect, useMemo, useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { applyTheme, getInitialTheme, listenThemeSync, Theme } from './lib/theme';
import { DashboardPage } from './pages/DashboardPage';
import { TiersPage } from './pages/TiersPage';
import { ClientesPage } from './pages/ClientesPage';
import { ProjetosPage } from './pages/ProjetosPage';
import { ImpostosPage } from './pages/ImpostosPage';
import { RegistrosPage } from './pages/RegistrosPage';
import { AdminPage } from './pages/AdminPage';
import { AuthPage } from './pages/AuthPage';
import { apiClient, getAuthToken, setAuthToken } from './lib/api';

export default function App() {
  const [theme, setTheme] = useState<Theme>('light');
  const [active, setActive] = useState('dashboard');
  const [year, setYear] = useState(new Date().getFullYear());
  const [tiers, setTiers] = useState<Array<{ id: string; nome: string }>>([]);
  const [clientes, setClientes] = useState<Array<{ id: string; nome: string; tierId: string }>>([]);
  const [projetos, setProjetos] = useState<Array<{ id: string; nome: string; clienteId: string }>>([]);
  const [tierId, setTierId] = useState('');
  const [clienteId, setClienteId] = useState('');
  const [projetoId, setProjetoId] = useState('');
  const [dashboardStatus, setDashboardStatus] = useState<'planejado' | 'realizado' | 'pipeline' | ''>('pipeline');
  const [dashboardView, setDashboardView] = useState<'mensal' | 'trimestral'>('mensal');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<{ id: string; email: string; role: string; status: string; name?: string | null } | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const t = getInitialTheme();
    setTheme(t);
    applyTheme(t);
    return listenThemeSync((next) => {
      setTheme(next);
      applyTheme(next);
    });
  }, []);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      setAuthChecked(true);
      return;
    }
    apiClient
      .me()
      .then((res) => setUser(res.user))
      .catch(() => {
        setAuthToken('');
        setUser(null);
      })
      .finally(() => setAuthChecked(true));
  }, []);

  useEffect(() => {
    if (!user) return;
    apiClient.listTiers().then(setTiers).catch(() => {});
    apiClient.listClientes().then(setClientes).catch(() => {});
    apiClient.listProjetos().then(setProjetos).catch(() => {});
  }, [user]);

  const filteredClientes = useMemo(
    () => (tierId ? clientes.filter((c) => c.tierId === tierId) : clientes),
    [tierId, clientes]
  );

  const filteredProjetos = useMemo(
    () => (clienteId ? projetos.filter((p) => p.clienteId === clienteId) : projetos),
    [clienteId, projetos]
  );

  if (!authChecked) {
    return <div className="min-h-screen bg-hangar-bg text-hangar-text flex items-center justify-center">Carregando...</div>;
  }

  if (!user) {
    return <AuthPage onAuth={(u) => setUser(u)} />;
  }

  return (
    <div className="flex min-h-screen bg-hangar-bg text-hangar-text">
      <Sidebar active={active} onSelect={setActive} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-1 flex-col">
        <Topbar
          theme={theme}
          title={activeTitle(active)}
          subtitle={activeSubtitle(active)}
          onMenu={() => setSidebarOpen(true)}
          onToggleTheme={() => {
            const next = theme === 'dark' ? 'light' : 'dark';
            setTheme(next);
            applyTheme(next);
          }}
        >
          {user?.role === 'admin' && (
            <button
              className="rounded-md border border-hangar-slate/40 px-3 py-2 text-xs text-hangar-muted transition hover:bg-hangar-surface"
              onClick={() => setActive('admin')}
            >
              Admin
            </button>
          )}
          <div className="text-[10px] md:text-xs text-hangar-muted">
            {user.name || user.email}
          </div>
          <button
            className="rounded-md border border-hangar-slate/40 px-3 py-2 text-[10px] md:text-xs text-hangar-muted transition hover:bg-hangar-surface"
            onClick={() => {
              setAuthToken('');
              setUser(null);
            }}
          >
            Sair
          </button>
          {active === 'dashboard' && (
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <select
                value={String(year)}
                onChange={(e) => setYear(Number(e.target.value))}
                className="rounded-md border border-hangar-slate/40 bg-transparent px-2 py-2 text-xs hud-select"
              >
                {[year - 1, year, year + 1].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            <select
              value={tierId}
              onChange={(e) => {
                setTierId(e.target.value);
                setClienteId('');
                setProjetoId('');
              }}
              className="rounded-md border border-hangar-slate/40 bg-transparent px-2 py-2 text-xs hud-select"
            >
                <option value="">Todos os Tiers</option>
                {tiers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nome}
                  </option>
                ))}
              </select>
            <select
              value={clienteId}
              onChange={(e) => {
                setClienteId(e.target.value);
                setProjetoId('');
              }}
              className="rounded-md border border-hangar-slate/40 bg-transparent px-2 py-2 text-xs hud-select"
            >
                <option value="">Todos os Clientes</option>
                {filteredClientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
              <select
                value={projetoId}
                onChange={(e) => setProjetoId(e.target.value)}
                className="rounded-md border border-hangar-slate/40 bg-transparent px-2 py-2 text-xs hud-select"
              >
                <option value="">Todos os Projetos</option>
                {filteredProjetos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome}
                  </option>
                ))}
              </select>
              <select
                value={dashboardStatus}
                onChange={(e) => setDashboardStatus(e.target.value as any)}
                className="rounded-md border border-hangar-slate/40 bg-transparent px-2 py-2 text-xs hud-select"
              >
                <option value="pipeline">Pipeline</option>
                <option value="planejado">Planejado</option>
                <option value="realizado">Realizado</option>
              </select>
              <select
                value={dashboardView}
                onChange={(e) => setDashboardView(e.target.value as any)}
                className="rounded-md border border-hangar-slate/40 bg-transparent px-2 py-2 text-xs hud-select"
              >
                <option value="mensal">Mensal</option>
                <option value="trimestral">Trimestral</option>
              </select>
              <button
                className="rounded-md border border-hangar-slate/40 px-3 py-2 text-xs text-hangar-muted transition hover:bg-hangar-surface"
                onClick={async () => {
                  const params = tierId ? `?tier_id=${tierId}` : '';
                  const res = await fetch(`/api/export/excel${params}`, {
                    headers: getAuthToken() ? { Authorization: `Bearer ${getAuthToken()}` } : undefined
                  });
                  const blob = await res.blob();
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'hangar-export.xlsx';
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >
                Exportar Excel
              </button>
            </div>
          )}
        </Topbar>

        <main className="flex-1 bg-hangar-surface hud-surface">
          <div className="pointer-events-none fixed inset-y-0 right-0 hidden w-[70%] hud-grid xl:block" />
          {active === 'dashboard' && (
            <DashboardPage tierId={tierId} clienteId={clienteId} projetoId={projetoId} ano={year} status={dashboardStatus} view={dashboardView} />
          )}
          {active === 'tiers' && <TiersPage />}
          {active === 'clientes' && <ClientesPage />}
          {active === 'projetos' && <ProjetosPage />}
          {active === 'impostos' && <ImpostosPage />}
          {active === 'registros' && <RegistrosPage />}
          {active === 'admin' && user?.role === 'admin' && <AdminPage />}
        </main>
      </div>
    </div>
  );
}

function activeTitle(active: string) {
  switch (active) {
    case 'admin':
      return 'Admin';
    case 'tiers':
      return 'Tiers';
    case 'clientes':
      return 'Clientes';
    case 'projetos':
      return 'Projetos';
    case 'impostos':
      return 'Impostos';
    case 'registros':
      return 'Registros Mensais';
    default:
      return 'Dashboard';
  }
}

function activeSubtitle(active: string) {
  switch (active) {
    case 'admin':
      return 'Gestão de usuários e acessos';
    case 'tiers':
      return 'Organização por nível';
    case 'clientes':
      return 'Cadastro por Tier';
    case 'projetos':
      return 'Cadastro por Cliente';
    case 'impostos':
      return 'Histórico por projeto';
    case 'registros':
      return 'Entrada mensal de dados';
    default:
      return 'Visão anual e filtros';
  }
}
