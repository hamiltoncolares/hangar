import { FastifyInstance } from 'fastify';
import { getPrisma } from '../db.js';

export async function clientesRoutes(app: FastifyInstance) {
  const prisma = getPrisma();

  app.get('/clientes', async (req) => {
    const { tier_id } = req.query as { tier_id?: string };
    return prisma.cliente.findMany({
      where: tier_id ? { tierId: tier_id } : undefined,
      orderBy: { nome: 'asc' }
    });
  });

  app.post('/clientes', async (req) => {
    const body = req.body as { tier_id?: string; nome?: string; logo_url?: string };
    if (!body?.tier_id) throw new Error('tier_id is required');
    if (!body?.nome) throw new Error('nome is required');
    return prisma.cliente.create({
      data: {
        tierId: body.tier_id,
        nome: body.nome,
        logoUrl: body.logo_url
      }
    });
  });

  app.get('/clientes/:id', async (req) => {
    const { id } = req.params as { id: string };
    return prisma.cliente.findUnique({ where: { id } });
  });

  app.patch('/clientes/:id', async (req) => {
    const { id } = req.params as { id: string };
    const body = req.body as { tier_id?: string; nome?: string; logo_url?: string };
    return prisma.cliente.update({
      where: { id },
      data: {
        tierId: body.tier_id,
        nome: body.nome,
        logoUrl: body.logo_url
      }
    });
  });

  app.delete('/clientes/:id', async (req) => {
    const { id } = req.params as { id: string };
    return prisma.cliente.delete({ where: { id } });
  });
}
