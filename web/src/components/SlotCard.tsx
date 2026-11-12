import type { Slot } from '../types'
import { providers } from '../mock/data'
import { isAvailable, isPast, longDate, time } from '../lib/format'
import { Icon } from './Icon'

export function SlotCard({ slot, selected, onSelect }: {
  slot: Slot; selected: boolean; onSelect: (slot: Slot) => void
}) {
  const provider = providers.find((person) => person.id === slot.providerId)!
  const available = isAvailable(slot)
  const status = isPast(slot) ? 'Past' : slot.status === 'booked' ? 'Booked' : 'Available'
  return <button type="button" id={slot.id} className={`slot-card ${selected ? 'is-selected' : ''}`}
    disabled={!available} aria-pressed={selected}
    aria-label={`${time(slot.startsAt)}, ${longDate(slot.startsAt)}, ${provider.name}, ${status}`}
    onClick={() => onSelect(slot)}>
    <span className="slot-time">{time(slot.startsAt)}{selected && <Icon name="check" size={15} />}</span>
    <span className="slot-provider">{provider.name}</span>
    <span className={`slot-status ${available ? 'available' : ''}`}>
      {available && <span className="status-dot" />}{selected ? 'Selected' : available ? `${slot.duration} min visit` : status}
    </span>
  </button>
}
