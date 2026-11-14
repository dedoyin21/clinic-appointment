import 'dotenv/config';
import cors from 'cors';
import express, { type ErrorRequestHandler } from 'express';
import { createSchema, pool } from './db';
import { apiKey } from './middleware/apiKey';
import { bookings } from './routes/bookings';
import { reset } from './routes/reset';
import { slots } from './routes/slots';
import { HttpError } from './utils/validation';

export const app = express();
app.disable('x-powered-by');
// Browser preflights have no API key. All actual endpoint requests do.
app.use(cors({
  origin: '*',
  allowedHeaders: ['X-API-Key', 'Content-Type', 'Idempotency-Key'],
  exposedHeaders: ['Retry-After'],
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
}));
app.use(apiKey);
app.use(express.json({ limit: '1mb' }));
app.use('/reset', reset);
app.use('/slots', slots);
app.use('/bookings', bookings);
app.use((_req, res) => { res.status(404).json({ error: 'Route not found' }); });

const errors: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof HttpError) {
    res.status(error.status).json({ error: error.message });
  } else if (error.type === 'entity.parse.failed') {
    res.status(400).json({ error: 'Invalid JSON body' });
  } else if (error.status >= 400 && error.status < 500) {
    res.status(error.status).json({ error: error.status === 413 ? 'Request body too large' : 'Invalid request' });
  } else {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
app.use(errors);

async function start(): Promise<void> {
  if (!process.env.API_KEY?.trim()) throw new Error('API_KEY is required');
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
  const port = Number(process.env.PORT);
  if (!process.env.PORT || !Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be an integer from 1 to 65535');
  }
  // The server only accepts requests after the schema is ready.
  await createSchema();
  const server = app.listen(port, () => { console.log(`Clinic API listening on port ${port}`); });
  server.on('error', (error) => {
    console.error('Server failed:', error);
    void pool.end().finally(() => { process.exitCode = 1; });
  });
  for (const signal of ['SIGINT', 'SIGTERM'] as const) {
    process.once(signal, () => {
      server.close(() => { void pool.end(); });
    });
  }
}

if (require.main === module) {
  void start().catch(async (error) => {
    console.error('Startup failed:', error);
    await pool.end();
    process.exitCode = 1;
  });
}
