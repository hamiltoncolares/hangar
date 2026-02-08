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
  const [tierId, setTierId] = useState<string[]>([]);
  const [clienteId, setClienteId] = useState<string[]>([]);
  const [projetoId, setProjetoId] = useState<string[]>([]);
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
    () => (tierId.length ? clientes.filter((c) => tierId.includes(c.tierId)) : clientes),
    [tierId, clientes]
  );

  const filteredProjetos = useMemo(
    () => (clienteId.length ? projetos.filter((p) => clienteId.includes(p.clienteId)) : projetos),
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
              <FilterMultiSelect
                label="Tiers"
                placeholder="Todos os Tiers"
                options={tiers.map((t) => ({ id: t.id, label: t.nome }))}
                selected={tierId}
                onChange={(next) => {
                  setTierId(next);
                  setClienteId([]);
                  setProjetoId([]);
                }}
              />
              <FilterMultiSelect
                label="Clientes"
                placeholder="Todos os Clientes"
                options={filteredClientes.map((c) => ({ id: c.id, label: c.nome }))}
                selected={clienteId}
                onChange={(next) => {
                  setClienteId(next);
                  setProjetoId([]);
                }}
              />
              <FilterMultiSelect
                label="Projetos"
                placeholder="Todos os Projetos"
                options={filteredProjetos.map((p) => ({ id: p.id, label: p.nome }))}
                selected={projetoId}
                onChange={(next) => setProjetoId(next)}
              />
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
                  const params = tierId.length ? `?${tierId.map((id) => `tier_id=${id}`).join('&')}` : '';
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

function FilterMultiSelect({
  label,
  placeholder,
  options,
  selected,
  onChange
}: {
  label: string;
  placeholder: string;
  options: Array<{ id: string; label: string }>;
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const allSelected = options.length > 0 && selected.length === options.length;
  const visible = options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()));
  useEffect(() => {
    if (options.length > 0 && selected.length === 0) {
      onChange(options.map((o) => o.id));
    }
  }, [options, selected.length, onChange]);
  const summary =
    selected.length === 0
      ? placeholder
      : allSelected
      ? 'Todos'
      : selected.length === 1
      ? options.find((o) => o.id === selected[0])?.label || `${label} (1)`
      : `${label} (${selected.length})`;

  return (
    <div className="relative z-50">
      <button
        className="min-w-[180px] rounded-md border border-hangar-slate/40 bg-transparent px-3 py-2 text-xs text-hangar-text hover:bg-hangar-surface"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="text-[10px] text-hangar-muted">{label}</div>
        <div className="truncate">{summary}</div>
      </button>
      {open && (
        <div className="absolute z-[9999] mt-2 w-[260px] rounded-lg border border-hangar-slate/30 bg-hangar-panel p-3 shadow-2xl">
          <input
            className="w-full rounded-md border border-hangar-slate/40 bg-transparent px-2 py-1 text-xs text-hangar-text placeholder:text-hangar-muted focus:outline-none focus:ring-2 focus:ring-hangar-cyan/40"
            placeholder={`Buscar ${label.toLowerCase()}`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="mt-2 max-h-48 overflow-auto space-y-1 text-xs">
            <label className="flex items-center gap-2 rounded px-2 py-1 hover:bg-hangar-surface/60">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={() => {
                  onChange(allSelected ? [] : options.map((o) => o.id));
                }}
              />
              <span>Todos</span>
            </label>
            {visible.map((o) => (
              <label key={o.id} className="flex items-center gap-2 rounded px-2 py-1 hover:bg-hangar-surface/60">
                <input
                  type="checkbox"
                  checked={selected.includes(o.id)}
                  onChange={() => {
                    const next = selected.includes(o.id)
                      ? selected.filter((id) => id !== o.id)
                      : [...selected, o.id];
                    onChange(next);
                  }}
                />
                <span>{o.label}</span>
              </label>
            ))}
            {visible.length === 0 && <div className="text-hangar-muted">Nenhum resultado</div>}
          </div>
          <div className="mt-3 flex items-center justify-between text-xs">
            <button className="text-hangar-muted" onClick={() => onChange([])}>
              Limpar
            </button>
            <button className="text-hangar-cyan" onClick={() => setOpen(false)}>
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
