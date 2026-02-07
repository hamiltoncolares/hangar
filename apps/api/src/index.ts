import Fastify from 'fastify';
import cors from '@fastify/cors';
import { tiersRoutes } from './routes/tiers.js';
import { clientesRoutes } from './routes/clientes.js';
import { projetosRoutes } from './routes/projetos.js';
import { impostosRoutes } from './routes/impostos.js';
import { registrosRoutes } from './routes/registros.js';
import { dashboardRoutes } from './routes/dashboard.js';
import { exportRoutes } from './routes/export.js';

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

app.setErrorHandler((err, _req, reply) => {
  const statusCode = err.statusCode && err.statusCode >= 400 ? err.statusCode : 400;
  reply.status(statusCode).send({ error: err.message || 'error' });
});

app.get('/health', async () => ({ ok: true }));

app.register(tiersRoutes);
app.register(clientesRoutes);
app.register(projetosRoutes);
app.register(impostosRoutes);
app.register(registrosRoutes);
app.register(dashboardRoutes);
app.register(exportRoutes);

const port = Number(process.env.PORT || 3001);
const host = process.env.HOST || '0.0.0.0';

app.listen({ port, host }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});
