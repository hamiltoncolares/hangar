import { FastifyInstance } from 'fastify';
import { getPrisma } from '../db.js';

export async function dashboardRoutes(app: FastifyInstance) {
  const prisma = getPrisma();

  app.addHook('preHandler', app.authenticate);

  app.get('/dashboard', async (req) => {
    const { tier_id, cliente_id, projeto_id, ano, status } = req.query as {
      tier_id?: string | string[];
      cliente_id?: string | string[];
      projeto_id?: string | string[];
      ano?: string;
      status?: string;
    };
    const tierIds = (Array.isArray(tier_id) ? tier_id : tier_id ? [tier_id] : []).filter(Boolean);
    const clienteIds = (Array.isArray(cliente_id) ? cliente_id : cliente_id ? [cliente_id] : []).filter(Boolean);
    const projetoIds = (Array.isArray(projeto_id) ? projeto_id : projeto_id ? [projeto_id] : []).filter(Boolean);

    const year = ano ? Number(ano) : new Date().getFullYear();
    const start = new Date(Date.UTC(year, 0, 1));
    const end = new Date(Date.UTC(year + 1, 0, 1));

    const projetoWhere: any = {};
    if (projetoIds.length) projetoWhere.id = { in: projetoIds };
    if (clienteIds.length) projetoWhere.clienteId = { in: clienteIds };
    if (tierIds.length) projetoWhere.cliente = { ...(projetoWhere.cliente ?? {}), tierId: { in: tierIds } };

    if (req.user?.role !== 'admin') {
      const allowed = req.userTierIds ?? [];
      if (tierIds.length && tierIds.some((id) => !allowed.includes(id))) {
        return { series_mensal: [], totais: { receita_bruta: 0, receita_liquida: 0, custo: 0, margem_bruta: 0, margem_liquida: 0, margem_bruta_pct: 0, margem_liquida_pct: 0 }, planned_vs_realizado: [], cliente_share: [] };
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
          select: {
            marginMeta: true,
            cliente: {
              select: {
                id: true,
                nome: true,
                marginMeta: true,
                tierId: true,
                tier: { select: { marginMeta: true } }
              }
            }
          }
        }
      }
    });

    const shareProjetoWhere: any = {};
    if (tierIds.length) shareProjetoWhere.cliente = { ...(shareProjetoWhere.cliente ?? {}), tierId: { in: tierIds } };
    if (req.user?.role !== 'admin') {
      const allowed = req.userTierIds ?? [];
      shareProjetoWhere.cliente = {
        ...(shareProjetoWhere.cliente ?? {}),
        tierId: { in: tierIds.length ? tierIds : allowed }
      };
    }

    const registrosShare = await prisma.registroMensal.findMany({
      where: {
        mesRef: { gte: start, lt: end },
        ...(Object.keys(shareProjetoWhere).length ? { projeto: shareProjetoWhere } : {})
      },
      include: {
        projeto: {
          select: {
            cliente: { select: { id: true, nome: true } }
          }
        }
      }
    });

    const planned_vs_realizado = buildPlannedVsRealizado(registros, year);
    const cliente_share = buildClienteShare(registrosShare);

    if (status === 'planejado' || status === 'realizado') {
      const filtered = registros.filter((r) => r.status === status);
      const base = buildResponse(filtered, year);
      return { ...base, planned_vs_realizado, cliente_share };
    }

    // Pipeline (default): se houver realizado, usa ele. Se houver múltiplos planejados, usa o mais recente.
    const byKey = new Map<string, typeof registros[number]>();
    for (const r of registros) {
      const key = `${r.projetoId}-${r.mesRef.toISOString().slice(0, 10)}`;
      const current = byKey.get(key);
      if (!current) {
        byKey.set(key, r);
        continue;
      }
      if (current.status === 'realizado') {
        if (r.status === 'realizado') {
          // mantém o mais recente
          if (r.updatedAt > current.updatedAt) byKey.set(key, r);
        }
        continue;
      }
      if (r.status === 'realizado') {
        byKey.set(key, r);
        continue;
      }
      // ambos planejados: pega o mais recente
      if (r.updatedAt > current.updatedAt) byKey.set(key, r);
    }

    const base = buildResponse(Array.from(byKey.values()), year);
    return { ...base, planned_vs_realizado, cliente_share };
  });
}

