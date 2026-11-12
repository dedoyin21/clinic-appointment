import type { Slot } from '../types'
import { dateKey, formatDate, isAvailable, longDate } from '../lib/format'
import { SlotCard } from './SlotCard'
import { EmptyState } from './EmptyState'
import { Icon } from './Icon'
export function SlotGrid({ slots, selected, onSelect }: {
  slots: Slot[]; selected: string | undefined; onSelect: (slot: Slot) => void
}) {
  const groups = new Map<string, Slot[]>()
  for (const slot of slots) {
    const key = dateKey(slot.startsAt)
    groups.set(key, [...(groups.get(key) ?? []), slot])
  }
  const today = dateKey(new Date().toISOString())
  if (!slots.length) return <EmptyState kind="calendar" title="No slots available"
    description="There are no appointments for this provider. Try choosing all providers." />
  return <div className="date-groups">
    {!slots.some(isAvailable) && <div className="inline-notice"><Icon name="info" />No slots available. Please check back for new appointments.</div>}
    {[...groups].map(([day, daySlots]) => <section className="date-group" key={day} aria-labelledby={`day-${daySlots[0].id}`}>
      <div className="date-heading"><h3 id={`day-${daySlots[0].id}`}><Icon name="calendar" size={17} />{longDate(daySlots[0].startsAt)}
        {day === today && <span className="today-badge">Today</span>}</h3>
        <span className="date-count">{daySlots.filter(isAvailable).length} available</span></div>
      <div className="slot-grid">{daySlots.map((slot) => <SlotCard key={slot.id} slot={slot}
        selected={selected === slot.id} onSelect={onSelect} />)}</div>
    </section>)}
    <p className="timezone-note"><Icon name="clock" size={14} />All times in West Africa Time (WAT · UTC+1)
      <span>{formatDate(slots[0].startsAt, { month: 'long', year: 'numeric' })}</span></p>
  </div>
}
