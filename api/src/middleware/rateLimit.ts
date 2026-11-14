import type { RequestHandler } from 'express';
import { transaction } from '../db';

export const rateLimit: RequestHandler = async (req, res, next) => {
  if (typeof req.body?.email !== 'string') {
    next();
    return;
  }
  const email = req.body.email.trim().toLowerCase();
  const retryAfter = await transaction(async (client) => {
    // The lock works across processes. Hash collisions only serialize unrelated
    // emails: every query still filters by the actual email.
    await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', [email]);
    // Read the clock AFTER waiting for the lock; now() is transaction-start time.
    const { rows: [clock] } = await client.query('SELECT clock_timestamp()::text AS at');
    const at: string = clock.at;
    await client.query(`DELETE FROM booking_attempts
      WHERE email = $1 AND attempted_at <= $2::timestamptz - interval '60 seconds'`, [email, at]);
    const { rows: [window] } = await client.query(`
      SELECT count(*)::int AS count,
        greatest(1, ceil(extract(epoch FROM
          min(attempted_at) + interval '60 seconds' - $2::timestamptz)))::int AS retry_after
      FROM booking_attempts WHERE email = $1`, [email, at]);
    if (window.count >= 5) return window.retry_after as number;
    await client.query('INSERT INTO booking_attempts(email, attempted_at) VALUES ($1, $2)', [email, at]);
    return null;
  });

  // Commit independently of the booking: validation errors still count.
  if (retryAfter !== null) {
    res.set('Retry-After', String(retryAfter)).status(429).json({ error: 'Too many booking attempts' });
    return;
  }
  next();
};
