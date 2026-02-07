import { FastifyInstance } from 'fastify';
import { getPrisma } from '../db.js';

export async function projetosRoutes(app: FastifyInstance) {
  const prisma = getPrisma();

  app.get('/projetos', async (req) => {
    const { cliente_id } = req.query as { cliente_id?: string };
    return prisma.projeto.findMany({
      where: cliente_id ? { clienteId: cliente_id } : undefined,
      orderBy: { nome: 'asc' }
    });
  });

  app.post('/projetos', async (req) => {
    const body = req.body as { cliente_id?: string; nome?: string; status?: string };
    if (!body?.cliente_id) throw new Error('cliente_id is required');
    if (!body?.nome) throw new Error('nome is required');
    return prisma.projeto.create({
      data: {
        clienteId: body.cliente_id,
        nome: body.nome,
        status: body.status ?? 'ativo'
      }
    });
  });

  app.get('/projetos/:id', async (req) => {
    const { id } = req.params as { id: string };
    return prisma.projeto.findUnique({ where: { id } });
  });

  app.patch('/projetos/:id', async (req) => {
    const { id } = req.params as { id: string };
    const body = req.body as { cliente_id?: string; nome?: string; status?: string };
    return prisma.projeto.update({
      where: { id },
      data: {
        clienteId: body.cliente_id,
        nome: body.nome,
        status: body.status
      }
    });
  });

  app.delete('/projetos/:id', async (req) => {
    const { id } = req.params as { id: string };
    return prisma.projeto.delete({ where: { id } });
  });
}
