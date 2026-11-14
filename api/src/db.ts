import 'dotenv/config';
import { Pool, type PoolClient } from 'pg';

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Keep transaction ownership in one place: never send a response before COMMIT.
export async function transaction<T>(work: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await work(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function createSchema(): Promise<void> {
  await transaction(async (client) => {
    await client.query(`
      CREATE TABLE IF NOT EXISTS slots (
        id text PRIMARY KEY,
        provider text NOT NULL,
        start_at timestamptz NOT NULL,
        end_at timestamptz NOT NULL
      );
      CREATE TABLE IF NOT EXISTS bookings (
        id uuid PRIMARY KEY,
        slot_id text NOT NULL REFERENCES slots(id),
        name text NOT NULL,
        email text NOT NULL,
        status text NOT NULL CHECK (status IN ('confirmed', 'cancelled')),
        created_at timestamptz NOT NULL DEFAULT now()
      );
      -- Cancelled bookings may share a slot; only confirmed bookings are unique.
      CREATE UNIQUE INDEX IF NOT EXISTS bookings_confirmed_slot
        ON bookings(slot_id) WHERE status = 'confirmed';
      CREATE INDEX IF NOT EXISTS bookings_email_page
        ON bookings(lower(email), created_at, id);
      CREATE TABLE IF NOT EXISTS idempotency_keys (
        key text PRIMARY KEY,
        request_hash text NOT NULL,
        status_code int,
        response_body jsonb
      );
      CREATE TABLE IF NOT EXISTS booking_attempts (
        email text NOT NULL,
        attempted_at timestamptz NOT NULL
      );
      CREATE INDEX IF NOT EXISTS booking_attempts_email_time
        ON booking_attempts(email, attempted_at);
    `);
  });
}

// pg normally converts timestamptz to Date, losing microseconds. Preserve them
// in the API and cursor so pagination uses the exact database ordering key.
export const bookingColumns = `id, slot_id, name, email, status,
  to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS created_at`;
