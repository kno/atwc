
import Fastify from 'fastify';
import fastifyCors from '@fastify/cors';
import health from './routes/health.js';
import searchRoute from './routes/search.js';

const app = Fastify({ logger: true });

await app.register(fastifyCors, { origin: true });

app.register(health);
app.register(searchRoute);

const port = Number(process.env.PORT || 3000);
app.listen({ port, host: '0.0.0.0' }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});
