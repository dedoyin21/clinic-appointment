import { Router } from 'express';
import { transaction } from '../db';
import { HttpError, object, requiredString, timestamp } from '../utils/validation';

export const reset = Router();

reset.post('/', async (req, res) => {
  const input = object(req.body);
  if (!Array.isArray(input.slots)) throw new HttpError(400, 'slots must be an array');
  const ids = new Set<string>();
  const slots = input.slots.map((value) => {
    const slot = object(value);
    const id = requiredString(slot.id, 'id');
    const provider = requiredString(slot.provider, 'provider');
    const start = timestamp(slot.start, 'start');
    const end = timestamp(slot.end, 'end');
    if (end <= start) throw new HttpError(400, 'end must be after start');
    if (ids.has(id)) throw new HttpError(400, 'Slot ids must be unique');
    ids.add(id);
    return { id, provider, start, end };
  });

  await transaction(async (client) => {
    await client.query('DELETE FROM bookings');
    await client.query('DELETE FROM idempotency_keys');
    await client.query('DELETE FROM booking_attempts');
    await client.query('DELETE FROM slots');
    for (const slot of slots) {
      await client.query('INSERT INTO slots(id, provider, start_at, end_at) VALUES ($1, $2, $3, $4)',
        [slot.id, slot.provider, slot.start, slot.end]);
    }
  });
  res.json({ ok: true });
});
