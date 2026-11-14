# Clinic booking API

Node.js 22+, TypeScript, Express 5 and PostgreSQL. All database access uses `pg`
with parameterized raw SQL. No ORM or external rate-limit service.

## Run

From `api`, install dependencies, copy the environment template and edit `.env`:

```sh
npm install
cp env.exm .env
```

In PowerShell, use `Copy-Item env.exm .env`. If PowerShell blocks `npm.ps1`, use
`npm.cmd` for the npm commands below.

Set `DATABASE_URL` to an existing PostgreSQL database, `API_KEY` to your secret,
and `PORT` to the server port. For a local database with Docker:

```sh
docker run --name clinic-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=clinic -p 5432:5432 -d postgres:17
npm run dev
```

Startup creates the tables and indexes before listening. For compiled execution:

```sh
npm run build
npm start
```

`npm run typecheck` checks both the API and test scripts.

## Requests and curl examples

All endpoint requests require `X-API-Key`. Browser CORS preflight `OPTIONS`
requests are allowed without authentication. CORS allows every origin and the
`X-API-Key`, `Content-Type`, and `Idempotency-Key` headers, and exposes `Retry-After`.
Every error response has the shape `{"error":"message"}`.

These examples use Bash syntax. On Windows, run them in Git Bash/WSL or adapt the
variables and line continuations for PowerShell with `curl.exe`.

```sh
export BASE=http://localhost:3001
export API_KEY=replace-with-a-long-random-secret
```

### POST /reset

Clears bookings, idempotency keys, attempts and slots, and inserts the supplied
slots in one transaction. This is a destructive development/demo endpoint.
Past slots and an empty slots array are allowed. Timestamps need an explicit
timezone; each end must follow its start. Invalid input leaves existing data intact.

```sh
curl -X POST "$BASE/reset" \
  -H "X-API-Key: $API_KEY" -H 'Content-Type: application/json' \
  -d '{"slots":[{"id":"slot-1","provider":"Dr. Ada","start":"2099-01-01T09:00:00Z","end":"2099-01-01T09:30:00Z"},{"id":"slot-2","provider":"Dr. Ada","start":"2099-01-01T10:00:00Z","end":"2099-01-01T10:30:00Z"},{"id":"past-slot","provider":"Dr. Ben","start":"2020-01-01T09:00:00Z","end":"2020-01-01T09:30:00Z"}]}'
```

Returns `200 {"ok":true}`.

### GET /slots?provider=

Returns every slot in start order. `provider` is an optional exact-match filter.
`available` is true only for a future slot without a confirmed booking.
`start` and `end` are ISO UTC strings.

```sh
curl "$BASE/slots" -H "X-API-Key: $API_KEY"
curl -G "$BASE/slots" -H "X-API-Key: $API_KEY" --data-urlencode 'provider=Dr. Ada'
```

Returns `200 {"slots":[...]}`.

### POST /bookings

```sh
curl -i -X POST "$BASE/bookings" \
  -H "X-API-Key: $API_KEY" -H 'Content-Type: application/json' \
  -H 'Idempotency-Key: demo-booking-1' \
  -d '{"slot_id":"slot-1","name":" Ada Patient ","email":" ADA@example.com "}'
```

Returns `201` with `{id, slot_id, name, email, status, created_at}`. Save its `id`
for the next examples. The stored name is trimmed, and email is trimmed/lowercase.
Missing/invalid fields or a started slot return `400`; a missing slot returns
`404`; an already confirmed slot returns `409`.

Processing order:

1. Rate limit by normalized email when the body contains an email string.
2. Claim/replay the optional idempotency key.
3. Validate fields, find the slot, reject a started slot, and insert the booking.

At most five attempts are admitted per email per rolling 60 seconds. Validation
failures, missing slots, conflicts and idempotent retries count. The sixth returns
`429` and `Retry-After`, rounded up to whole seconds. Rejected `429` requests do
not extend the window. Other emails have independent limits. Unauthenticated or
unparseable JSON requests do not reach the booking limiter.

Repeating the same idempotency key and JSON body replays the stored status/body,
including the original booking id. JSON object property order does not matter;
different values (including whitespace in strings) return `422`. Keys are optional
and global to this API. Outcomes from validation onward, including `400`, `404`
and `409`, are cached. Rate-limit responses and unexpected server failures are
not cached. Rate limiting still runs before a replay.

### GET /bookings/:id

```sh
export BOOKING_ID='<id from POST /bookings>'
curl "$BASE/bookings/$BOOKING_ID" -H "X-API-Key: $API_KEY"
```

Returns `200` with the booking, or `404` if absent.

### DELETE /bookings/:id

```sh
curl -X DELETE "$BASE/bookings/$BOOKING_ID" -H "X-API-Key: $API_KEY"
```

Returns `200` with status `cancelled`. A second cancellation returns `409`;
a missing booking returns `404`. The slot can immediately be booked again.

### GET /bookings?email=&limit=&cursor=

```sh
curl -G "$BASE/bookings" -H "X-API-Key: $API_KEY" \
  --data-urlencode 'email=ADA@example.com' --data-urlencode 'limit=1'

# Copy next_cursor from the previous response, and URL-encode it:
export CURSOR='<next_cursor>'
curl -G "$BASE/bookings" -H "X-API-Key: $API_KEY" \
  --data-urlencode 'email=ada@example.com' --data-urlencode 'limit=1' \
  --data-urlencode "cursor=$CURSOR"
```

`email` is required and case-insensitive. `limit` is an integer from 1 through 50,
defaulting to 10. The response is `{"bookings":[...],"next_cursor":null}` on the
last page; otherwise `next_cursor` is an opaque base64 string. Send it unchanged
with the same email filter. Invalid limits/cursors return `400`. Both confirmed
and cancelled bookings appear, oldest first by `(created_at, id)`.

## Concurrency test

With the API running and `.env` configured:

```sh
npm run test:concurrency
```

**This test calls `/reset` and clears the database. Use a dedicated test database.**
It seeds one future slot, fires 20 simultaneous requests with distinct emails to
avoid hitting the per-email limit, and requires:

```text
201 Created: 1
409 Conflict: 19
```

It exits nonzero for any other result. Optionally set `BASE_URL` to target another
server; otherwise it uses `http://localhost:$PORT` (default `3001`).

## Walkthrough notes

- `src/index.ts`: middleware order, JSON errors and server startup.
- `src/db.ts`: schema, partial unique index, shared transaction helper.
- `src/middleware/rateLimit.ts`: transaction-level advisory lock per email,
  window cleanup/count/insert, independently committed before validation.
- `src/routes/bookings.ts`: insert-first idempotency, booking insertion and
  cancellation. A key and its completed response commit with the booking.
  Concurrent inserts of the same key wait for that transaction, then replay;
  a rollback releases the key for a retry. A savepoint recovers from the database
  unique violation so the `409` response can also be committed under its key.
- `src/utils/cursor.ts`: base64 cursor encoding/validation. Booking timestamps
  retain PostgreSQL microseconds to prevent skipped/duplicated pagination rows.

The locking behavior follows PostgreSQL's [advisory lock documentation](https://www.postgresql.org/docs/current/explicit-locking.html#ADVISORY-LOCKS)
and [INSERT / ON CONFLICT documentation](https://www.postgresql.org/docs/current/sql-insert.html).
