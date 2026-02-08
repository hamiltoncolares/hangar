import { FastifyInstance } from 'fastify';
import { getPrisma } from '../db.js';

export async function clientesRoutes(app: FastifyInstance) {
  const prisma = getPrisma();

  app.addHook('preHandler', app.authenticate);

  app.get('/clientes', async (req) => {
    const { tier_id } = req.query as { tier_id?: string };
    if (req.user?.role !== 'admin') {
      const allowed = req.userTierIds ?? [];
      const targetTier = tier_id ? [tier_id] : allowed;
      const filtered = targetTier.filter((t) => allowed.includes(t));
      if (!filtered.length) return [];
      return prisma.cliente.findMany({
        where: { tierId: { in: filtered } },
        orderBy: { nome: 'asc' }
      });
    }
    return prisma.cliente.findMany({
      where: tier_id ? { tierId: tier_id } : undefined,
      orderBy: { nome: 'asc' }
    });
  });

  app.post('/clientes', { preHandler: app.requireAdmin }, async (req) => {
    const body = req.body as { tier_id?: string; nome?: string; logo_url?: string; margin_meta?: number };
    if (!body?.tier_id) throw new Error('tier_id is required');
    if (!body?.nome) throw new Error('nome is required');
    return prisma.cliente.create({
      data: {
        tierId: body.tier_id,
        nome: body.nome,
        logoUrl: body.logo_url,
        marginMeta: body.margin_meta ?? null
      }
    });
  });

  app.get('/clientes/:id', async (req) => {
    const { id } = req.params as { id: string };
    if (req.user?.role !== 'admin') {
      const allowed = req.userTierIds ?? [];
      const cliente = await prisma.cliente.findUnique({ where: { id } });
      if (!cliente || !allowed.includes(cliente.tierId)) throw new Error('forbidden');
    }
    return prisma.cliente.findUnique({ where: { id } });
  });

  app.patch('/clientes/:id', { preHandler: app.requireAdmin }, async (req) => {
    const { id } = req.params as { id: string };
    const body = req.body as { tier_id?: string; nome?: string; logo_url?: string; margin_meta?: number };
    return prisma.cliente.update({
      where: { id },
      data: {
        tierId: body.tier_id,
        nome: body.nome,
        logoUrl: body.logo_url,
        marginMeta: body.margin_meta
      }
    });
  });

  app.delete('/clientes/:id', { preHandler: app.requireAdmin }, async (req) => {
    const { id } = req.params as { id: string };
    return prisma.cliente.delete({ where: { id } });
  });
}
