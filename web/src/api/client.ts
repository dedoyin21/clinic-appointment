import type { Booking, Slot } from '../types'

export type SlotResponse = { id: string; provider: string; start: string; end: string; available: boolean }
export type BookingResponse = {
  id: string; slot_id: string; name: string; email: string
  status: 'confirmed' | 'cancelled'; created_at: string
}
export type BookingInput = { slot_id: string; name: string; email: string }
export type BookingsPage = { bookings: Booking[]; next_cursor: string | null }
export const useMock = import.meta.env.VITE_USE_MOCK === 'true'
const baseUrl = (import.meta.env.VITE_API_URL ?? '').trim().replace(/\/+$/, '')
const apiKey = import.meta.env.VITE_API_KEY ?? ''
const cooldowns = new Map<string, number>()

export class ApiError extends Error {
  status: number
  retryAfter: number
  constructor(status: number, message: string, retryAfter = 0) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.retryAfter = retryAfter
  }
  get retryable() { return this.status === 0 || this.status >= 500 }
}

export function errorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) return 'We could not complete that request. Please check your connection and try again.'
  switch (error.status) {
    case 0: return error.message
    case 400:
      if (error.message.includes('already started')) return 'This appointment has already started. Please choose a later time.'
      if (error.message.includes('email')) return 'Please enter a valid email address so we can find your booking.'
      return 'Some appointment details need attention. Please review them and try again.'
    case 401: return 'The clinic connection needs attention. Please try again later.'
    case 404: return 'We could not find that appointment. It may have been removed or is no longer available.'
    case 409: return 'That appointment was just booked by someone else. Please choose another time.'
    case 422: return 'This booking request was already used with different details. Please start a new booking.'
    case 429: return `You have reached the booking limit. Please wait ${error.retryAfter} second${error.retryAfter === 1 ? '' : 's'} before trying again.`
    default: return error.status >= 500
      ? 'The clinic service is having trouble right now. Please try again in a moment.'
      : 'We could not complete that request. Please review your details and try again.'
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers)
  headers.set('X-API-Key', apiKey)
  headers.set('Accept', 'application/json')
  headers.set('Content-Type', 'application/json')
  let response: Response
  try {
    if (useMock) {
      const { mockRequest } = await import('../mock/api')
      response = await mockRequest(path, { ...options, headers })
    } else {
      if (!baseUrl) throw new ApiError(0, 'Set VITE_API_URL, or enable VITE_USE_MOCK=true, then restart Vite.')
      response = await fetch(`${baseUrl}${path}`, { ...options, headers })
    }
  } catch (error) {
    if (options.signal?.aborted || error instanceof ApiError) throw error
    throw new ApiError(0, 'We couldn’t reach the clinic. Check your connection and retry.')
  }
  const data: unknown = await response.json().catch(() => null)
  if (!response.ok) {
    const message = data && typeof data === 'object' && 'error' in data && typeof data.error === 'string'
      ? data.error : 'The request could not be completed.'
    const header = response.headers.get('Retry-After') ?? ''
    throw new ApiError(response.status, message, /^\d+$/.test(header) ? Number(header) : 1)
  }
  if (data === null) throw new ApiError(502, 'The clinic returned an invalid response.')
  return data as T
}

function slotFromResponse(slot: SlotResponse): Slot {
  return {
    id: slot.id, providerId: slot.provider, startsAt: slot.start,
    duration: (new Date(slot.end).getTime() - new Date(slot.start).getTime()) / 60000,
    status: slot.available ? 'available' : 'booked',
  }
}
function bookingFromResponse(booking: BookingResponse): Booking {
  return {
    id: booking.id, reference: booking.id, slotId: booking.slot_id, name: booking.name,
    email: booking.email, status: booking.status, createdAt: booking.created_at,
  }
}

export const api = {
  async getSlots(provider?: string, signal?: AbortSignal): Promise<Slot[]> {
    const query = provider === undefined ? '' : `?${new URLSearchParams({ provider })}`
    const data = await request<{ slots: SlotResponse[] }>(`/slots${query}`, { signal })
    return data.slots.map(slotFromResponse)
  },
  async createBooking(body: BookingInput, key: string): Promise<Booking> {
    const email = body.email.toLowerCase()
    const remaining = Math.ceil(((cooldowns.get(email) ?? 0) - Date.now()) / 1000)
    if (remaining > 0) throw new ApiError(429, 'Please wait before trying again.', remaining)
    try {
      return bookingFromResponse(await request<BookingResponse>('/bookings', {
        method: 'POST', headers: { 'Idempotency-Key': key }, body: JSON.stringify(body),
      }))
    } catch (error) {
      if (error instanceof ApiError && error.status === 429) cooldowns.set(email, Date.now() + error.retryAfter * 1000)
      throw error
    }
  },
  async getBooking(id: string, signal?: AbortSignal): Promise<Booking> {
    return bookingFromResponse(await request<BookingResponse>(`/bookings/${encodeURIComponent(id)}`, { signal }))
  },
  async cancelBooking(id: string): Promise<Booking> {
    return bookingFromResponse(await request<BookingResponse>(`/bookings/${encodeURIComponent(id)}`, { method: 'DELETE' }))
  },
  async getBookings(email: string, cursor?: string, signal?: AbortSignal): Promise<BookingsPage> {
    const query = new URLSearchParams({ email, limit: '3' })
    if (cursor !== undefined) query.set('cursor', cursor)
    const data = await request<{ bookings: BookingResponse[]; next_cursor: string | null }>(`/bookings?${query}`, { signal })
    return { bookings: data.bookings.map(bookingFromResponse), next_cursor: data.next_cursor }
  },
}
