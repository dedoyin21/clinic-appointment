import type { Booking, Slot } from '../types'
import { providers } from '../mock/data'
import { longDate, time } from '../lib/format'
import { Icon } from './Icon'
export function ConfirmationCard({ booking, slot, onAnother, onCopy, onBookings }: {
  booking: Booking; slot: Slot; onAnother: () => void; onCopy: () => void; onBookings: () => void
}) {
  const provider = providers.find((person) => person.id === slot.providerId)!
  return <div className="confirmation"><span className="success-icon"><Icon name="check" size={32} /></span>
    <span className="eyebrow">A LITTLE CARE, ALL BOOKED</span><h2 id="panel-title" tabIndex={-1}>You’re on the calendar.</h2>
    <p>We look forward to seeing you, {booking.name.split(' ')[0]}.</p>
    <div className="reference-box"><span>Booking reference</span><strong>{booking.reference}</strong>
      <button type="button" className="text-button" onClick={onCopy}><Icon name="copy" size={15} />Copy reference</button></div>
    <dl className="confirmation-details"><div><dt>Provider</dt><dd>{provider.name}</dd></div>
      <div><dt>Date</dt><dd>{longDate(slot.startsAt)}</dd></div><div><dt>Time</dt><dd>{time(slot.startsAt)} WAT · {slot.duration} min</dd></div>
      <div><dt>Patient</dt><dd>{booking.name}</dd></div><div><dt>Email</dt><dd>{booking.email}</dd></div></dl>
    <p className="arrival-note"><Icon name="info" size={17} />Please arrive 10 minutes before your visit.</p>
    <button type="button" className="primary-button full-width" onClick={onAnother}>Book another<Icon name="arrow" size={17} /></button>
    <button type="button" className="secondary-button full-width" onClick={onBookings}>View my bookings</button>
  </div>
}
