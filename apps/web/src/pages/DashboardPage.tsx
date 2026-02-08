import { useEffect, useState } from 'react';
import { Area, Bar, ComposedChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { apiClient, DashboardResponse } from '../lib/api';

export function DashboardPage({
  tierId,
  clienteId,
  projetoId,
  ano,
  status,
  view
}: {
  tierId?: string;
  clienteId?: string;
  projetoId?: string;
  ano: number;
  status?: string;
  view?: 'mensal' | 'trimestral';
}) {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [highVis, setHighVis] = useState(false);
  const [chartMode, setChartMode] = useState<'evolucao' | 'planreal'>('evolucao');
  const [chartAccum, setChartAccum] = useState(false);

  useEffect(() => {
    let mounted = true;
    apiClient
      .getDashboard({ tierId, clienteId, projetoId, ano, status })
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
  }, [tierId, clienteId, projetoId, ano, status]);

  const totals = data?.totais;
  const series = data?.series_mensal ?? [];
  const isQuarterly = view === 'trimestral';
  const displaySeries = isQuarterly ? aggregateQuarterly(series) : series;
  const planRealSeries = data?.planned_vs_realizado ?? [];
  const displayPlanReal = decoratePlanReal(isQuarterly ? aggregateQuarterlyPlanReal(planRealSeries) : planRealSeries);
  const chartSeries = chartAccum ? accumulateSeries(displaySeries) : displaySeries;
  const chartPlanReal = chartAccum ? accumulatePlanReal(displayPlanReal) : displayPlanReal;

  const clienteShare = data?.cliente_share ?? [];
  const clienteShareColored = clienteShare.map((c, idx) => ({
    ...c,
    fill: shareColors[idx % shareColors.length]
  }));

  return (
    <div className="px-6 py-6">
      {error && (
        <div className="mb-4 rounded-md border border-hangar-red/40 bg-hangar-red/10 px-4 py-3 text-sm text-hangar-red">
          {error}
        </div>
      )}

      <div className="grid gap-4 grid-cols-2 md:grid-cols-2 xl:grid-cols-5 enter">
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

      <div className="mt-6 grid gap-6 grid-cols-1 xl:grid-cols-2 enter-delay">
        <div className="rounded-lg p-4 md:p-5 hud-panel relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 opacity-60">
            <div className="absolute inset-0 hud-grid" />
            <div className="absolute inset-0 bg-gradient-to-b from-hangar-accent/20 via-transparent to-transparent" />
          </div>
          <div className="mb-4 flex items-center justify-between hud-divider">
            <div>
              <div className="text-base md:text-lg font-semibold">{isQuarterly ? 'Evolução Trimestral' : 'Evolução Mensal'}</div>
              <div className="text-[10px] md:text-xs text-hangar-muted">
                {isQuarterly ? 'Receita e custo por trimestre' : 'Receita e custo por mês'}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-[10px] md:text-xs text-hangar-muted">Ano {ano}</div>
              <button
                onClick={() => setChartAccum((v) => !v)}
                className={`rounded-md border px-2 py-1 text-[10px] md:text-xs transition ${
                  chartAccum
                    ? 'border-hangar-orange/60 text-hangar-orange bg-hangar-orange/10'
                    : 'border-hangar-slate/40 text-hangar-muted hover:bg-hangar-surface'
                }`}
              >
                {chartAccum ? 'Mensal' : 'Acumulado'}
              </button>
            </div>
          </div>
          <div className="mb-3 flex flex-wrap items-center gap-3 text-[10px] md:text-xs text-hangar-muted">
            <span className="inline-flex items-center gap-2">
              <span className="h-2 w-6 rounded-full bg-hangar-purple"></span> Receita Líquida
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-2 w-6 rounded-full bg-hangar-orange"></span> Custo
            </span>
          </div>
          <div className="relative h-60 md:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartSeries} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
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
                <Tooltip content={<HudTooltip labelTitle={isQuarterly ? 'Trimestre' : 'Mês'} />} />
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
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-lg p-4 md:p-5 hud-panel relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 opacity-60">
            <div className="absolute inset-0 hud-grid" />
            <div className="absolute inset-0 bg-gradient-to-b from-hangar-accent/20 via-transparent to-transparent" />
          </div>
          <div className="mb-4 flex items-center justify-between hud-divider">
            <div>
              <div className="text-base md:text-lg font-semibold">
                {isQuarterly ? 'Planejado vs Realizado (Trimestral)' : 'Planejado vs Realizado (Mensal)'}
              </div>
              <div className="text-[10px] md:text-xs text-hangar-muted">Comparativo de receita líquida</div>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-[10px] md:text-xs text-hangar-muted">Ano {ano}</div>
              <button
                onClick={() => setChartAccum((v) => !v)}
                className={`rounded-md border px-2 py-1 text-[10px] md:text-xs transition ${
                  chartAccum
                    ? 'border-hangar-orange/60 text-hangar-orange bg-hangar-orange/10'
                    : 'border-hangar-slate/40 text-hangar-muted hover:bg-hangar-surface'
                }`}
              >
                {chartAccum ? 'Mensal' : 'Acumulado'}
              </button>
            </div>
          </div>
          <div className="mb-3 flex flex-wrap items-center gap-3 text-[10px] md:text-xs text-hangar-muted">
            <span className="inline-flex items-center gap-2">
              <span className="h-2 w-6 rounded-full bg-hangar-purple"></span> Planejado
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-2 w-6 rounded-full bg-hangar-green"></span> Realizado
            </span>
          </div>
          <div className="relative h-60 md:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartPlanReal} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="plan" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7C4DFF" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#7C4DFF" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="real" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00E676" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00E676" stopOpacity={0} />
                  </linearGradient>
                  <filter id="glowGreen" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                  <filter id="glowCyan" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                <XAxis dataKey="mes" tick={{ fill: 'var(--hangar-muted)', fontSize: 10 }} />
                <YAxis tick={{ fill: 'var(--hangar-muted)', fontSize: 10 }} />
                <Tooltip content={<PlanRealTooltip labelTitle={isQuarterly ? 'Trimestre' : 'Mês'} />} />
                <Bar
                  dataKey="margem_planejada"
                  fill="rgba(124,77,255,0.35)"
                  stroke="#7C4DFF"
                  strokeWidth={1.2}
                  radius={[6, 6, 0, 0]}
                  barSize={10}
                  filter="url(#glowPurple)"
                />
                <Bar
                  dataKey="margem_realizada"
                  fill="rgba(0,230,118,0.35)"
                  stroke="#00E676"
                  strokeWidth={1.2}
                  radius={[6, 6, 0, 0]}
                  barSize={10}
                  filter="url(#glowGreen)"
                />
                <Area
                  type="monotone"
                  dataKey="planejado"
                  stroke="#7C4DFF"
                  fill="url(#plan)"
                  strokeWidth={2.5}
                />
                <Area
                  type="monotone"
                  dataKey="realizado"
                  stroke="#00E676"
                  fill="url(#real)"
                  strokeWidth={2.5}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 grid-cols-1 xl:grid-cols-2 enter-delay">
        <div className="rounded-lg p-4 md:p-5 hud-panel">
          <div className="text-base md:text-lg font-semibold hud-divider">Resumo do Ano</div>
          <div className="mt-4 space-y-3 text-xs md:text-sm">
            <SummaryRow label="Receita Bruta" value={totals?.receita_bruta} />
            <SummaryRow label="Receita Líquida" value={totals?.receita_liquida} />
            <SummaryRow label="Custo" value={totals?.custo} />
            <SummaryRow label="Margem Bruta" value={totals?.margem_bruta} sub={percent(totals?.margem_bruta_pct)} />
            <SummaryRow label="Margem Líquida" value={totals?.margem_liquida} sub={percent(totals?.margem_liquida_pct)} />
          </div>
        </div>

        <div className="rounded-lg p-4 md:p-5 hud-panel">
          <div className="text-base md:text-lg font-semibold hud-divider">Participação por Cliente</div>
          <div className="mt-3 text-[10px] md:text-xs text-hangar-muted">
            {tierId ? 'Dentro do Tier selecionado' : 'Todos os Tiers'}
          </div>
          <div className="mt-3 h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={clienteShareColored}
                  dataKey="receita_bruta"
                  nameKey="nome"
                  innerRadius={50}
                  outerRadius={78}
                  paddingAngle={2}
                  stroke="none"
                />
                <Tooltip content={<ClienteShareTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 space-y-1 text-[10px] md:text-xs">
            {clienteShare.slice(0, 5).map((c, idx) => (
              <div key={c.id} className="flex items-center justify-between text-hangar-muted">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ background: shareColors[idx % shareColors.length] }} />
                  {c.nome}
                </span>
                <span>{currency(c.receita_bruta)} · {percent(c.pct)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-lg p-4 md:p-5 hud-panel enter">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="text-base md:text-lg font-semibold hud-divider">
            {isQuarterly ? 'Tabela Trimestral' : 'Tabela Mensal'}
          </div>
          <button
            onClick={() => setHighVis((v) => !v)}
            className={`rounded-md border px-3 py-1 text-[11px] md:text-xs transition ${
              highVis
                ? 'border-hangar-cyan/60 text-hangar-cyan bg-hangar-cyan/10'
                : 'border-hangar-slate/40 text-hangar-muted hover:bg-hangar-surface'
            }`}
          >
            HighVis
          </button>
        </div>
        <div className="hidden md:block overflow-x-auto text-xs md:text-sm">
          <table className="w-full">
            <thead className="text-left text-xs text-hangar-muted">
              <tr>
                <th className="py-2">{isQuarterly ? 'Trimestre' : 'Mês'}</th>
                <th className="py-2">Receita Bruta</th>
                <th className="py-2">Receita Líquida</th>
                <th className="py-2">Custo</th>
                <th className="py-2">Margem Bruta</th>
                <th className="py-2">Margem Líquida</th>
              </tr>
            </thead>
            <tbody>
              {displaySeries.map((s) => (
                <tr
                  key={s.mes}
                  className={`border-t border-hangar-slate/20 odd:bg-hangar-surface/40 hover:bg-hangar-surface/70 transition ${
                    highVis && s.margem_liquida_pct < 0.1 ? 'bg-hangar-red/10 text-hangar-red' : ''
                  } ${s.margin_meta_pct && s.margem_liquida_pct < s.margin_meta_pct ? 'bg-hangar-orange/10 text-hangar-orange' : ''}`}
                >
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

        <div className="md:hidden space-y-3 text-xs">
          {displaySeries.map((s) => (
            <details
              key={s.mes}
              className={`rounded-md border border-hangar-slate/30 bg-hangar-surface/40 p-3 ${
                highVis && s.margem_liquida_pct < 0.1 ? 'bg-hangar-red/10 text-hangar-red' : ''
              } ${s.margin_meta_pct && s.margem_liquida_pct < s.margin_meta_pct ? 'bg-hangar-orange/10 text-hangar-orange' : ''}`}
            >
              <summary className="cursor-pointer list-none text-hangar-muted">{s.mes}</summary>
              <div className="mt-2 space-y-1">
                <Row label="Receita Bruta" value={currency(s.receita_bruta)} />
                <Row label="Receita Líquida" value={currency(s.receita_liquida)} />
                <Row label="Custo" value={currency(s.custo)} />
                <Row label="Margem Bruta" value={`${currency(s.margem_bruta)} (${percent(s.margem_bruta_pct)})`} />
                <Row label="Margem Líquida" value={`${currency(s.margem_liquida)} (${percent(s.margem_liquida_pct)})`} />
              </div>
            </details>
          ))}
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

function HudTooltip({ active, payload, label, labelTitle }: any) {
  if (!active || !payload?.length) return null;
  const data = payload[0]?.payload;
  return (
    <div className="rounded-md border border-hangar-slate/40 bg-hangar-panel/90 px-3 py-2 text-xs text-hangar-text hud-glow">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="text-hangar-muted">{labelTitle ?? 'Mês'}</div>
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

function PlanRealTooltip({ active, payload, label, labelTitle }: any) {
  if (!active || !payload?.length) return null;
  const data = payload[0]?.payload;
  return (
    <div className="rounded-md border border-hangar-slate/40 bg-hangar-panel/90 px-3 py-2 text-xs text-hangar-text hud-glow">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="text-hangar-muted">{labelTitle ?? 'Mês'}</div>
        <div>{label}</div>
      </div>
      <div className="flex items-center justify-between gap-3">
        <Badge color="cyan">Planejado</Badge>
        <div>{currency(data.planejado)}</div>
      </div>
      <div className="mt-1 flex items-center justify-between gap-3">
        <Badge color="green">Realizado</Badge>
        <div>{currency(data.realizado)}</div>
      </div>
      <div className="mt-2 flex items-center justify-between gap-3">
        <Badge color="cyan">Margem P.</Badge>
        <div>{percent(data.margem_planejada_pct)}</div>
      </div>
      <div className="mt-1 flex items-center justify-between gap-3">
        <Badge color="green">Margem R.</Badge>
        <div>{percent(data.margem_realizada_pct)}</div>
      </div>
    </div>
  );
}

function Badge({ color, children }: { color: 'cyan' | 'purple' | 'orange' | 'green'; children: string }) {
  const c =
    color === 'cyan'
      ? 'bg-hangar-cyan/15 text-hangar-cyan'
      : color === 'purple'
      ? 'bg-hangar-purple/15 text-hangar-purple'
      : color === 'orange'
      ? 'bg-hangar-orange/15 text-hangar-orange'
      : 'bg-hangar-green/15 text-hangar-green';
  return <span className={`rounded-full px-2 py-0.5 text-[10px] ${c}`}>{children}</span>;
}

const shareColors = ['#00E5FF', '#7C4DFF', '#00E676', '#FF9100', '#C0C0C0', '#546E7A', '#FF1744'];

function ClienteShareTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const data = payload[0]?.payload;
  return (
    <div className="rounded-md border border-hangar-slate/40 bg-hangar-panel/90 px-3 py-2 text-xs text-hangar-text hud-glow">
      <div className="mb-1 text-hangar-muted">{data?.nome}</div>
      <div className="flex items-center justify-between gap-3">
        <span>Receita Bruta</span>
        <span>{currency(data?.receita_bruta)}</span>
      </div>
      <div className="mt-1 text-hangar-muted">{percent(data?.pct)}</div>
    </div>
  );
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

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="text-hangar-muted">{label}</div>
      <div>{value}</div>
    </div>
  );
}

function aggregateQuarterly(series: Array<{ mes: string; receita_bruta: number; receita_liquida: number; custo: number; margem_bruta: number; margem_liquida: number; margin_meta_pct: number; margem_bruta_pct: number; margem_liquida_pct: number; }>) {
  const quarters = [
    { label: 'Q1', months: ['01', '02', '03'] },
    { label: 'Q2', months: ['04', '05', '06'] },
    { label: 'Q3', months: ['07', '08', '09'] },
    { label: 'Q4', months: ['10', '11', '12'] }
  ];

  return quarters.map((q) => {
    const rows = series.filter((s) => q.months.includes(s.mes.slice(5)));
    const receita_bruta = rows.reduce((a, r) => a + r.receita_bruta, 0);
    const receita_liquida = rows.reduce((a, r) => a + r.receita_liquida, 0);
    const custo = rows.reduce((a, r) => a + r.custo, 0);
    const margem_bruta = receita_bruta - custo;
    const margem_liquida = receita_liquida - custo;
    const meta_base = rows.reduce((a, r) => a + r.receita_liquida, 0);
    const meta_sum = rows.reduce((a, r) => a + r.margin_meta_pct * r.receita_liquida, 0);
    const margin_meta_pct = meta_base > 0 ? meta_sum / meta_base : 0;
    return {
      mes: q.label,
      receita_bruta,
      receita_liquida,
      custo,
      margem_bruta,
      margem_liquida,
      margin_meta_pct,
      margem_bruta_pct: receita_bruta > 0 ? margem_bruta / receita_bruta : 0,
      margem_liquida_pct: receita_liquida > 0 ? margem_liquida / receita_liquida : 0
    };
  });
}

function aggregateQuarterlyPlanReal(series: Array<{ mes: string; planejado: number; realizado: number; custo_planejado: number; custo_realizado: number; margem_planejada: number; margem_realizada: number; margem_planejada_pct: number; margem_realizada_pct: number }>) {
  const quarters = [
    { label: 'Q1', months: ['01', '02', '03'] },
    { label: 'Q2', months: ['04', '05', '06'] },
    { label: 'Q3', months: ['07', '08', '09'] },
    { label: 'Q4', months: ['10', '11', '12'] }
  ];

  return quarters.map((q) => {
    const rows = series.filter((s) => q.months.includes(s.mes.slice(5)));
    const planejado = rows.reduce((a, r) => a + r.planejado, 0);
    const realizado = rows.reduce((a, r) => a + r.realizado, 0);
    const custo_planejado = rows.reduce((a, r) => a + r.custo_planejado, 0);
    const custo_realizado = rows.reduce((a, r) => a + r.custo_realizado, 0);
    return {
      mes: q.label,
      planejado,
      realizado,
      custo_planejado,
      custo_realizado,
      margem_planejada: planejado - custo_planejado,
      margem_realizada: realizado - custo_realizado,
      margem_planejada_pct: planejado > 0 ? (planejado - custo_planejado) / planejado : 0,
      margem_realizada_pct: realizado > 0 ? (realizado - custo_realizado) / realizado : 0
    };
  });
}

function accumulateSeries(series: Array<{ mes: string; receita_bruta: number; receita_liquida: number; custo: number; margem_bruta: number; margem_liquida: number; margin_meta_pct: number; margem_bruta_pct: number; margem_liquida_pct: number; }>) {
  let receita_bruta = 0;
  let receita_liquida = 0;
  let custo = 0;
  return series.map((s) => {
    receita_bruta += s.receita_bruta;
    receita_liquida += s.receita_liquida;
    custo += s.custo;
    const margem_bruta = receita_bruta - custo;
    const margem_liquida = receita_liquida - custo;
    return {
      ...s,
      receita_bruta,
      receita_liquida,
      custo,
      margem_bruta,
      margem_liquida,
      margem_bruta_pct: receita_bruta > 0 ? margem_bruta / receita_bruta : 0,
      margem_liquida_pct: receita_liquida > 0 ? margem_liquida / receita_liquida : 0
    };
  });
}

function accumulatePlanReal(series: Array<{ mes: string; planejado: number; realizado: number; custo_planejado: number; custo_realizado: number; margem_planejada: number; margem_realizada: number; margem_planejada_pct: number; margem_realizada_pct: number }>) {
  let planejado = 0;
  let realizado = 0;
  let custo_planejado = 0;
  let custo_realizado = 0;
  return series.map((s) => {
    planejado += s.planejado;
    realizado += s.realizado;
    custo_planejado += s.custo_planejado;
    custo_realizado += s.custo_realizado;
    return {
      ...s,
      planejado,
      realizado,
      custo_planejado,
      custo_realizado,
      margem_planejada: planejado - custo_planejado,
      margem_realizada: realizado - custo_realizado,
      margem_planejada_pct: planejado > 0 ? (planejado - custo_planejado) / planejado : 0,
      margem_realizada_pct: realizado > 0 ? (realizado - custo_realizado) / realizado : 0
    };
  });
}

function decoratePlanReal(series: Array<{ mes: string; planejado: number; realizado: number; custo_planejado: number; custo_realizado: number }>) {
  return series.map((s) => ({
    ...s,
    margem_planejada: s.planejado - s.custo_planejado,
    margem_realizada: s.realizado - s.custo_realizado,
    margem_planejada_pct: s.planejado > 0 ? (s.planejado - s.custo_planejado) / s.planejado : 0,
    margem_realizada_pct: s.realizado > 0 ? (s.realizado - s.custo_realizado) / s.realizado : 0
  }));
}
