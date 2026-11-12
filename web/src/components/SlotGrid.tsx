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
    {!slots.some(isAvailable) && <div className="inline-notice mb-5 flex items-center gap-[9px] rounded-lg bg-[#f0f4eb] p-3 text-xs"><Icon name="info" />No slots available. Please check back for new appointments.</div>}
    {[...groups].map(([day, daySlots]) => <section className="date-group [&+&]:mt-[26px] max-md:[&+&]:mt-[27px]" key={day} aria-labelledby={`day-${daySlots[0].id}`}>
      <div className="date-heading mb-[13px] flex items-center justify-between gap-2 [&_h3]:flex [&_h3]:items-center [&_h3]:gap-[7px] [&_h3]:text-xs [&_h3]:font-[550] [&_h3]:text-[#43563a] [&_h3_svg]:text-[#708764] max-rail:[&_h3]:gap-[5px] max-rail:[&_h3]:text-[11px] max-md:[&_h3_svg]:w-[15px]"><h3 id={`day-${daySlots[0].id}`}><Icon name="calendar" size={17} />{longDate(daySlots[0].startsAt)}
        {day === today && <span className="today-badge rounded bg-[#eef3e7] px-1.5 py-[3px] text-[9px] font-medium text-[#5a724c] md:max-rail:hidden max-md:px-[5px] max-md:text-[8px]">Today</span>}</h3>
        <span className="date-count text-[10px] whitespace-nowrap text-[#6d7c60] max-rail:text-[9px]">{daySlots.filter(isAvailable).length} available</span></div>
      <div className="slot-grid grid grid-cols-2 gap-2.5 wide:grid-cols-4">{daySlots.map((slot) => <SlotCard key={slot.id} slot={slot}
        selected={selected === slot.id} onSelect={onSelect} />)}</div>
    </section>)}
    <p className="timezone-note my-[25px] flex flex-wrap items-center gap-1.5 text-[10px] text-[#647758] [&_span]:ml-auto [&_span]:text-[#687a5d] max-wide:[&_span]:hidden max-md:mt-[23px]"><Icon name="clock" size={14} />All times in West Africa Time (WAT · UTC+1)
      <span>{formatDate(slots[0].startsAt, { month: 'long', year: 'numeric' })}</span></p>
  </div>
}
