import { useState } from 'react'
import type { Slot } from '../types'
import { dateKey, formatDate, isAvailable, longDate } from '../lib/format'
import { SlotCard } from './SlotCard'
import { EmptyState } from './EmptyState'
import { Icon } from './Icon'
export function SlotGrid({ slots, selected, onSelect }: {
  slots: Slot[]; selected: string | undefined; onSelect: (slot: Slot) => void
}) {
  const [selectedMonth, setSelectedMonth] = useState('')
  const [selectedDay, setSelectedDay] = useState('')
  const [now] = useState(() => Date.now())
  const monthGroups = new Map<string, Slot[]>()
  for (const slot of slots) {
    if (new Date(slot.startsAt).getTime() <= now) continue
    const key = formatDate(slot.startsAt, { year: 'numeric', month: '2-digit' })
    monthGroups.set(key, [...(monthGroups.get(key) ?? []), slot])
  }
  const months = [...monthGroups.entries()]
  if (!months.length) return <EmptyState kind="calendar" title="No slots available"
    description="There are no appointments for this provider. Try choosing all providers." />
  const activeMonth = monthGroups.has(selectedMonth) ? selectedMonth : months[0][0]
  const monthSlots = monthGroups.get(activeMonth) ?? []
  const dateGroups = new Map<string, Slot[]>()
  for (const slot of monthSlots) {
    const key = dateKey(slot.startsAt)
    dateGroups.set(key, [...(dateGroups.get(key) ?? []), slot])
  }
  const dates = [...dateGroups.entries()]
  const firstAvailableDate = dates.find(([, daySlots]) => daySlots.some(isAvailable))?.[0]
  const activeDay = dateGroups.has(selectedDay) ? selectedDay : firstAvailableDate ?? dates[0][0]
  const daySlots = dateGroups.get(activeDay) ?? []
  const hasAvailableSlots = slots.some(isAvailable)

  return <div className="date-groups">
    <div className="mb-6 border-b border-line pb-5">
      <span className="mb-3 block text-[11px] font-[550] text-[#57694b]">Choose a month</span>
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1" role="tablist" aria-label="Appointment months">
        {months.map(([month, monthSlotsForTab]) => <button key={month} type="button"
          className={`shrink-0 rounded-lg border px-3.5 py-2 text-left text-[11px] transition-colors ${activeMonth === month ? 'border-[#becfb4] bg-[#edf3e9] text-[#365d39]' : 'border-[#dce4d5] bg-white text-[#5a6d4d] hover:border-[#8da080] hover:bg-[#f3f7f0]'}`}
          role="tab" aria-selected={activeMonth === month} onClick={() => { setSelectedMonth(month); setSelectedDay('') }}>
          <span className="block font-semibold">{formatDate(monthSlotsForTab[0].startsAt, { month: 'long' })}</span>
          <span className="mt-0.5 block text-[9px] opacity-75">{monthSlotsForTab.filter(isAvailable).length} available</span>
        </button>)}
      </div>
    </div>
    {!hasAvailableSlots && <div className="inline-notice mb-5 flex items-center gap-[9px] rounded-lg bg-[#f0f4eb] p-3 text-xs"><Icon name="info" />No slots available. Please check back for new appointments.</div>}
    <section aria-labelledby={`day-${daySlots[0].id}`}>
      <div className="mb-4">
        <span className="mb-3 block text-[11px] font-[550] text-[#57694b]">Choose a date</span>
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1" role="tablist" aria-label="Appointment dates">
          {dates.map(([day, daySlotsForTab]) => <button key={day} type="button"
            className={`shrink-0 rounded-lg border px-3.5 py-2 text-[11px] transition-colors ${activeDay === day ? 'border-[#becfb4] bg-[#edf3e9] text-[#365d39]' : 'border-[#dce4d5] bg-white text-[#5a6d4d] hover:border-[#8da080] hover:bg-[#f3f7f0]'}`}
            role="tab" aria-selected={activeDay === day} onClick={() => setSelectedDay(day)}>
            <span className="block font-semibold">{formatDate(daySlotsForTab[0].startsAt, { weekday: 'short', day: 'numeric' })}</span>
            <span className="mt-0.5 block text-[9px] opacity-75">{daySlotsForTab.filter(isAvailable).length} available</span>
          </button>)}
        </div>
      </div>
      <div className="date-heading mb-[13px] flex items-center justify-between gap-2 [&_h3]:flex [&_h3]:items-center [&_h3]:gap-[7px] [&_h3]:text-xs [&_h3]:font-[550] [&_h3]:text-[#43563a] [&_h3_svg]:text-[#708764] max-rail:[&_h3]:gap-[5px] max-rail:[&_h3]:text-[11px] max-md:[&_h3_svg]:w-[15px]">
        <h3 id={`day-${daySlots[0].id}`}><Icon name="calendar" size={17} />{longDate(daySlots[0].startsAt)}</h3>
        <span className="date-count text-[10px] whitespace-nowrap text-[#6d7c60] max-rail:text-[9px]">{daySlots.filter(isAvailable).length} available</span>
      </div>
      <div className="slot-grid grid grid-cols-2 gap-2.5 wide:grid-cols-4">{daySlots.map((slot) => <SlotCard key={slot.id} slot={slot}
        selected={selected === slot.id} onSelect={onSelect} />)}</div>
    </section>
    <p className="timezone-note my-[25px] flex flex-wrap items-center gap-1.5 text-[10px] text-[#647758] [&_span]:ml-auto [&_span]:text-[#687a5d] max-wide:[&_span]:hidden max-md:mt-[23px]"><Icon name="clock" size={14} />All times in West Africa Time (WAT · UTC+1)
      <span>{formatDate(daySlots[0].startsAt, { month: 'long', year: 'numeric' })}</span></p>
  </div>
}
