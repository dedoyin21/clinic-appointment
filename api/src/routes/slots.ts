import { Router } from 'express';
import { pool } from '../db';
import { HttpError } from '../utils/validation';

export const slots = Router();

slots.get('/', async (req, res) => {
  const provider = req.query.provider;
  if (provider !== undefined && typeof provider !== 'string') {
    throw new HttpError(400, 'provider must be a string');
  }
  const { rows } = await pool.query(`
    SELECT s.id, s.provider, s.start_at AS start, s.end_at AS "end",
      (s.start_at > clock_timestamp() AND NOT EXISTS (
        SELECT 1 FROM bookings b WHERE b.slot_id = s.id AND b.status = 'confirmed'
      )) AS available
    FROM slots s WHERE ($1::text IS NULL OR s.provider = $1)
    ORDER BY s.start_at, s.id`, [provider ?? null]);
  res.json({ slots: rows }); // pg Dates serialize as ISO UTC strings.
});
