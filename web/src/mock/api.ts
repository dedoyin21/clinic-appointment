import type { BookingInput, BookingResponse, SlotResponse } from '../api/client'
import { initialBookings, initialSlots, providers } from './data'

const slots: SlotResponse[] = initialSlots.map(slot => ({
  id: slot.id, provider: providers.find(person => person.id === slot.providerId)!.name,
  start: slot.startsAt, end: new Date(new Date(slot.startsAt).getTime() + slot.duration * 60000).toISOString(),
  available: slot.status === 'available',
}))
const bookings: BookingResponse[] = initialBookings.map(booking => ({
  id: booking.reference, slot_id: booking.slotId, name: booking.name, email: booking.email,
  status: booking.status, created_at: booking.createdAt,
}))
const attempts = new Map<string, { body: string; booking: BookingResponse }>()
const cursors = new Map<string, { email: string; offset: number }>()
const response = (data: unknown, status = 200) => new Response(JSON.stringify(data), {
  status, headers: { 'Content-Type': 'application/json' },
})
const failure = (message: string, status: number) => response({ error: message }, status)

export async function mockRequest(path: string, options: RequestInit): Promise<Response> {
  await new Promise<void>((resolve, reject) => {
    if (options.signal?.aborted) { reject(options.signal.reason); return }
    const abort = () => { window.clearTimeout(timer); reject(options.signal?.reason) }
    const timer = window.setTimeout(() => { options.signal?.removeEventListener('abort', abort); resolve() }, 450)
    options.signal?.addEventListener('abort', abort, { once: true })
  })
  const url = new URL(path, 'https://mock.invalid')
  const method = options.method ?? 'GET'
  if (url.pathname === '/slots' && method === 'GET') {
    const provider = url.searchParams.get('provider')
    return response({ slots: slots.filter(slot => provider === null || slot.provider === provider) })
  }
  if (url.pathname === '/bookings' && method === 'POST') {
    const body = JSON.parse(String(options.body)) as BookingInput
    const key = new Headers(options.headers).get('Idempotency-Key') ?? ''
    const serialized = JSON.stringify(body)
    const previous = attempts.get(key)
    if (previous) return previous.body === serialized ? response(previous.booking, 201) : failure('This attempt was used with different details.', 422)
    if (!key || !body.slot_id || !body.name?.trim() || !body.email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
      return failure('Enter a name, a valid email, and an appointment time.', 400)
    }
    const slot = slots.find(item => item.id === body.slot_id)
    if (!slot) return failure('Appointment not found.', 404)
    if (new Date(slot.start).getTime() <= Date.now()) return failure('This appointment has already started.', 400)
    if (!slot.available) return failure('Appointment unavailable.', 409)
    const booking: BookingResponse = { id: crypto.randomUUID(), ...body, status: 'confirmed', created_at: new Date().toISOString() }
    slot.available = false
    bookings.push(booking)
    attempts.set(key, { body: serialized, booking: { ...booking } })
    return response(booking, 201)
  }
  if (url.pathname === '/bookings' && method === 'GET') {
    const email = url.searchParams.get('email')?.trim().toLowerCase() ?? ''
    const limit = Number(url.searchParams.get('limit') ?? 10)
    const cursor = url.searchParams.get('cursor')
    const page = cursor === null ? { email, offset: 0 } : cursors.get(cursor)
    if (!email || !Number.isInteger(limit) || limit < 1 || limit > 50 || !page || page.email !== email) {
      return failure('Enter an email and valid pagination parameters.', 400)
    }
    const results = bookings.filter(booking => booking.email.toLowerCase() === email)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    const next = page.offset + limit
    const token = next < results.length ? crypto.randomUUID() : null
    if (token) cursors.set(token, { email, offset: next })
    return response({ bookings: results.slice(page.offset, next), next_cursor: token })
  }
  const match = /^\/bookings\/([^/]+)$/.exec(url.pathname)
  if (match) {
    const booking = bookings.find(item => item.id === decodeURIComponent(match[1]))
    if (!booking) return failure('Booking not found.', 404)
    if (method === 'GET') return response(booking)
    if (method === 'DELETE') {
      if (booking.status === 'cancelled') return failure('Booking unavailable.', 409)
      booking.status = 'cancelled'
      const slot = slots.find(item => item.id === booking.slot_id)
      if (slot) slot.available = true
      return response(booking)
    }
  }
  return failure('Not found.', 404)
}
