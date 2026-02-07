import { FastifyInstance } from 'fastify';
import { getPrisma } from '../db';
import { Prisma } from '@prisma/client';

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

    let where = Prisma.sql`WHERE EXTRACT(YEAR FROM rm.mes_ref) = ${year}`;
    if (tier_id) where = Prisma.sql`${where} AND t.id = ${tier_id}`;
    if (cliente_id) where = Prisma.sql`${where} AND c.id = ${cliente_id}`;
    if (projeto_id) where = Prisma.sql`${where} AND p.id = ${projeto_id}`;

    const rows = await prisma.$queryRaw<
      Array<{
        mes: Date;
        receita_bruta: number;
        receita_liquida: number;
        custo: number;
      }>
    >(Prisma.sql`
      SELECT
        date_trunc('month', rm.mes_ref) AS mes,
        COALESCE(SUM(rm.receita_bruta), 0) AS receita_bruta,
        COALESCE(SUM(rm.receita_liquida), 0) AS receita_liquida,
        COALESCE(SUM(rm.custo_projetado), 0) AS custo
      FROM registros_mensais rm
      JOIN projetos p ON rm.projeto_id = p.id
      JOIN clientes c ON p.cliente_id = c.id
      JOIN tiers t ON c.tier_id = t.id
      ${where}
      GROUP BY 1
      ORDER BY 1
    `);

    const byMonth = new Map<number, typeof rows[0]>();
    rows.forEach((r) => byMonth.set(new Date(r.mes).getUTCMonth() + 1, r));

    const series_mensal = Array.from({ length: 12 }).map((_, idx) => {
      const month = idx + 1;
      const r = byMonth.get(month);
      const receita_bruta = r ? Number(r.receita_bruta) : 0;
      const receita_liquida = r ? Number(r.receita_liquida) : 0;
      const custo = r ? Number(r.custo) : 0;
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
