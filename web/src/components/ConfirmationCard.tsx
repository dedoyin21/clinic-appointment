import type { Booking, Slot } from '../types'
import { providerFor } from '../lib/provider'
import { longDate, time } from '../lib/format'
import { Icon } from './Icon'
export function ConfirmationCard({ booking, slot, onAnother, onCopy, onBookings }: {
  booking: Booking; slot: Slot; onAnother: () => void; onCopy: () => void; onBookings: () => void
}) {
  const provider = providerFor(slot)
  return <div className="confirmation text-center [&_.eyebrow]:text-[9px] [&_.eyebrow]:tracking-[1.2px] [&_h2]:mt-[11px] [&_h2]:mb-2.5 [&_h2]:text-[26px] [&_h2]:font-[550] [&_h2]:tracking-[-.9px] [&>p]:text-xs [&>p]:leading-[1.8] [&>p]:text-[#5c754e] [&>.secondary-button]:mt-2.5 max-md:pt-[13px] max-md:[&_h2]:text-[28px] max-md:[&>p]:text-sm"><span className="success-icon mt-[3px] mb-[21px] inline-grid size-[67px] place-items-center rounded-full border-8 border-[#f2f6ed] bg-[#deecd9] text-[#4d7540]"><Icon name="check" size={32} /></span>
    <span className="eyebrow block text-[10px] font-[650] tracking-[1.6px] text-[#607955]">A LITTLE CARE, ALL BOOKED</span><h2 id="panel-title" tabIndex={-1}>You’re on the calendar.</h2>
    <p>We look forward to seeing you, {booking.name.split(' ')[0]}.</p>
    <div className="reference-box my-6 rounded-[10px] border border-dashed border-[#c5d6b9] bg-[#f4f7ee] px-3 py-[18px] [&>span]:block [&>span]:text-[10px] [&>span]:text-[#627c52] [&_strong]:my-2 [&_strong]:block [&_strong]:text-xl [&_strong]:font-[550] [&_strong]:tracking-[1.8px] [&_strong]:select-all [&_strong]:wrap-anywhere [&_.text-button]:text-[11px]"><span>Booking reference</span><strong>{booking.reference}</strong>
      <button type="button" className="text-button inline-flex items-center gap-[5px] border-0 bg-transparent p-[5px] text-[inherit] text-accent underline underline-offset-[3px] hover:text-[#153f35]" onClick={onCopy}><Icon name="copy" size={15} />Copy reference</button></div>
    <dl className="confirmation-details mb-5 text-left [&>div]:mb-[13px] [&>div]:grid [&>div]:grid-cols-[60px_minmax(0,1fr)] [&>div]:gap-3 [&>div]:text-xs [&>div]:leading-[1.7] [&_dt]:text-[#667c57] [&_dd]:m-0 [&_dd]:wrap-anywhere [&_dd]:text-[#405938] max-md:[&>div]:grid-cols-[65px_minmax(0,1fr)] max-md:[&>div]:text-[13px]"><div><dt>Provider</dt><dd>{provider.name}</dd></div>
      <div><dt>Date</dt><dd>{longDate(slot.startsAt)}</dd></div><div><dt>Time</dt><dd>{time(slot.startsAt)} WAT · {slot.duration} min</dd></div>
      <div><dt>Patient</dt><dd>{booking.name}</dd></div><div><dt>Email</dt><dd>{booking.email}</dd></div></dl>
    <p className="arrival-note [&]:mt-0 [&]:mb-5 [&]:flex [&]:items-start [&]:gap-[7px] [&]:rounded-[7px] [&]:bg-[#f8f9f5] [&]:p-[11px] [&]:text-left [&]:text-[11px] max-md:[&]:text-xs"><Icon name="info" size={17} />Please arrive 10 minutes before your visit.</p>
    <button type="button" className="primary-button inline-flex min-h-[46px] items-center justify-center gap-[9px] rounded-lg border border-accent bg-accent px-4 py-[13px] text-xs font-[550] text-white enabled:hover:bg-accent-deep enabled:hover:shadow-[0_3px_8px_#23615320] disabled:opacity-65 max-md:min-h-12 max-md:text-[13px] full-width w-full" onClick={onAnother}>Book another<Icon name="arrow" size={17} /></button>
    <button type="button" className="secondary-button inline-flex min-h-[46px] items-center justify-center gap-[9px] rounded-lg border border-[#d8e3ce] bg-white px-4 py-[13px] text-xs font-[550] text-[#446337] enabled:hover:bg-[#f4f7ef] disabled:opacity-65 max-md:min-h-12 max-md:text-[13px] full-width w-full" onClick={onBookings}>View my bookings</button>
  </div>
}
