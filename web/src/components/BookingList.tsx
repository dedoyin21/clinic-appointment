import { useState } from 'react'
import type { FormEvent } from 'react'
import type { Booking, Slot } from '../types'
import { demoEmail, providers } from '../mock/data'
import { emailError, formatDate, isPast, longDate, pause, time } from '../lib/format'
import { Icon } from './Icon'
import { Skeleton } from './Skeleton'
import { EmptyState } from './EmptyState'
import { CancelDialog } from './CancelDialog'

export function BookingList({ bookings, slots, initialEmail, onCancel }: {
  bookings: Booking[]; slots: Slot[]; initialEmail: string; onCancel: (booking: Booking) => Promise<void>
}) {
  const [email, setEmail] = useState(initialEmail)
  const [searched, setSearched] = useState(initialEmail)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [limit, setLimit] = useState(3)
  const [cancelling, setCancelling] = useState<Booking | null>(null)
  const results = bookings.filter((booking) => booking.email.toLowerCase() === searched)
    .sort((a, b) => new Date(slots.find((slot) => slot.id === a.slotId)!.startsAt).getTime()
      - new Date(slots.find((slot) => slot.id === b.slotId)!.startsAt).getTime())
  async function search(event?: FormEvent<HTMLFormElement>, value = email) {
    event?.preventDefault()
    const message = emailError(value)
    setError(message)
    if (message || loading || loadingMore) return
    setLoading(true)
    await pause()
    setSearched(value.trim().toLowerCase()); setLimit(3); setLoading(false)
  }
  async function loadMore() {
    if (loadingMore) return
    setLoadingMore(true)
    await pause(400)
    setLimit((value) => value + 3); setLoadingMore(false)
  }
  return <section className="bookings-view panel" aria-labelledby="bookings-title">
    <div className="section-title"><div><h2 id="bookings-title">Your care, in one place.</h2><p>Find and manage your appointments with your email.</p></div><span className="section-icon"><Icon name="calendar" size={24} /></span></div>
    <form className="lookup-form" noValidate onSubmit={search}>
      <div className="field"><label htmlFor="lookup-email">Email address</label><div className="input-icon"><Icon name="mail" size={18} />
        <input type="email" id="lookup-email" autoComplete="email" placeholder="you@example.com" value={email}
          onChange={(event) => { setEmail(event.target.value); setError('') }} disabled={loading || loadingMore}
          aria-invalid={!!error} aria-describedby={error ? 'lookup-error' : 'demo-hint'} required maxLength={254} /></div>
        {error && <p id="lookup-error" className="field-error">{error}</p>}</div>
      <button type="submit" className="primary-button" disabled={loading || loadingMore}>{loading ? <><span className="spinner" />Finding…</> : <>Find bookings<Icon name="arrow" size={17} /></>}</button>
    </form>
    <p className="demo-hint" id="demo-hint">Just exploring? Try <button type="button" className="text-button" disabled={loading || loadingMore}
      onClick={() => { setEmail(demoEmail); void search(undefined, demoEmail) }}>{demoEmail}</button></p>
    {loading ? <Skeleton kind="bookings" /> : !searched ? <EmptyState kind="mail" title="Let’s find your appointments"
      description="Enter the email you used when booking. Your appointments will appear here." />
      : !results.length ? <EmptyState kind="calendar" title="No bookings yet" description={`We couldn’t find any appointments for ${searched}. Check your email or book your first visit.`} />
        : <div className="booking-results">
          <div className="results-heading" role="status" tabIndex={-1}><h3>{results.length} appointment{results.length === 1 ? '' : 's'}</h3><span>Oldest first</span></div>
          {results.slice(0, limit).map((booking) => {
            const slot = slots.find((item) => item.id === booking.slotId)!
            const provider = providers.find((item) => item.id === slot.providerId)!
            const past = isPast(slot)
            return <article className="booking-item" key={booking.id}>
              <div className="booking-date-tile"><span>{formatDate(slot.startsAt, { month: 'short' })}</span><strong>{formatDate(slot.startsAt, { day: '2-digit' })}</strong></div>
              <div className="booking-item-details"><div className="booking-item-title"><h3>{provider.name}</h3>
                <span className={`booking-badge ${booking.status === 'cancelled' ? 'cancelled' : past ? 'past' : ''}`}>{booking.status === 'cancelled' ? 'Cancelled' : past ? 'Past' : 'Confirmed'}</span></div>
                <p>{longDate(slot.startsAt)} · {time(slot.startsAt)} WAT</p><p>{booking.name} <span className="booking-reference">· {booking.reference}</span></p></div>
              <button type="button" className="cancel-button" disabled={booking.status === 'cancelled' || past} onClick={() => setCancelling(booking)}
                aria-label={`Cancel appointment ${booking.reference}`}>Cancel</button>
            </article>
          })}
          {limit < results.length && <button type="button" className="secondary-button load-more" disabled={loadingMore} onClick={loadMore}>
            {loadingMore ? <><span className="spinner" />Loading…</> : <>Load more <span className="remaining-count">{results.length - limit}</span></>}</button>}
          <p className="results-footnote">Showing {Math.min(limit, results.length)} of {results.length} appointments</p>
        </div>}
    {cancelling && <CancelDialog booking={cancelling} slot={slots.find((slot) => slot.id === cancelling.slotId)!}
      onClose={() => setCancelling(null)} onConfirm={async () => { await onCancel(cancelling); setCancelling(null) }} />}
  </section>
}
