import { FastifyInstance } from 'fastify';
import { getPrisma } from '../db';
import { calcReceitaLiquida, parseMonth, toNumber } from '../utils';

export async function registrosRoutes(app: FastifyInstance) {
  const prisma = getPrisma();

  app.get('/registros', async (req) => {
    const { projeto_id, mes_ref, status } = req.query as {
      projeto_id?: string;
      mes_ref?: string;
      status?: string;
    };

    return prisma.registroMensal.findMany({
      where: {
        projetoId: projeto_id,
        status: status,
        mesRef: mes_ref ? parseMonth(mes_ref) : undefined
      },
      orderBy: { mesRef: 'desc' }
    });
  });

  app.post('/registros', async (req) => {
    const body = req.body as {
      projeto_id?: string;
      mes_ref?: string;
      receita_bruta?: number;
      imposto_id?: string;
      receita_liquida?: number;
      custo_projetado?: number;
      status?: string;
      observacoes?: string;
    };

    if (!body?.projeto_id) throw new Error('projeto_id is required');
    if (!body?.mes_ref) throw new Error('mes_ref is required');
    if (body?.receita_bruta === undefined) throw new Error('receita_bruta is required');
    if (!body?.imposto_id) throw new Error('imposto_id is required');
    if (body?.custo_projetado === undefined) throw new Error('custo_projetado is required');
    if (!body?.status) throw new Error('status is required');

    const imposto = await prisma.imposto.findUnique({ where: { id: body.imposto_id } });
    if (!imposto) throw new Error('imposto not found');

    const receitaBrutaNum = toNumber(body.receita_bruta, 'receita_bruta');
    const receitaLiquida =
      body.receita_liquida !== undefined
        ? toNumber(body.receita_liquida, 'receita_liquida')
        : calcReceitaLiquida(receitaBrutaNum, Number(imposto.percentual));

    return prisma.registroMensal.create({
      data: {
        projetoId: body.projeto_id,
        mesRef: parseMonth(body.mes_ref),
        receitaBruta: receitaBrutaNum,
        impostoId: body.imposto_id,
        receitaLiquida,
        custoProjetado: toNumber(body.custo_projetado, 'custo_projetado'),
        status: body.status,
        observacoes: body.observacoes
      }
    });
  });

  app.get('/registros/:id', async (req) => {
    const { id } = req.params as { id: string };
    return prisma.registroMensal.findUnique({ where: { id } });
  });

  app.patch('/registros/:id', async (req) => {
    const { id } = req.params as { id: string };
    const body = req.body as {
      mes_ref?: string;
      receita_bruta?: number;
      imposto_id?: string;
      receita_liquida?: number;
      custo_projetado?: number;
      status?: string;
      observacoes?: string;
    };

    const atual = await prisma.registroMensal.findUnique({ where: { id } });
    if (!atual) throw new Error('registro not found');

    const receitaBruta = body.receita_bruta !== undefined
      ? toNumber(body.receita_bruta, 'receita_bruta')
      : Number(atual.receitaBruta);

    const impostoId = body.imposto_id ?? atual.impostoId;
    const imposto = await prisma.imposto.findUnique({ where: { id: impostoId } });
    if (!imposto) throw new Error('imposto not found');

    let receitaLiquida: any = undefined;
    if (body.receita_liquida !== undefined) {
      receitaLiquida = toNumber(body.receita_liquida, 'receita_liquida');
    } else if (body.receita_bruta !== undefined || body.imposto_id !== undefined) {
      receitaLiquida = calcReceitaLiquida(receitaBruta, Number(imposto.percentual));
    }

    return prisma.registroMensal.update({
      where: { id },
      data: {
        mesRef: body.mes_ref ? parseMonth(body.mes_ref) : undefined,
        receitaBruta: body.receita_bruta !== undefined ? receitaBruta : undefined,
        impostoId: body.imposto_id,
        receitaLiquida,
        custoProjetado: body.custo_projetado !== undefined ? toNumber(body.custo_projetado, 'custo_projetado') : undefined,
        status: body.status,
        observacoes: body.observacoes
      }
    });
  });

  app.delete('/registros/:id', async (req) => {
    const { id } = req.params as { id: string };
    return prisma.registroMensal.delete({ where: { id } });
  });
}
