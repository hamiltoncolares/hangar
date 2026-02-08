import { FastifyInstance } from 'fastify';
import { getPrisma } from '../db.js';

export async function tiersRoutes(app: FastifyInstance) {
  const prisma = getPrisma();

  app.get('/tiers', async () => prisma.tier.findMany({ orderBy: { nome: 'asc' } }));

  app.post('/tiers', async (req) => {
    const body = req.body as { nome?: string; margin_meta?: number };
    if (!body?.nome) throw new Error('nome is required');
    return prisma.tier.create({ data: { nome: body.nome, marginMeta: body.margin_meta ?? null } });
  });

  app.get('/tiers/:id', async (req) => {
    const { id } = req.params as { id: string };
    return prisma.tier.findUnique({ where: { id } });
  });

  app.patch('/tiers/:id', async (req) => {
    const { id } = req.params as { id: string };
    const body = req.body as { nome?: string; margin_meta?: number };
    return prisma.tier.update({ where: { id }, data: { nome: body.nome, marginMeta: body.margin_meta } });
  });

  app.delete('/tiers/:id', async (req) => {
    const { id } = req.params as { id: string };
    return prisma.tier.delete({ where: { id } });
  });
}
