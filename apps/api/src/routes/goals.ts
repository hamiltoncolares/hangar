import { FastifyInstance } from 'fastify';
import { getPrisma } from '../db.js';

export async function goalsRoutes(app: FastifyInstance) {
  const prisma = getPrisma();
  app.addHook('preHandler', app.authenticate);

  app.get('/goals', async (req) => {
    const { tier_id, cliente_id, projeto_id, ano, status } = req.query as {
      tier_id?: string | string[];
      cliente_id?: string | string[];
      projeto_id?: string | string[];
      ano?: string;
      status?: string;
    };

    const year = ano ? Number(ano) : new Date().getFullYear();
    const start = new Date(Date.UTC(year, 0, 1));
    const end = new Date(Date.UTC(year + 1, 0, 1));

    const tierIds = (Array.isArray(tier_id) ? tier_id : tier_id ? [tier_id] : []).filter(Boolean);
    const clienteIds = (Array.isArray(cliente_id) ? cliente_id : cliente_id ? [cliente_id] : []).filter(Boolean);
    const projetoIds = (Array.isArray(projeto_id) ? projeto_id : projeto_id ? [projeto_id] : []).filter(Boolean);

    const projetoWhere: any = {};
    if (projetoIds.length) projetoWhere.id = { in: projetoIds };
    if (clienteIds.length) projetoWhere.clienteId = { in: clienteIds };
    if (tierIds.length) projetoWhere.cliente = { ...(projetoWhere.cliente ?? {}), tierId: { in: tierIds } };

    if (req.user?.role !== 'admin') {
      const allowed = req.userTierIds ?? [];
      if (tierIds.length && tierIds.some((id) => !allowed.includes(id))) {
        return { tiers: [], clientes: [], projetos: [] };
      }
      projetoWhere.cliente = {
        ...(projetoWhere.cliente ?? {}),
        tierId: { in: tierIds.length ? tierIds : allowed }
      };
    }

    const registros = await prisma.registroMensal.findMany({
      where: {
        mesRef: { gte: start, lt: end },
        ...(Object.keys(projetoWhere).length ? { projeto: projetoWhere } : {})
      },
      include: {
        projeto: {
          include: {
            cliente: {
              include: { tier: true }
            }
          }
        }
      }
    });

    const base = registros.filter((r) => r.status === 'realizado');

    const tiers = aggregateByTier(base);
    const clientes = aggregateByCliente(base);
    const projetos = aggregateByProjeto(base);
    const series_mensal = aggregateByMonth(base, year);
    const series_trimestral = aggregateByQuarter(series_mensal, year);

    return { tiers, clientes, projetos, series_mensal, series_trimestral };
  });
}

function applyPipeline(registros: Array<any>) {
  const byKey = new Map<string, typeof registros[number]>();
  for (const r of registros) {
    const key = `${r.projetoId}-${r.mesRef.toISOString().slice(0, 10)}`;
    const current = byKey.get(key);
    if (!current) {
      byKey.set(key, r);
      continue;
    }
    if (current.status === 'realizado') {
      if (r.status === 'realizado' && r.updatedAt > current.updatedAt) byKey.set(key, r);
      continue;
    }
    if (r.status === 'realizado') {
      byKey.set(key, r);
      continue;
    }
    if (r.updatedAt > current.updatedAt) byKey.set(key, r);
  }
  return Array.from(byKey.values());
}

function aggregateByTier(registros: Array<any>) {
  const byTier = new Map<string, { id: string; nome: string; meta_pct: number; receita: number; custo: number }>();
  for (const r of registros) {
    const tier = r.projeto?.cliente?.tier;
    if (!tier) continue;
    const prev = byTier.get(tier.id) ?? { id: tier.id, nome: tier.nome, meta_pct: tier.marginMeta ? Number(tier.marginMeta) / 100 : 0, receita: 0, custo: 0 };
    byTier.set(tier.id, {
      ...prev,
      receita: prev.receita + Number(r.receitaLiquida),
      custo: prev.custo + Number(r.custoProjetado)
    });
  }
  return Array.from(byTier.values()).map((t) => ({
    id: t.id,
    nome: t.nome,
    meta_pct: t.meta_pct,
    atual_pct: t.receita > 0 ? (t.receita - t.custo) / t.receita : 0
  }));
}

