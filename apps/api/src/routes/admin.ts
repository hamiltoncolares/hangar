import { FastifyInstance } from 'fastify';
import { getPrisma } from '../db.js';

export async function adminRoutes(app: FastifyInstance) {
  const prisma = getPrisma();

  app.addHook('preHandler', app.authenticate);
  app.addHook('preHandler', app.requireAdmin);

  app.get('/admin/users', async () => {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        tiers: { include: { tier: true } }
      }
    });

    return users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      status: u.status,
      createdAt: u.createdAt,
      tiers: u.tiers.map((t) => ({ id: t.tierId, nome: t.tier.nome }))
    }));
  });

  app.post('/admin/users/:id/approve', async (req) => {
    const { id } = req.params as { id: string };
    const updated = await prisma.user.update({
      where: { id },
      data: { status: 'active' }
    });

    await prisma.auditLog.create({
      data: {
        actorId: req.user!.id,
        targetUserId: id,
        action: 'approve_user'
      }
    });

    return { ok: true, user: { id: updated.id, status: updated.status } };
  });

  app.post('/admin/users/:id/promote', async (req) => {
    const { id } = req.params as { id: string };
    const updated = await prisma.user.update({
      where: { id },
      data: { role: 'admin' }
    });

    await prisma.auditLog.create({
      data: {
        actorId: req.user!.id,
        targetUserId: id,
        action: 'promote_admin'
      }
    });

    return { ok: true, user: { id: updated.id, role: updated.role } };
  });

  app.put('/admin/users/:id/tiers', async (req) => {
    const { id } = req.params as { id: string };
    const body = req.body as { tier_ids?: string[] };
    const tierIds = Array.isArray(body.tier_ids) ? body.tier_ids : [];

    await prisma.$transaction([
      prisma.userTier.deleteMany({ where: { userId: id } }),
      prisma.userTier.createMany({
        data: tierIds.map((tierId) => ({ userId: id, tierId }))
      })
    ]);

    await prisma.auditLog.create({
      data: {
        actorId: req.user!.id,
        targetUserId: id,
        action: 'set_user_tiers',
        metadata: { tierIds }
      }
    });

    return { ok: true };
  });
}
