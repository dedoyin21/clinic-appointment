import type { Slot } from '../types'
import { providerFor } from '../lib/provider'
import { isAvailable, isPast, longDate, time } from '../lib/format'
import { Icon } from './Icon'

export function SlotCard({ slot, selected, onSelect }: {
  slot: Slot; selected: boolean; onSelect: (slot: Slot) => void
}) {
  const provider = providerFor(slot)
  const available = isAvailable(slot)
  const status = isPast(slot) ? 'Past' : slot.status === 'booked' ? 'Booked' : 'Available'
  return <button type="button" id={slot.id} className={`slot-card flex min-h-[108px] min-w-0 flex-col rounded-[10px] border border-[#dce4d7] bg-white px-3 py-3.5 text-left md:min-h-[101px] md:px-[15px] md:py-[13px] md:max-rail:px-2.5 md:max-rail:py-3 wide:min-h-[105px] wide:px-[11px] wide:py-3.5 roomy:min-h-28 roomy:px-3.5 roomy:py-4 enabled:hover:border-[#8fa887] enabled:hover:bg-[#f4f7f0] enabled:hover:shadow-[0_2px_6px_#2b4c3310] disabled:border-[#e7ebe1] disabled:bg-[#f6f7f3] disabled:[&_.slot-time]:text-[#727c68] disabled:[&_.slot-provider]:text-[#69765f] disabled:[&_.slot-status]:text-[#69765f] aria-pressed:border-accent aria-pressed:bg-[#eaf3eb] aria-pressed:ring-1 aria-pressed:ring-accent aria-pressed:[&_.slot-time]:text-accent aria-pressed:[&_.slot-status]:text-accent ${selected ? 'is-selected' : ''}`}
    disabled={!available} aria-pressed={selected}
    aria-label={`${time(slot.startsAt)}, ${longDate(slot.startsAt)}, ${provider.name}, ${status}`}
    onClick={() => onSelect(slot)}>
    <span className="slot-time flex items-center justify-between gap-1 text-base font-semibold tracking-[-.4px] text-[#354d39] md:text-[15px] md:max-rail:text-sm">{time(slot.startsAt)}{selected && <Icon name="check" size={15} />}</span>
    <span className="slot-provider mt-2 block text-[11px] leading-normal text-[#627455] wide:text-[10px] roomy:text-[11px] md:max-rail:text-[10px]">{provider.name}</span>
    <span className={`slot-status mt-2 flex items-center gap-1 text-[10px] text-[#637356] [&_.status-dot]:size-1 [&.available]:text-[#5c754d] roomy:text-[11px] ${available ? 'available' : ''}`}>
      {available && <span className="status-dot inline-block size-1.5 shrink-0 rounded-full bg-[#668861]" />}{selected ? 'Selected' : available ? `${slot.duration} min visit` : status}
    </span>
  </button>
}
