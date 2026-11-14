export class HttpError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
  }
}

export function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new HttpError(400, 'Body must be a JSON object');
  }
  return value as Record<string, unknown>;
}

export function requiredString(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new HttpError(400, `${field} is required and must be a non-empty string`);
  }
  return value.trim();
}

export function bookingInput(body: unknown) {
  const input = object(body);
  const slot_id = requiredString(input.slot_id, 'slot_id');
  const name = requiredString(input.name, 'name');
  const email = requiredString(input.email, 'email').toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new HttpError(400, 'email is invalid');
  }
  return { slot_id, name, email };
}

export function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

export function timestamp(value: unknown, field: string): Date {
  if (typeof value !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|[+-]\d{2}:\d{2})$/.test(value)) {
    throw new HttpError(400, `${field} must be an ISO timestamp with a timezone`);
  }
  const date = new Date(value);
  // Date accepts February 30 by rolling into March; reject such input explicitly.
  const day = Number(value.slice(8, 10));
  const daysInMonth = new Date(Date.UTC(Number(value.slice(0, 4)), Number(value.slice(5, 7)), 0)).getUTCDate();
  if (!Number.isFinite(date.getTime()) || day < 1 || day > daysInMonth || value.slice(11, 13) === '24') {
    throw new HttpError(400, `${field} is invalid`);
  }
  return date;
}
