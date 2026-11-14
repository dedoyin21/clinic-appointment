import { createHash, randomUUID } from 'node:crypto';
import { Router } from 'express';
import type { PoolClient } from 'pg';
import { bookingColumns, pool, transaction } from '../db';
import { rateLimit } from '../middleware/rateLimit';
import { decodeCursor, encodeCursor } from '../utils/cursor';
import { bookingInput, HttpError, isUuid, requiredString } from '../utils/validation';

export const bookings = Router();
type Reply = { status: number; body: Record<string, unknown> };

async function createBooking(client: PoolClient, body: unknown): Promise<Reply> {
  const input = bookingInput(body);
  const { rows: [slot] } = await client.query(`
    SELECT start_at <= clock_timestamp() AS started FROM slots WHERE id = $1 FOR SHARE`, [input.slot_id]);
  if (!slot) throw new HttpError(404, 'Slot not found');
  if (slot.started) throw new HttpError(400, 'Slot has already started');

  // No check for an existing booking: the partial unique index arbitrates races.
  // A savepoint lets us store a 409 response without aborting the key transaction.
  await client.query('SAVEPOINT booking_insert');
  try {
    const { rows: [booking] } = await client.query(`
      INSERT INTO bookings(id, slot_id, name, email, status)
      VALUES ($1, $2, $3, $4, 'confirmed') RETURNING ${bookingColumns}`,
    [randomUUID(), input.slot_id, input.name, input.email]);
    return { status: 201, body: booking };
  } catch (error) {
    await client.query('ROLLBACK TO SAVEPOINT booking_insert');
    if ((error as { code?: string; constraint?: string }).code === '23505' &&
        (error as { constraint?: string }).constraint === 'bookings_confirmed_slot') {
      throw new HttpError(409, 'Slot is already booked');
    }
    throw error;
  }
}

// Hash the parsed body with sorted object keys, so JSON property order does not
// change a request's identity. Array order and all supplied values still matter.
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${canonical(record[key])}`).join(',')}}`;
  }
  return JSON.stringify(value) ?? 'null';
}

bookings.post('/', rateLimit, async (req, res) => {
  const key = req.get('Idempotency-Key');
  if (key !== undefined && !key.trim()) throw new HttpError(400, 'Idempotency-Key must not be empty');
  const hash = createHash('sha256').update(canonical(req.body)).digest('hex');
  const reply = await transaction(async (client): Promise<Reply> => {
    if (key !== undefined) {
      // An uncommitted key blocks competing inserts here until its owner commits
      // the booking AND response, or rolls back. There is no committed placeholder.
      const inserted = await client.query(`
        INSERT INTO idempotency_keys(key, request_hash) VALUES ($1, $2)
        ON CONFLICT (key) DO NOTHING RETURNING key`, [key, hash]);
      if (inserted.rowCount === 0) {
        const { rows: [saved] } = await client.query(
          'SELECT request_hash, status_code, response_body FROM idempotency_keys WHERE key = $1', [key]);
        if (saved && saved.request_hash !== hash) throw new HttpError(422, 'Idempotency-Key was used with a different body');
        if (!saved || saved.status_code === null || saved.response_body === null) {
          // Defensive handling for a placeholder written outside this API.
          throw new HttpError(409, 'Idempotent request is still in progress; retry shortly');
        }
        return { status: saved.status_code, body: saved.response_body };
      }
    }

    let result: Reply;
    try {
      result = await createBooking(client, req.body);
    } catch (error) {
      if (!(error instanceof HttpError)) throw error;
      result = { status: error.status, body: { error: error.message } };
    }
    if (key !== undefined) {
      await client.query(`UPDATE idempotency_keys SET status_code = $2, response_body = $3::jsonb WHERE key = $1`,
        [key, result.status, JSON.stringify(result.body)]);
    }
    return result;
  });
  res.status(reply.status).json(reply.body);
});

bookings.get('/', async (req, res) => {
  const email = requiredString(req.query.email, 'email').toLowerCase();
  const limitValue = req.query.limit;
  if (limitValue !== undefined && (typeof limitValue !== 'string' || !/^(?:[1-9]|[1-4][0-9]|50)$/.test(limitValue))) {
    throw new HttpError(400, 'limit must be an integer from 1 to 50');
  }
  const limit = limitValue === undefined ? 10 : Number(limitValue);
  const cursor = req.query.cursor === undefined ? null : decodeCursor(req.query.cursor);
  const { rows } = await pool.query(`
    SELECT ${bookingColumns} FROM bookings
    WHERE lower(email) = $1 AND ($2::timestamptz IS NULL OR (created_at, id) > ($2::timestamptz, $3::uuid))
    ORDER BY created_at, id LIMIT $4`, [email, cursor?.created_at ?? null, cursor?.id ?? null, limit + 1]);
  const page = rows.slice(0, limit);
  res.json({ bookings: page, next_cursor: rows.length > limit ? encodeCursor(page[page.length - 1]) : null });
});

bookings.get('/:id', async (req, res) => {
  if (!isUuid(req.params.id)) throw new HttpError(404, 'Booking not found');
  const { rows: [booking] } = await pool.query(`SELECT ${bookingColumns} FROM bookings WHERE id = $1`, [req.params.id]);
  if (!booking) throw new HttpError(404, 'Booking not found');
  res.json(booking);
});

bookings.delete('/:id', async (req, res) => {
  if (!isUuid(req.params.id)) throw new HttpError(404, 'Booking not found');
  const booking = await transaction(async (client) => {
    // Serialize concurrent cancellations so exactly one can change the status.
    const { rows: [existing] } = await client.query('SELECT status FROM bookings WHERE id = $1 FOR UPDATE', [req.params.id]);
    if (!existing) throw new HttpError(404, 'Booking not found');
    if (existing.status === 'cancelled') throw new HttpError(409, 'Booking is already cancelled');
    const { rows: [updated] } = await client.query(`
      UPDATE bookings SET status = 'cancelled' WHERE id = $1 RETURNING ${bookingColumns}`, [req.params.id]);
    return updated;
  });
  res.json(booking);
});
