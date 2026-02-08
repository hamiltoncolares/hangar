import { useEffect, useState } from 'react';
import { Area, Bar, ComposedChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { TooltipProps } from 'recharts';
import { apiClient, GoalsResponse } from '../lib/api';

export function MetasPage({
  tierId,
  clienteId,
  projetoId,
  ano,
  status
}: {
  tierId?: string[];
  clienteId?: string[];
  projetoId?: string[];
  ano: number;
  status?: string;
}) {
  const [data, setData] = useState<GoalsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    apiClient
      .getGoals({ tierId, clienteId, projetoId, ano, status })
      .then((res) => {
        if (!mounted) return;
        setData(res);
        setError(null);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err.message || 'Erro ao carregar metas');
      });
    return () => {
      mounted = false;
    };
  }, [tierId, clienteId, projetoId, ano, status]);

  return (
    <div className="px-6 py-6">
      {error && (
        <div className="mb-4 rounded-md border border-hangar-red/40 bg-hangar-red/10 px-4 py-3 text-sm text-hangar-red">
          {error}
        </div>
      )}

      <div className="grid gap-6 grid-cols-1 xl:grid-cols-2 enter">
        <MetaProgressChart title="Atingimento Mensal" data={data?.series_mensal ?? []} />
        <MetaProgressChart title="Atingimento Trimestral" data={data?.series_trimestral ?? []} />
      </div>

      <div className="mt-6 grid gap-6 grid-cols-1 xl:grid-cols-2 enter-delay">
        <MetaChart title="Metas por Tier" data={data?.tiers ?? []} />
        <MetaChart title="Metas por Cliente" data={data?.clientes ?? []} />
      </div>

      <div className="mt-6">
        <MetaChart title="Metas por Projeto" data={data?.projetos ?? []} />
      </div>
    </div>
  );
}

function MetaChart({ title, data }: { title: string; data: Array<{ id: string; nome: string; meta_pct: number; atual_pct: number }> }) {
  const display = [...data].sort((a, b) => b.atual_pct - a.atual_pct).slice(0, 12);
  return (
    <div className="rounded-lg p-4 md:p-5 hud-panel relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <div className="absolute inset-0 hud-grid" />
        <div className="absolute inset-0 bg-gradient-to-b from-hangar-accent/20 via-transparent to-transparent" />
      </div>
      <div className="mb-4 flex items-center justify-between hud-divider">
        <div className="text-base md:text-lg font-semibold">{title}</div>
        <div className="text-[10px] md:text-xs text-hangar-muted">Margem líquida (real vs meta)</div>
      </div>
      <div className="mb-3 flex flex-wrap items-center gap-3 text-[10px] md:text-xs text-hangar-muted">
        <span className="inline-flex items-center gap-2">
          <span className="h-2 w-6 rounded-full bg-hangar-orange"></span> Meta
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-2 w-6 rounded-full bg-hangar-purple"></span> Atual
        </span>
      </div>
      <div className="h-64 md:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={display} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="metaBar" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#FF9100" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#FF9100" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="atualBar" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7C4DFF" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#7C4DFF" stopOpacity={0.05} />
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
            <XAxis dataKey="nome" tick={{ fill: 'var(--hangar-muted)', fontSize: 10 }} />
            <YAxis tick={{ fill: 'var(--hangar-muted)', fontSize: 10 }} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
            <Tooltip content={<MetaTooltip />} />
            <Bar dataKey="meta_pct" fill="url(#metaBar)" stroke="#FF9100" radius={[6, 6, 0, 0]} filter="url(#glowOrange)" />
            <Bar dataKey="atual_pct" fill="url(#atualBar)" stroke="#7C4DFF" radius={[6, 6, 0, 0]} filter="url(#glowPurple)" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

type MetaPoint = { meta_pct?: number; atual_pct?: number; nome?: string; mes?: string };

function MetaTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  const data = payload[0]?.payload as MetaPoint | undefined;
  if (!data) return null;
  return (
    <div className="rounded-md border border-hangar-slate/60 bg-hangar-panel/95 px-3 py-2 text-xs text-hangar-text shadow-lg backdrop-blur">
      <div className="mb-1 text-hangar-text/80">{label}</div>
      <div className="flex items-center justify-between gap-3">
        <span>Meta</span>
        <span>{percent(data.meta_pct)}</span>
      </div>
      <div className="mt-1 flex items-center justify-between gap-3">
        <span>Atual</span>
        <span>{percent(data.atual_pct)}</span>
      </div>
    </div>
  );
}

function percent(value?: number) {
  if (value === undefined) return '--';
  return `${(value * 100).toFixed(1)}%`;
}

function MetaProgressChart({ title, data }: { title: string; data: Array<{ mes: string; meta_pct: number; atual_pct: number }> }) {
  return (
    <div className="rounded-lg p-4 md:p-5 hud-panel relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <div className="absolute inset-0 hud-grid" />
        <div className="absolute inset-0 bg-gradient-to-b from-hangar-accent/20 via-transparent to-transparent" />
      </div>
      <div className="mb-4 flex items-center justify-between hud-divider">
        <div className="text-base md:text-lg font-semibold">{title}</div>
        <div className="text-[10px] md:text-xs text-hangar-muted">Meta vs Atual (margem líquida)</div>
      </div>
      <div className="mb-3 flex flex-wrap items-center gap-3 text-[10px] md:text-xs text-hangar-muted">
        <span className="inline-flex items-center gap-2">
          <span className="h-2 w-6 rounded-full bg-hangar-orange"></span> Meta
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-2 w-6 rounded-full bg-hangar-purple"></span> Atual
        </span>
      </div>
      <div className="h-56 md:h-64">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="metaLine" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#FF9100" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#FF9100" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="atualLine" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7C4DFF" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#7C4DFF" stopOpacity={0} />
              </linearGradient>
              <filter id="glowOrangeLine" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="glowPurpleLine" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <XAxis dataKey="mes" tick={{ fill: 'var(--hangar-muted)', fontSize: 10 }} />
            <YAxis tick={{ fill: 'var(--hangar-muted)', fontSize: 10 }} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
            <Tooltip content={<MetaProgressTooltip />} />
            <Area type="monotone" dataKey="meta_pct" stroke="#FF9100" fill="url(#metaLine)" strokeWidth={2.5} filter="url(#glowOrangeLine)" />
            <Area type="monotone" dataKey="atual_pct" stroke="#7C4DFF" fill="url(#atualLine)" strokeWidth={2.5} filter="url(#glowPurpleLine)" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function MetaProgressTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  const data = payload[0]?.payload as MetaPoint | undefined;
  if (!data) return null;
  return (
    <div className="rounded-md border border-hangar-slate/60 bg-hangar-panel/95 px-3 py-2 text-xs text-hangar-text shadow-lg backdrop-blur">
      <div className="mb-1 text-hangar-text/80">{label}</div>
      <div className="flex items-center justify-between gap-3">
        <span>Meta</span>
        <span>{percent(data.meta_pct)}</span>
      </div>
      <div className="mt-1 flex items-center justify-between gap-3">
        <span>Atual</span>
        <span>{percent(data.atual_pct)}</span>
      </div>
    </div>
  );
}
