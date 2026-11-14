import { HttpError, isUuid, timestamp } from './validation';

type Cursor = { created_at: string; id: string };

export function encodeCursor(row: Cursor): string {
  return Buffer.from(JSON.stringify({ created_at: row.created_at, id: row.id })).toString('base64');
}

export function decodeCursor(value: unknown): Cursor {
  try {
    if (typeof value !== 'string' || !value || value.length > 1024) throw new Error();
    const bytes = Buffer.from(value, 'base64');
    if (bytes.toString('base64') !== value) throw new Error();
    const cursor = JSON.parse(bytes.toString('utf8'));
    if (!cursor || typeof cursor.created_at !== 'string' || typeof cursor.id !== 'string' ||
        !isUuid(cursor.id) || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{1,6}Z$/.test(cursor.created_at)) {
      throw new Error();
    }
    timestamp(cursor.created_at, 'cursor timestamp');
    return { created_at: cursor.created_at, id: cursor.id };
  } catch {
    throw new HttpError(400, 'Invalid cursor');
  }
}
