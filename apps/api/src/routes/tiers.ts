import { FastifyInstance } from 'fastify';
import { getPrisma } from '../db.js';

export async function tiersRoutes(app: FastifyInstance) {
  const prisma = getPrisma();

  app.addHook('preHandler', app.authenticate);

  app.get('/tiers', async (req) => {
    if (req.user?.role === 'admin') {
      return prisma.tier.findMany({ orderBy: { nome: 'asc' } });
    }
    const tierIds = req.userTierIds ?? [];
    if (!tierIds.length) return [];
    return prisma.tier.findMany({ where: { id: { in: tierIds } }, orderBy: { nome: 'asc' } });
  });

  app.post('/tiers', { preHandler: app.requireAdmin }, async (req) => {
    const body = req.body as { nome?: string; margin_meta?: number };
    if (!body?.nome) throw new Error('nome is required');
    return prisma.tier.create({ data: { nome: body.nome, marginMeta: body.margin_meta ?? null } });
  });

  app.get('/tiers/:id', async (req) => {
    const { id } = req.params as { id: string };
    if (req.user?.role !== 'admin' && !(req.userTierIds ?? []).includes(id)) {
      throw new Error('forbidden');
    }
    return prisma.tier.findUnique({ where: { id } });
  });

  app.patch('/tiers/:id', { preHandler: app.requireAdmin }, async (req) => {
    const { id } = req.params as { id: string };
    const body = req.body as { nome?: string; margin_meta?: number };
    return prisma.tier.update({ where: { id }, data: { nome: body.nome, marginMeta: body.margin_meta } });
  });

  app.delete('/tiers/:id', { preHandler: app.requireAdmin }, async (req) => {
    const { id } = req.params as { id: string };
    return prisma.tier.delete({ where: { id } });
  });
}
