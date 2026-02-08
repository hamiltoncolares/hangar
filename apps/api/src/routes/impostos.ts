import { FastifyInstance } from 'fastify';
import { getPrisma } from '../db.js';
import { calcReceitaLiquida, toNumber } from '../utils.js';

export async function impostosRoutes(app: FastifyInstance) {
  const prisma = getPrisma();

  app.addHook('preHandler', app.authenticate);

  app.get('/impostos', async (req) => {
    const { projeto_id } = req.query as { projeto_id?: string };
    if (req.user?.role !== 'admin') {
      const allowed = req.userTierIds ?? [];
      return prisma.imposto.findMany({
        where: {
          ...(projeto_id ? { projetoId: projeto_id } : {}),
          projeto: { cliente: { tierId: { in: allowed } } }
        },
        orderBy: { vigenciaInicio: 'desc' }
      });
    }
    return prisma.imposto.findMany({
      where: projeto_id ? { projetoId: projeto_id } : undefined,
      orderBy: { vigenciaInicio: 'desc' }
    });
  });

  app.post('/impostos', { preHandler: app.requireAdmin }, async (req) => {
    const body = req.body as {
      projeto_id?: string;
      percentual?: number;
      vigencia_inicio?: string;
      vigencia_fim?: string;
      ativo?: boolean;
    };

    if (!body?.projeto_id) throw new Error('projeto_id is required');
    if (body?.percentual === undefined) throw new Error('percentual is required');
    if (!body?.vigencia_inicio) throw new Error('vigencia_inicio is required');

    return prisma.imposto.create({
      data: {
        projetoId: body.projeto_id,
        percentual: toNumber(body.percentual, 'percentual'),
        vigenciaInicio: new Date(body.vigencia_inicio),
        vigenciaFim: body.vigencia_fim ? new Date(body.vigencia_fim) : null,
        ativo: body.ativo ?? true
      }
    });
  });

  app.get('/impostos/:id', async (req) => {
    const { id } = req.params as { id: string };
    if (req.user?.role !== 'admin') {
      const allowed = req.userTierIds ?? [];
      const imposto = await prisma.imposto.findUnique({
        where: { id },
        include: { projeto: { include: { cliente: true } } }
      });
      if (!imposto || !allowed.includes(imposto.projeto.cliente.tierId)) throw new Error('forbidden');
    }
    return prisma.imposto.findUnique({ where: { id } });
  });

  app.patch('/impostos/:id', { preHandler: app.requireAdmin }, async (req) => {
    const { id } = req.params as { id: string };
    const body = req.body as {
      percentual?: number;
      vigencia_inicio?: string;
      vigencia_fim?: string;
      ativo?: boolean;
    };

    return prisma.imposto.update({
      where: { id },
      data: {
        percentual: body.percentual !== undefined ? toNumber(body.percentual, 'percentual') : undefined,
        vigenciaInicio: body.vigencia_inicio ? new Date(body.vigencia_inicio) : undefined,
        vigenciaFim: body.vigencia_fim ? new Date(body.vigencia_fim) : undefined,
        ativo: body.ativo
      }
    });
  });

  app.delete('/impostos/:id', { preHandler: app.requireAdmin }, async (req) => {
    const { id } = req.params as { id: string };
    return prisma.imposto.delete({ where: { id } });
  });

  app.post('/impostos/:id/recalcular', { preHandler: app.requireAdmin }, async (req) => {
    const { id } = req.params as { id: string };
    const body = req.body as { registros?: string[] };
    if (!body?.registros?.length) throw new Error('registros is required');

    const imposto = await prisma.imposto.findUnique({ where: { id } });
    if (!imposto) throw new Error('imposto not found');

    const registros = await prisma.registroMensal.findMany({
      where: { id: { in: body.registros } }
    });

    const updates = registros.map((r: { id: string; receitaBruta: unknown }) =>
      prisma.registroMensal.update({
        where: { id: r.id },
        data: {
          impostoId: imposto.id,
          receitaLiquida: calcReceitaLiquida(Number(r.receitaBruta), Number(imposto.percentual))
        }
      })
    );

    await prisma.$transaction(updates);
    return { updated: registros.length };
  });
}
