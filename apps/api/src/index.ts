import Fastify from 'fastify';
import { tiersRoutes } from './routes/tiers';
import { clientesRoutes } from './routes/clientes';
import { projetosRoutes } from './routes/projetos';
import { impostosRoutes } from './routes/impostos';
import { registrosRoutes } from './routes/registros';
import { dashboardRoutes } from './routes/dashboard';
import { exportRoutes } from './routes/export';

const app = Fastify({ logger: true });

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
