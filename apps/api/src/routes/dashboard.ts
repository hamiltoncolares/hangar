import { FastifyInstance } from 'fastify';
import { getPrisma } from '../db';

export async function dashboardRoutes(app: FastifyInstance) {
  const prisma = getPrisma();

  app.get('/dashboard', async (req) => {
    const { tier_id, cliente_id, projeto_id, ano } = req.query as {
      tier_id?: string;
      cliente_id?: string;
      projeto_id?: string;
      ano?: string;
    };

    const year = ano ? Number(ano) : new Date().getFullYear();
    const start = new Date(Date.UTC(year, 0, 1));
    const end = new Date(Date.UTC(year + 1, 0, 1));

    const projetoWhere: any = {};
    if (projeto_id) projetoWhere.id = projeto_id;
    if (cliente_id) projetoWhere.clienteId = cliente_id;
    if (tier_id) projetoWhere.cliente = { ...(projetoWhere.cliente ?? {}), tierId: tier_id };

    const registros = await prisma.registroMensal.findMany({
      where: {
        mesRef: { gte: start, lt: end },
        ...(Object.keys(projetoWhere).length ? { projeto: projetoWhere } : {})
      }
    });

    const byMonth = new Map<number, { receita_bruta: number; receita_liquida: number; custo: number }>();
    for (const r of registros) {
      const m = r.mesRef.getUTCMonth() + 1;
      const prev = byMonth.get(m) ?? { receita_bruta: 0, receita_liquida: 0, custo: 0 };
      byMonth.set(m, {
        receita_bruta: prev.receita_bruta + Number(r.receitaBruta),
        receita_liquida: prev.receita_liquida + Number(r.receitaLiquida),
        custo: prev.custo + Number(r.custoProjetado)
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

      return {
        mes: `${year}-${String(month).padStart(2, '0')}`,
        receita_bruta,
        receita_liquida,
        custo,
        margem_bruta,
        margem_liquida,
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
  });
}
