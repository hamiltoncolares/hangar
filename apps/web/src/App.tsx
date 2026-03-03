import { useEffect, useMemo, useRef, useState } from 'react';
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
import { MetasPage } from './pages/MetasPage';
import { apiClient, getAuthToken, setAuthToken } from './lib/api';

type DashboardStatus = 'planejado' | 'realizado' | 'pipeline' | '';
type DashboardView = 'mensal' | 'trimestral';

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
  const [dashboardStatus, setDashboardStatus] = useState<DashboardStatus>('pipeline');
  const [dashboardView, setDashboardView] = useState<DashboardView>('mensal');
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
          rightActions={
            <>
              {user?.role === 'admin' && (
                <button
                  className="inline-flex items-center gap-2 rounded-xl border border-hangar-slate/25 px-3 py-2 text-xs text-hangar-muted transition hover:bg-hangar-surface"
                  onClick={() => setActive('admin')}
                >
                  <AdminIcon />
                  Admin
                </button>
              )}
              <div className="inline-flex items-center gap-2 rounded-xl border border-hangar-slate/30 px-3 py-2 text-[10px] md:text-xs text-hangar-muted">
                <UserIcon />
                {user.name || user.email}
              </div>
              <button
                className="inline-flex items-center gap-2 rounded-xl border border-hangar-slate/25 px-3 py-2 text-[10px] md:text-xs text-hangar-muted transition hover:bg-hangar-surface"
                onClick={() => {
                  setAuthToken('');
                  setUser(null);
                }}
              >
                <SignOutIcon />
                Sair
              </button>
            </>
          }
        >
          {(active === 'dashboard' || active === 'metas') && (
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <select
                value={String(year)}
                onChange={(e) => setYear(Number(e.target.value))}
                className="rounded-xl border border-hangar-slate/20 hud-glass-surface px-2 py-2 text-xs hud-select"
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
                onChange={(e) => setDashboardStatus(e.target.value as DashboardStatus)}
                className="rounded-xl border border-hangar-slate/20 hud-glass-surface px-2 py-2 text-xs hud-select"
              >
                <option value="pipeline">Pipeline</option>
                <option value="planejado">Planejado</option>
                <option value="realizado">Realizado</option>
              </select>
              <select
                value={dashboardView}
                onChange={(e) => setDashboardView(e.target.value as DashboardView)}
                className="rounded-xl border border-hangar-slate/20 hud-glass-surface px-2 py-2 text-xs hud-select"
              >
                <option value="mensal">Mensal</option>
                <option value="trimestral">Trimestral</option>
              </select>
              <button
                className="inline-flex items-center gap-2 rounded-xl border border-hangar-slate/25 px-3 py-2 text-xs text-hangar-muted transition hover:bg-hangar-surface"
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
                <DownloadIcon />
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
          {active === 'metas' && (
            <MetasPage tierId={tierId} clienteId={clienteId} projetoId={projetoId} ano={year} status={dashboardStatus} />
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
    case 'metas':
      return 'Metas';
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
    case 'metas':
      return 'Acompanhamento de metas';
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
  const ref = useRef<HTMLDivElement>(null);
  const allSelected = options.length > 0 && selected.length === options.length;
  const visible = options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()));
  useEffect(() => {
    if (options.length > 0 && selected.length === 0) {
      onChange(options.map((o) => o.id));
    }
  }, [options, selected.length, onChange]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const summary =
    selected.length === 0
      ? placeholder
      : allSelected
      ? 'Todos'
      : selected.length === 1
      ? options.find((o) => o.id === selected[0])?.label || `${label} (1)`
      : `${label} (${selected.length})`;

  return (
    <div className="relative z-50" ref={ref}>
      <button
        className="min-w-[180px] rounded-xl border border-hangar-slate/20 hud-glass-surface px-3 py-2 text-xs text-hangar-text shadow-sm transition hover:bg-hangar-surface"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 text-left">
            <div className="text-[10px] text-hangar-muted">{label}</div>
            <div className="truncate">{summary}</div>
          </div>
          <ChevronDownIcon />
        </div>
      </button>
      {open && (
        <div className="absolute z-[9999] mt-2 w-[300px] overflow-hidden rounded-2xl border border-hangar-slate/15 shadow-2xl isolate hud-glass-popover">
          <div className="pointer-events-none absolute inset-0" />
          <div className="relative z-10 p-3">
            <input
              className="w-full rounded-xl border border-hangar-slate/20 hud-glass-input px-3 py-2 text-xs text-hangar-text placeholder:text-hangar-muted focus:outline-none focus:ring-2 focus:ring-hangar-cyan/35"
              placeholder={`Buscar ${label.toLowerCase()}`}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <div className="mt-2 max-h-56 overflow-auto space-y-1 rounded-xl border border-hangar-slate/15 hud-glass-input p-1 text-xs pr-1">
              <label className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-hangar-surface/60">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={() => {
                    onChange(allSelected ? [] : options.map((o) => o.id));
                  }}
                />
                <span className="font-medium">Todos</span>
              </label>
              {visible.map((o) => (
                <label key={o.id} className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-hangar-surface/60">
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
              <button className="text-hangar-muted hover:text-hangar-text" onClick={() => onChange([])}>
                Limpar
              </button>
              <span className="text-hangar-muted">{selected.length}/{options.length} selecionados</span>
              <button className="text-hangar-cyan hover:brightness-110" onClick={() => setOpen(false)}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AdminIcon() {
  return (
    <svg viewBox="0 0 640 512" className="h-3.5 w-3.5" aria-hidden="true">
      <path fill="currentColor" d="M224 256A128 128 0 1 0 224 0a128 128 0 1 0 0 256zM96 288c-53 0-96 43-96 96v32c0 17.7 14.3 32 32 32h320c17.7 0 32-14.3 32-32V384c0-53-43-96-96-96H96zm398.4-89.6l22.6-45.2c5.4-10.8 0-24-10.8-29.3s-24 0-29.3 10.8l-22.6 45.2c-9.7-3.1-20-4.8-30.7-4.8-57.4 0-104 46.6-104 104s46.6 104 104 104 104-46.6 104-104c0-31.8-14.2-60.2-36.6-79z" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 448 512" className="h-3.5 w-3.5" aria-hidden="true">
      <path fill="currentColor" d="M224 256A128 128 0 1 0 224 0a128 128 0 1 0 0 256zM313.6 288h-8.2c-22.2 10.2-46.9 16-73.4 16s-51.2-5.8-73.4-16h-8.2C67.2 288 0 355.2 0 438.4 0 479 33 512 73.6 512h300.8c40.6 0 73.6-33 73.6-73.6C448 355.2 380.8 288 313.6 288z" />
    </svg>
  );
}

function SignOutIcon() {
  return (
    <svg viewBox="0 0 512 512" className="h-3.5 w-3.5" aria-hidden="true">
      <path fill="currentColor" d="M502.6 278.6c12.5-12.5 12.5-32.8 0-45.3l-96-96c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L402.7 224H192c-17.7 0-32 14.3-32 32s14.3 32 32 32H402.7l-41.4 41.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0l96-96zM160 96c17.7 0 32-14.3 32-32S177.7 32 160 32H96C43 32 0 75 0 128V384c0 53 43 96 96 96h64c17.7 0 32-14.3 32-32s-14.3-32-32-32H96c-17.7 0-32-14.3-32-32V128c0-17.7 14.3-32 32-32h64z" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg viewBox="0 0 512 512" className="h-3.5 w-3.5" aria-hidden="true">
      <path fill="currentColor" d="M256 0c17.7 0 32 14.3 32 32V274.7l73.4-73.4c12.5-12.5 32.8-12.5 45.3 0s12.5 32.8 0 45.3l-128 128c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L224 274.7V32c0-17.7 14.3-32 32-32zM64 352c35.3 0 64 28.7 64 64v32H384V416c0-35.3 28.7-64 64-64s64 28.7 64 64v32c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V416c0-35.3 28.7-64 64-64z" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg viewBox="0 0 320 512" className="h-3 w-3 text-hangar-cyan/80" aria-hidden="true">
      <path fill="currentColor" d="M182.6 406.6c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7l105.4-105.4c12.5-12.5 32.8-12.5 45.3 0s12.5 32.8 0 45.3l-128 128z" />
    </svg>
  );
}