function buildResponse(registros: Array<any>, year: number) {
  const byMonth = new Map<number, { receita_bruta: number; receita_liquida: number; custo: number; meta_sum: number; meta_base: number }>();
  for (const r of registros) {
    const m = r.mesRef.getUTCMonth() + 1;
    const prev = byMonth.get(m) ?? { receita_bruta: 0, receita_liquida: 0, custo: 0, meta_sum: 0, meta_base: 0 };
    const receitaLiquida = Number(r.receitaLiquida);
    const marginMetaRaw =
      r.marginMeta ?? r.projeto?.marginMeta ?? r.projeto?.cliente?.marginMeta ?? r.projeto?.cliente?.tier?.marginMeta;
    const marginMeta = marginMetaRaw !== null && marginMetaRaw !== undefined ? Number(marginMetaRaw) : undefined;
    byMonth.set(m, {
      receita_bruta: prev.receita_bruta + Number(r.receitaBruta),
      receita_liquida: prev.receita_liquida + receitaLiquida,
      custo: prev.custo + Number(r.custoProjetado),
      meta_sum: prev.meta_sum + (marginMeta !== undefined ? (marginMeta / 100) * receitaLiquida : 0),
      meta_base: prev.meta_base + (marginMeta !== undefined ? receitaLiquida : 0)
    });
  }

  const series_mensal = Array.from({ length: 12 }).map((_, idx) => {
    const month = idx + 1;
    const r = byMonth.get(month);
    const receita_bruta = r ? r.receita_bruta : 0;
    const receita_liquida = r ? r.receita_liquida : 0;
    const custo = r ? r.custo : 0;
    const margem_bruta = receita_bruta - custo;
    const margem_liquida = receita_liquida - custo;
    const margin_meta_pct = r && r.meta_base > 0 ? r.meta_sum / r.meta_base : 0;

    return {
      mes: `${year}-${String(month).padStart(2, '0')}`,
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

  const totals = series_mensal.reduce(
    (acc, cur) => {
      acc.receita_bruta += cur.receita_bruta;
      acc.receita_liquida += cur.receita_liquida;
      acc.custo += cur.custo;
      acc.margem_bruta += cur.margem_bruta;
      acc.margem_liquida += cur.margem_liquida;
      return acc;
    },
    { receita_bruta: 0, receita_liquida: 0, custo: 0, margem_bruta: 0, margem_liquida: 0 }
  );

  const totais = {
    ...totals,
    margem_bruta_pct: totals.receita_bruta > 0 ? totals.margem_bruta / totals.receita_bruta : 0,
    margem_liquida_pct: totals.receita_liquida > 0 ? totals.margem_liquida / totals.receita_liquida : 0
  };

  return { series_mensal, totais };
}

function buildPlannedVsRealizado(registros: Array<any>, year: number) {
  const byKey = new Map<string, { planejado?: any; realizado?: any }>();
  for (const r of registros) {
    const key = `${r.projetoId}-${r.mesRef.getUTCFullYear()}-${String(r.mesRef.getUTCMonth() + 1).padStart(2, '0')}`;
    const current = byKey.get(key) ?? {};
    if (r.status === 'realizado') {
      if (!current.realizado || r.updatedAt > current.realizado.updatedAt) {
        current.realizado = r;
      }
    } else {
      if (!current.planejado || r.updatedAt > current.planejado.updatedAt) {
        current.planejado = r;
      }
    }
    byKey.set(key, current);
  }

  const byMonth = new Map<number, { planejado: number; realizado: number; custoPlanejado: number; custoRealizado: number; hasRealizado: boolean }>();
  for (const v of byKey.values()) {
    const ref = (v.realizado ?? v.planejado)?.mesRef;
    if (!ref) continue;
    const m = ref.getUTCMonth() + 1;
    const prev = byMonth.get(m) ?? { planejado: 0, realizado: 0, custoPlanejado: 0, custoRealizado: 0, hasRealizado: false };
    const realizadoValue = v.realizado ? Number(v.realizado.receitaLiquida) : 0;
    byMonth.set(m, {
      planejado: prev.planejado + (v.planejado ? Number(v.planejado.receitaLiquida) : 0),
      realizado: prev.realizado + realizadoValue,
      custoPlanejado: prev.custoPlanejado + (v.planejado ? Number(v.planejado.custoProjetado) : 0),
      custoRealizado: prev.custoRealizado + (v.realizado ? Number(v.realizado.custoProjetado) : 0),
      hasRealizado: prev.hasRealizado || realizadoValue > 0
    });
  }

  return Array.from({ length: 12 }).map((_, idx) => {
    const month = idx + 1;
    const r = byMonth.get(month) ?? { planejado: 0, realizado: 0, custoPlanejado: 0, custoRealizado: 0, hasRealizado: false };
    const realizado = r.hasRealizado ? r.realizado : r.planejado;
    const custoRealizado = r.hasRealizado ? r.custoRealizado : r.custoPlanejado;
    return {
      mes: `${year}-${String(month).padStart(2, '0')}`,
      planejado: r.planejado,
      realizado,
      custo_planejado: r.custoPlanejado,
      custo_realizado: custoRealizado
    };
  });
}

function buildClienteShare(registros: Array<any>) {
  const byKey = new Map<string, any>();
  for (const r of registros) {
    if (!r.projeto?.cliente) continue;
    const key = `${r.projetoId}-${r.mesRef.getUTCFullYear()}-${String(r.mesRef.getUTCMonth() + 1).padStart(2, '0')}`;
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

  const byCliente = new Map<string, { id: string; nome: string; receita_bruta: number }>();
  for (const r of byKey.values()) {
    const cliente = r.projeto?.cliente;
    if (!cliente) continue;
    const prev = byCliente.get(cliente.id) ?? { id: cliente.id, nome: cliente.nome, receita_bruta: 0 };
    byCliente.set(cliente.id, {
      ...prev,
      receita_bruta: prev.receita_bruta + Number(r.receitaBruta)
    });
  }

  const items = Array.from(byCliente.values());
  const total = items.reduce((acc, cur) => acc + cur.receita_bruta, 0);
  return items
    .map((i) => ({ ...i, pct: total > 0 ? i.receita_bruta / total : 0 }))
    .sort((a, b) => b.receita_bruta - a.receita_bruta);
}
