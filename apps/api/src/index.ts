import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { tiersRoutes } from './routes/tiers.js';
import { clientesRoutes } from './routes/clientes.js';
import { projetosRoutes } from './routes/projetos.js';
import { impostosRoutes } from './routes/impostos.js';
import { registrosRoutes } from './routes/registros.js';
import { dashboardRoutes } from './routes/dashboard.js';
import { exportRoutes } from './routes/export.js';
import { authRoutes } from './routes/auth.js';
import { adminRoutes } from './routes/admin.js';
import { goalsRoutes } from './routes/goals.js';
import { getPrisma } from './db.js';

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: (origin, cb) => {
    const allowed = [
      'http://localhost:5173',
      process.env.FRONTEND_URL
    ].filter(Boolean);
    if (!origin) return cb(null, true);
    if (allowed.includes(origin)) return cb(null, true);
    return cb(new Error('Not allowed'), false);
  }
});

await app.register(helmet, {
  contentSecurityPolicy: false
});

await app.register(rateLimit, {
  max: 300,
  timeWindow: '1 minute'
});

await app.register(jwt, {
  secret: process.env.JWT_SECRET || 'dev-secret'
});

const prisma = getPrisma();

app.decorate('authenticate', async (req: any, reply: any) => {
  try {
    await req.jwtVerify();
  } catch {
    reply.code(401).send({ error: 'unauthorized' });
    return;
  }

  const payload = req.user as { id?: string };
  if (!payload?.id) {
    reply.code(401).send({ error: 'unauthorized' });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.id },
    include: { tiers: true }
  });
  if (!user) {
    reply.code(401).send({ error: 'unauthorized' });
    return;
  }
  if (user.status !== 'active') {
    reply.code(403).send({ error: 'forbidden' });
    return;
  }

  req.user = {
    id: user.id,
    email: user.email,
    role: user.role,
    status: user.status,
    name: user.name
  };
  req.userTierIds = user.tiers.map((t) => t.tierId);
});

app.decorate('requireAdmin', async (req: any, reply: any) => {
  if (!req.user || req.user.role !== 'admin') {
    return reply.code(403).send({ error: 'forbidden' });
  }
});

app.setErrorHandler((err, _req, reply) => {
  const statusCode = err.statusCode && err.statusCode >= 400 ? err.statusCode : 400;
  reply.status(statusCode).send({ error: err.message || 'error' });
});

app.get('/health', async () => ({ ok: true }));

app.register(authRoutes);
app.register(adminRoutes);
app.register(tiersRoutes);
app.register(clientesRoutes);
app.register(projetosRoutes);
app.register(impostosRoutes);
app.register(registrosRoutes);
app.register(dashboardRoutes);
app.register(exportRoutes);
app.register(goalsRoutes);

const port = Number(process.env.PORT || 3001);
const host = process.env.HOST || '0.0.0.0';

app.listen({ port, host }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});
