import { useEffect, useState } from 'react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { apiClient, DashboardResponse } from '../lib/api';

export function DashboardPage({
  tierId,
  clienteId,
  projetoId,
  ano
}: {
  tierId?: string;
  clienteId?: string;
  projetoId?: string;
  ano: number;
}) {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    apiClient
      .getDashboard({ tierId, clienteId, projetoId, ano })
      .then((res) => {
        if (!mounted) return;
        setData(res);
        setError(null);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err.message || 'Erro ao carregar');
      });
    return () => {
      mounted = false;
    };
  }, [tierId, clienteId, projetoId, ano]);

  const totals = data?.totais;
  const series = data?.series_mensal ?? [];

  return (
    <div className="px-6 py-6">
      {error && (
        <div className="mb-4 rounded-md border border-hangar-red/40 bg-hangar-red/10 px-4 py-3 text-sm text-hangar-red">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5 enter">
        <StatCard label="Receita Bruta" value={totals?.receita_bruta} accent="cyan" glow />
        <StatCard label="Receita Líquida" value={totals?.receita_liquida} accent="purple" glow />
        <StatCard label="Custo" value={totals?.custo} accent="orange" />
        <StatCard
          label="Margem Bruta"
          value={totals?.margem_bruta}
          sub={percent(totals?.margem_bruta_pct)}
          accent="green"
        />
        <StatCard
          label="Margem Líquida"
          value={totals?.margem_liquida}
          sub={percent(totals?.margem_liquida_pct)}
          accent="green"
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3 enter-delay">
        <div className="xl:col-span-2 rounded-lg p-5 hud-panel relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 opacity-60">
            <div className="absolute inset-0 hud-grid" />
            <div className="absolute inset-0 bg-gradient-to-b from-hangar-accent/20 via-transparent to-transparent" />
          </div>
          <div className="mb-4 flex items-center justify-between hud-divider">
            <div>
              <div className="text-lg font-semibold">Evolução Mensal</div>
              <div className="text-xs text-hangar-muted">Receita e custo por mês</div>
            </div>
            <div className="text-xs text-hangar-muted">Ano {ano}</div>
          </div>
          <div className="mb-3 flex items-center gap-4 text-xs text-hangar-muted">
            <span className="inline-flex items-center gap-2">
              <span className="h-2 w-6 rounded-full bg-hangar-purple"></span> Receita Líquida
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-2 w-6 rounded-full bg-hangar-orange"></span> Custo
            </span>
          </div>
          <div className="relative h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="liquida" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7C4DFF" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#7C4DFF" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="custo" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF9100" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#FF9100" stopOpacity={0} />
                  </linearGradient>
                  <filter id="glowOrange" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                  <filter id="glowPurple" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                <XAxis dataKey="mes" tick={{ fill: 'var(--hangar-muted)', fontSize: 10 }} />
                <YAxis tick={{ fill: 'var(--hangar-muted)', fontSize: 10 }} />
                <Tooltip content={<HudTooltip />} />
                <Area
                  type="monotone"
                  dataKey="receita_liquida"
                  stroke="#7C4DFF"
                  fill="url(#liquida)"
                  strokeWidth={2.5}
                  filter="url(#glowPurple)"
                />
                <Area
                  type="monotone"
                  dataKey="custo"
                  stroke="#FF9100"
                  fill="url(#custo)"
                  strokeWidth={2.5}
                  filter="url(#glowOrange)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-lg p-5 hud-panel">
          <div className="text-lg font-semibold hud-divider">Resumo do Ano</div>
          <div className="mt-4 space-y-3 text-sm">
            <SummaryRow label="Receita Bruta" value={totals?.receita_bruta} />
            <SummaryRow label="Receita Líquida" value={totals?.receita_liquida} />
            <SummaryRow label="Custo" value={totals?.custo} />
            <SummaryRow label="Margem Bruta" value={totals?.margem_bruta} sub={percent(totals?.margem_bruta_pct)} />
            <SummaryRow label="Margem Líquida" value={totals?.margem_liquida} sub={percent(totals?.margem_liquida_pct)} />
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-lg p-5 hud-panel enter">
        <div className="mb-3 text-lg font-semibold hud-divider">Tabela Mensal</div>
        <div className="overflow-x-auto text-sm">
          <table className="w-full">
            <thead className="text-left text-xs text-hangar-muted">
              <tr>
                <th className="py-2">Mês</th>
                <th className="py-2">Receita Bruta</th>
                <th className="py-2">Receita Líquida</th>
                <th className="py-2">Custo</th>
                <th className="py-2">Margem Bruta</th>
                <th className="py-2">Margem Líquida</th>
              </tr>
            </thead>
            <tbody>
              {series.map((s) => (
                <tr key={s.mes} className="border-t border-hangar-slate/20 odd:bg-hangar-surface/40 hover:bg-hangar-surface/70 transition">
                  <td className="py-2 text-hangar-muted">{s.mes}</td>
                  <td className="py-2">{currency(s.receita_bruta)}</td>
                  <td className="py-2">{currency(s.receita_liquida)}</td>
                  <td className="py-2">{currency(s.custo)}</td>
                  <td className="py-2">{currency(s.margem_bruta)} ({percent(s.margem_bruta_pct)})</td>
                  <td className="py-2">{currency(s.margem_liquida)} ({percent(s.margem_liquida_pct)})</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function currency(value?: number) {
  if (value === undefined) return '--';
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function percent(value?: number) {
  if (value === undefined) return '--';
  return `${(value * 100).toFixed(1)}%`;
}

function HudTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const data = payload[0]?.payload;
  return (
    <div className="rounded-md border border-hangar-slate/40 bg-hangar-panel/90 px-3 py-2 text-xs text-hangar-text hud-glow">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="text-hangar-muted">Mês</div>
        <div>{label}</div>
      </div>
      <div className="flex items-center justify-between gap-3">
        <Badge color="purple">Líquida</Badge>
        <div>{currency(data.receita_liquida)}</div>
      </div>
      <div className="mt-1 flex items-center justify-between gap-3">
        <Badge color="orange">Custo</Badge>
        <div>{currency(data.custo)}</div>
      </div>
      <div className="mt-2 text-hangar-muted">
        Margem Líquida: {currency(data.margem_liquida)} ({percent(data.margem_liquida_pct)})
      </div>
    </div>
  );
}

function Badge({ color, children }: { color: 'cyan' | 'purple' | 'orange'; children: string }) {
  const c =
    color === 'cyan'
      ? 'bg-hangar-cyan/15 text-hangar-cyan'
      : color === 'purple'
      ? 'bg-hangar-purple/15 text-hangar-purple'
      : 'bg-hangar-orange/15 text-hangar-orange';
  return <span className={`rounded-full px-2 py-0.5 text-[10px] ${c}`}>{children}</span>;
}

function StatCard({
  label,
  value,
  sub,
  accent,
  glow
}: {
  label: string;
  value?: number;
  sub?: string;
  accent: 'cyan' | 'purple' | 'green' | 'orange';
  glow?: boolean;
}) {
  const accentClass = {
    cyan: 'text-hangar-cyan',
    purple: 'text-hangar-purple',
    green: 'text-hangar-green',
    orange: 'text-hangar-orange'
  }[accent];

  return (
    <div className={`rounded-lg p-4 hud-panel ${glow ? (accent === 'purple' ? 'hud-glow-purple' : 'hud-glow') : ''}`}>
      <div className="text-xs text-hangar-muted">{label}</div>
      <div className={`mt-2 text-lg font-semibold ${accentClass}`}>{currency(value)}</div>
      {sub && <div className="text-xs text-hangar-muted">{sub}</div>}
    </div>
  );
}

function SummaryRow({ label, value, sub }: { label: string; value?: number; sub?: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="text-hangar-muted">{label}</div>
      <div className="text-right">
        <div>{currency(value)}</div>
        {sub && <div className="text-xs text-hangar-muted">{sub}</div>}
      </div>
    </div>
  );
}
