import type { Slot } from '../types'

export const timeZone = 'Africa/Lagos'
export const formatDate = (value: string, options: Intl.DateTimeFormatOptions = {}) =>
  new Intl.DateTimeFormat('en-GB', { timeZone, ...options }).format(new Date(value))
export const dateKey = (value: string) => formatDate(value, { year: 'numeric', month: '2-digit', day: '2-digit' })
export const longDate = (value: string) => formatDate(value, { weekday: 'long', day: 'numeric', month: 'long' })
export const time = (value: string) => formatDate(value, { hour: 'numeric', minute: '2-digit', hour12: true })
export const isPast = (slot: Slot) => slot.status === 'past' || new Date(slot.startsAt).getTime() <= Date.now()
export const isAvailable = (slot: Slot) => slot.status === 'available' && !isPast(slot)
export const emailError = (email: string) => !email.trim() ? 'Enter your email address.'
  : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ? 'Enter a valid email, such as alex@example.com.' : ''
export const pause = (ms = 650) => new Promise<void>((resolve) => window.setTimeout(resolve, ms))