function aggregateByCliente(registros: Array<any>) {
  const byCliente = new Map<string, { id: string; nome: string; meta_pct: number; receita: number; custo: number }>();
  for (const r of registros) {
    const cliente = r.projeto?.cliente;
    const tier = r.projeto?.cliente?.tier;
    if (!cliente) continue;
    const metaRaw = cliente.marginMeta ?? tier?.marginMeta;
    const prev = byCliente.get(cliente.id) ?? { id: cliente.id, nome: cliente.nome, meta_pct: metaRaw ? Number(metaRaw) / 100 : 0, receita: 0, custo: 0 };
    byCliente.set(cliente.id, {
      ...prev,
      receita: prev.receita + Number(r.receitaLiquida),
      custo: prev.custo + Number(r.custoProjetado)
    });
  }
  return Array.from(byCliente.values()).map((c) => ({
    id: c.id,
    nome: c.nome,
    meta_pct: c.meta_pct,
    atual_pct: c.receita > 0 ? (c.receita - c.custo) / c.receita : 0
  }));
}

function aggregateByProjeto(registros: Array<any>) {
  const byProjeto = new Map<string, { id: string; nome: string; meta_pct: number; receita: number; custo: number }>();
  for (const r of registros) {
    const projeto = r.projeto;
    const cliente = r.projeto?.cliente;
    const tier = r.projeto?.cliente?.tier;
    if (!projeto) continue;
    const metaRaw = projeto.marginMeta ?? cliente?.marginMeta ?? tier?.marginMeta;
    const prev = byProjeto.get(projeto.id) ?? { id: projeto.id, nome: projeto.nome, meta_pct: metaRaw ? Number(metaRaw) / 100 : 0, receita: 0, custo: 0 };
    byProjeto.set(projeto.id, {
      ...prev,
      receita: prev.receita + Number(r.receitaLiquida),
      custo: prev.custo + Number(r.custoProjetado)
    });
  }
  return Array.from(byProjeto.values()).map((p) => ({
    id: p.id,
    nome: p.nome,
    meta_pct: p.meta_pct,
    atual_pct: p.receita > 0 ? (p.receita - p.custo) / p.receita : 0
  }));
}

function aggregateByMonth(registros: Array<any>, year: number) {
  const byMonth = new Map<number, { receita: number; custo: number; meta_sum: number; meta_base: number }>();
  for (const r of registros) {
    const m = r.mesRef.getUTCMonth() + 1;
    const prev = byMonth.get(m) ?? { receita: 0, custo: 0, meta_sum: 0, meta_base: 0 };
    const receita = Number(r.receitaLiquida);
    const custo = Number(r.custoProjetado);
    const metaRaw = r.marginMeta ?? r.projeto?.marginMeta ?? r.projeto?.cliente?.marginMeta ?? r.projeto?.cliente?.tier?.marginMeta;
    const meta = metaRaw !== null && metaRaw !== undefined ? Number(metaRaw) / 100 : 0;
    byMonth.set(m, {
      receita: prev.receita + receita,
      custo: prev.custo + custo,
      meta_sum: prev.meta_sum + (meta ? meta * receita : 0),
      meta_base: prev.meta_base + (meta ? receita : 0)
    });
  }

  return Array.from({ length: 12 }).map((_, idx) => {
    const month = idx + 1;
    const row = byMonth.get(month) ?? { receita: 0, custo: 0, meta_sum: 0, meta_base: 0 };
    const atual_pct = row.receita > 0 ? (row.receita - row.custo) / row.receita : 0;
    const meta_pct = row.meta_base > 0 ? row.meta_sum / row.meta_base : 0;
    return {
      mes: `${year}-${String(month).padStart(2, '0')}`,
      atual_pct,
      meta_pct
    };
  });
}

function aggregateByQuarter(series: Array<{ mes: string; atual_pct: number; meta_pct: number }>, year: number) {
  const quarters = [
    { label: 'Q1', months: ['01', '02', '03'] },
    { label: 'Q2', months: ['04', '05', '06'] },
    { label: 'Q3', months: ['07', '08', '09'] },
    { label: 'Q4', months: ['10', '11', '12'] }
  ];

  return quarters.map((q) => {
    const rows = series.filter((s) => q.months.includes(s.mes.slice(5)));
    const meta_pct = rows.length ? rows.reduce((a, r) => a + r.meta_pct, 0) / rows.length : 0;
    const atual_pct = rows.length ? rows.reduce((a, r) => a + r.atual_pct, 0) / rows.length : 0;
    return { mes: q.label, meta_pct, atual_pct };
  });
}
