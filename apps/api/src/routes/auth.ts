import { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import { getPrisma } from '../db.js';

export async function authRoutes(app: FastifyInstance) {
  const prisma = getPrisma();
  const MAX_ATTEMPTS = 5;
  const LOCK_MINUTES = 15;

  app.post('/auth/signup', { config: { rateLimit: { max: 5, timeWindow: '1 minute' } } }, async (req) => {
    const body = req.body as { email?: string; password?: string; name?: string };
    if (!body?.email) throw new Error('email is required');
    if (!body?.password) throw new Error('password is required');

    const email = body.email.trim().toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new Error('email já cadastrado');

    const count = await prisma.user.count();
    const isFirst = count === 0;
    const passwordHash = await bcrypt.hash(body.password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        name: body.name?.trim() || null,
        passwordHash,
        role: isFirst ? 'admin' : 'user',
        status: isFirst ? 'active' : 'pending'
      }
    });

    return {
      ok: true,
      user: { id: user.id, email: user.email, role: user.role, status: user.status, name: user.name }
    };
  });

  app.post('/auth/login', { config: { rateLimit: { max: 10, timeWindow: '1 minute' } } }, async (req) => {
    const body = req.body as { email?: string; password?: string };
    if (!body?.email) throw new Error('email is required');
    if (!body?.password) throw new Error('password is required');

    const email = body.email.trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error('credenciais inválidas');

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new Error('usuário bloqueado temporariamente');
    }

    const ok = await bcrypt.compare(body.password, user.passwordHash);
    if (!ok) {
      const attempts = user.failedLoginAttempts + 1;
      const updates: any = { failedLoginAttempts: attempts };
      if (attempts >= MAX_ATTEMPTS) {
        updates.lockedUntil = new Date(Date.now() + LOCK_MINUTES * 60 * 1000);
      }
      await prisma.user.update({ where: { id: user.id }, data: updates });
      throw new Error('credenciais inválidas');
    }
    if (user.status !== 'active') throw new Error('usuário pendente de aprovação');

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date(), failedLoginAttempts: 0, lockedUntil: null }
    });

    const token = app.jwt.sign({ id: user.id });
    return {
      token,
      user: { id: user.id, email: user.email, role: user.role, status: user.status, name: user.name }
    };
  });

  app.get('/auth/me', { preHandler: app.authenticate }, async (req) => {
    return { user: req.user };
  });
}
