import type { Provider, Slot } from '../types'

// Provider IDs in the view model are exact API provider names.
export function providerFor(slot: Slot): Provider {
  const name = slot.providerId
  const parts = name.replace(/^dr\.?\s+/i, '').trim().split(/\s+/)
  return { id: name, name, initials: parts.slice(0, 2).map(part => part[0] ?? '').join('').toUpperCase(), specialty: 'Clinic appointment' }
}
