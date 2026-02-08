import { FastifyInstance } from 'fastify';
import { getPrisma } from '../db.js';

export async function projetosRoutes(app: FastifyInstance) {
  const prisma = getPrisma();

  app.addHook('preHandler', app.authenticate);

  app.get('/projetos', async (req) => {
    const { cliente_id } = req.query as { cliente_id?: string };
    if (req.user?.role !== 'admin') {
      const allowed = req.userTierIds ?? [];
      return prisma.projeto.findMany({
        where: {
          ...(cliente_id ? { clienteId: cliente_id } : {}),
          cliente: { tierId: { in: allowed } }
        },
        orderBy: { nome: 'asc' }
      });
    }
    return prisma.projeto.findMany({
      where: cliente_id ? { clienteId: cliente_id } : undefined,
      orderBy: { nome: 'asc' }
    });
  });

  app.post('/projetos', { preHandler: app.requireAdmin }, async (req) => {
    const body = req.body as { cliente_id?: string; nome?: string; status?: string; margin_meta?: number };
    if (!body?.cliente_id) throw new Error('cliente_id is required');
    if (!body?.nome) throw new Error('nome is required');
    return prisma.projeto.create({
      data: {
        clienteId: body.cliente_id,
        nome: body.nome,
        status: body.status ?? 'ativo',
        marginMeta: body.margin_meta ?? null
      }
    });
  });

  app.get('/projetos/:id', async (req) => {
    const { id } = req.params as { id: string };
    if (req.user?.role !== 'admin') {
      const allowed = req.userTierIds ?? [];
      const projeto = await prisma.projeto.findUnique({
        where: { id },
        include: { cliente: true }
      });
      if (!projeto || !allowed.includes(projeto.cliente.tierId)) throw new Error('forbidden');
    }
    return prisma.projeto.findUnique({ where: { id } });
  });

  app.patch('/projetos/:id', { preHandler: app.requireAdmin }, async (req) => {
    const { id } = req.params as { id: string };
    const body = req.body as { cliente_id?: string; nome?: string; status?: string; margin_meta?: number };
    return prisma.projeto.update({
      where: { id },
      data: {
        clienteId: body.cliente_id,
        nome: body.nome,
        status: body.status,
        marginMeta: body.margin_meta
      }
    });
  });

  app.delete('/projetos/:id', { preHandler: app.requireAdmin }, async (req) => {
    const { id } = req.params as { id: string };
    return prisma.projeto.delete({ where: { id } });
  });
}
