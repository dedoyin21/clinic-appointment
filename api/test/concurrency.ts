import 'dotenv/config';

const base = (process.env.BASE_URL ?? `http://localhost:${process.env.PORT ?? '3001'}`).replace(/\/$/, '');
const headers = { 'X-API-Key': process.env.API_KEY ?? '', 'Content-Type': 'application/json' };

async function main(): Promise<void> {
  if (!headers['X-API-Key']) throw new Error('API_KEY is required');
  // This test owns its fixture: /reset clears the database. Use a test database.
  const start = new Date(Date.now() + 3_600_000).toISOString();
  const end = new Date(Date.now() + 7_200_000).toISOString();
  const reset = await fetch(`${base}/reset`, {
    method: 'POST', headers,
    body: JSON.stringify({ slots: [{ id: 'race-slot', provider: 'Dr. Race', start, end }] }),
  });
  if (!reset.ok) throw new Error(`Reset failed (${reset.status}): ${await reset.text()}`);

  // Distinct emails isolate slot contention from the per-email rate limiter.
  // No idempotency key: these are 20 independent booking attempts.
  const statuses = await Promise.all(Array.from({ length: 20 }, async (_, i) => {
    const response = await fetch(`${base}/bookings`, {
      method: 'POST', headers,
      body: JSON.stringify({ slot_id: 'race-slot', name: `Patient ${i}`, email: `race-${i}@example.com` }),
    });
    await response.arrayBuffer();
    return response.status;
  }));
  const created = statuses.filter((status) => status === 201).length;
  const conflicts = statuses.filter((status) => status === 409).length;
  console.log(`201 Created: ${created}`);
  console.log(`409 Conflict: ${conflicts}`);
  if (created !== 1 || conflicts !== 19) {
    throw new Error(`Expected 1 creation and 19 conflicts; received ${JSON.stringify(statuses)}`);
  }
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
