import { useState } from 'react'
import type { FormEvent } from 'react'
import type { Booking, Slot, ToastMessage } from '../types'
import { useBookings } from '../hooks/useBookings'
import { useMock } from '../api/client'
import { providerFor } from '../lib/provider'
import { RequestError } from './RequestError'
import { formatDate, isPast, longDate, time } from '../lib/format'
import { Icon } from './Icon'
import { Skeleton } from './Skeleton'
import { EmptyState } from './EmptyState'
import { CancelDialog } from './CancelDialog'

export function BookingList({ slots, initialEmail, notify, onChanged }: {
  slots: Slot[]; initialEmail: string
  notify: (message: string, tone?: ToastMessage['tone']) => void; onChanged: () => Promise<void>
}) {
  const [email, setEmail] = useState(initialEmail)
  const [cancelling, setCancelling] = useState<Booking | null>(null)
  const page = useBookings(initialEmail, notify, onChanged)
  const { results, searched, loading, loadingMore, cursor, fieldError: error, setFieldError: setError, loadMore } = page
  const demoEmail = 'alex@example.com'
  function search(event?: FormEvent<HTMLFormElement>, value = email) {
    event?.preventDefault(); void page.search(value)
  }
  return <section className="bookings-view max-w-[1020px] p-7 max-md:px-[17px] max-md:py-[23px] max-md:[&_.section-title]:items-start max-md:[&_.section-title_h2]:text-[22px] panel rounded-2xl border border-line bg-white shadow-card" aria-labelledby="bookings-title">
    <div className="section-title flex items-center justify-between gap-3 [&_h2]:text-[22px] [&_h2]:leading-[1.4] [&_h2]:font-[550] [&_h2]:tracking-[-.7px] [&_p]:mt-[7px] [&_p]:text-sm [&_p]:leading-[1.7] [&_p]:text-muted max-md:[&_h2]:text-[21px] max-md:[&_p]:text-[13px]"><div><h2 id="bookings-title">Your care, in one place.</h2><p>Find and manage your appointments with your email.</p></div><span className="section-icon grid size-[46px] place-items-center rounded-xl bg-[#f0f5e9] text-[#70885e] max-md:size-9"><Icon name="calendar" size={24} /></span></div>
    <form className="lookup-form mt-[27px] flex items-start gap-3 [&_.field]:m-0 [&_.field]:max-w-[450px] [&_.field]:flex-1 [&_.primary-button]:mt-[26px] [&_.primary-button]:min-h-12 max-md:mt-6 max-md:block max-md:[&_.field]:max-w-none max-md:[&_.primary-button]:mt-[13px] max-md:[&_.primary-button]:w-full" noValidate onSubmit={search}>
      <div className="field mb-[18px] min-w-0 [&_label]:mb-2 [&_label]:block [&_label]:text-xs [&_label]:font-[550] [&_label]:text-[#405736] [&_label>span]:ml-0.5 [&_label>span]:text-[#607c4e] max-md:[&_label]:text-[13px]"><label htmlFor="lookup-email">Email address</label><div className="input-icon relative [&>svg]:absolute [&>svg]:top-[15px] [&>svg]:left-[13px] [&>svg]:text-[#718762] [&_input]:pl-10"><Icon name="mail" size={18} />
        <input type="email" id="lookup-email" autoComplete="email" placeholder="you@example.com" value={email}
          onChange={(event) => { setEmail(event.target.value); setError('') }} disabled={loading || loadingMore}
          aria-invalid={!!error} aria-describedby={error ? 'lookup-error' : 'demo-hint'} required maxLength={254} /></div>
        {error && <p id="lookup-error" className="field-error mt-[7px] text-xs leading-[1.6] text-[#a33333]">{error}</p>}</div>
      <button type="submit" className="primary-button inline-flex min-h-[46px] items-center justify-center gap-[9px] rounded-lg border border-accent bg-accent px-4 py-[13px] text-xs font-[550] text-white enabled:hover:bg-accent-deep enabled:hover:shadow-[0_3px_8px_#23615320] disabled:opacity-65 max-md:min-h-12 max-md:text-[13px]" disabled={loading || loadingMore}>{loading ? <><span className="spinner inline-block size-[15px] rounded-full border-2 border-current border-r-transparent motion-safe:animate-spin" />Finding…</> : <>Find bookings<Icon name="arrow" size={17} /></>}</button>
    </form>
    <p className="demo-hint mt-[11px] text-xs text-[#627b52] [&_.text-button]:text-xs max-md:text-[11px] max-md:[&_.text-button]:text-[11px]" id="demo-hint">{useMock ? <>Just exploring? Try <button type="button" className="text-button inline-flex items-center gap-[5px] border-0 bg-transparent p-[5px] text-[inherit] text-accent underline underline-offset-[3px] hover:text-[#153f35]" disabled={loading || loadingMore}
      onClick={() => { setEmail(demoEmail); void search(undefined, demoEmail) }}>{demoEmail}</button></> : 'Use the email you entered when booking.'}</p>
    {page.error !== null && <RequestError message={page.errorMessage} onRetry={page.retry} busy={loading || loadingMore} />}
    {loading ? <Skeleton kind="bookings" /> : !searched ? <EmptyState kind="mail" title="Let’s find your appointments"
      description="Enter the email you used when booking. Your appointments will appear here." />
      : !results.length && (page.error !== null || error) ? null : !results.length ? <EmptyState kind="calendar" title="No bookings yet" description={`We couldn’t find any appointments for ${searched}. Check your email or book your first visit.`} />
        : <div className="booking-results mt-8">
          <div className="results-heading mb-4 flex items-center justify-between [&_h3]:text-sm [&_h3]:font-semibold [&>span]:text-[11px] [&>span]:text-[#637b52]" role="status" tabIndex={-1}><h3>{results.length} appointment{results.length === 1 ? '' : 's'}</h3><span>Oldest first</span></div>
          {results.map((booking) => {
            const slot = slots.find((item) => item.id === booking.slotId)
            const provider = slot ? providerFor(slot) : null
            const past = slot ? isPast(slot) : false
            return <article className="booking-item mb-3 flex items-center gap-[18px] rounded-xl border border-line px-4 py-5 max-md:flex-wrap max-md:gap-2.5 max-md:px-2.5 max-md:py-3.5" key={booking.id}>
              <div className="booking-date-tile w-[54px] shrink-0 rounded-lg bg-[#f0f4e9] p-[9px] text-center text-[#587547] [&_span]:block [&_span]:text-[10px] [&_span]:tracking-[1px] [&_span]:uppercase [&_strong]:text-[25px] [&_strong]:leading-[1.4] [&_strong]:font-medium max-md:w-[43px] max-md:p-[7px] max-md:[&_strong]:text-[22px]"><span>{slot ? formatDate(slot.startsAt, { month: 'short' }) : 'Visit'}</span><strong>{slot ? formatDate(slot.startsAt, { day: '2-digit' }) : '—'}</strong></div>
              <div className="booking-item-details min-w-0 flex-1 [&_p]:mt-[7px] [&_p]:text-xs [&_p]:leading-[1.7] [&_p]:wrap-anywhere [&_p]:text-[#5c754e] max-md:min-w-45 max-md:[&_p]:text-[11px]"><div className="booking-item-title flex flex-wrap items-center gap-2.5 [&_h3]:text-sm [&_h3]:font-[550] max-md:gap-[7px] max-md:[&_h3]:text-[13px]"><h3>{provider?.name ?? 'Clinic appointment'}</h3>
                <span className={`booking-badge rounded-[5px] bg-[#edf5e6] px-[7px] py-1 text-[9px] text-[#4b6b39] [&.cancelled]:bg-[#f8eeee] [&.cancelled]:text-[#9b4946] [&.past]:bg-[#f1f2ed] [&.past]:text-[#627356] max-md:text-[8px] ${booking.status === 'cancelled' ? 'cancelled' : past ? 'past' : ''}`}>{booking.status === 'cancelled' ? 'Cancelled' : past ? 'Past' : 'Confirmed'}</span></div>
                <p>{slot ? `${longDate(slot.startsAt)} · ${time(slot.startsAt)} WAT` : 'Appointment time is not in the current slot list.'}</p><p>{booking.name} <span className="booking-reference text-[#637b52] max-md:block">· {booking.reference}</span></p></div>
              <button type="button" className="cancel-button min-h-10 rounded-[7px] border border-[#e4d5d0] bg-transparent px-3.5 py-2.5 text-xs text-[#99483c] enabled:hover:bg-[#fbf0eb] disabled:border-[#e0e5d8] disabled:bg-[#f7f8f4] disabled:text-[#65715c] max-md:ml-[53px] max-md:px-[15px] max-md:py-2" disabled={booking.status === 'cancelled' || past} onClick={() => setCancelling(booking)}
                aria-label={`Cancel appointment ${booking.reference}`}>Cancel</button>
            </article>
          })}
          {cursor !== null && <button type="button" className="secondary-button inline-flex min-h-[46px] items-center justify-center gap-[9px] rounded-lg border border-[#d8e3ce] bg-white px-4 py-[13px] text-xs font-[550] text-[#446337] enabled:hover:bg-[#f4f7ef] disabled:opacity-65 max-md:min-h-12 max-md:text-[13px] load-more [&]:mx-auto [&]:mt-[23px] [&]:flex [&]:px-[30px] [&]:py-2.5" disabled={loadingMore} onClick={loadMore}>
            {loadingMore ? <><span className="spinner inline-block size-[15px] rounded-full border-2 border-current border-r-transparent motion-safe:animate-spin" />Loading…</> : <>Load more <span className="remaining-count inline-grid size-[21px] place-items-center rounded-full bg-[#edf2e7] text-[10px]"><Icon name="chevron" size={12} /></span></>}</button>}
          <p className="results-footnote mt-4 text-center text-[11px] text-[#647a55]">Showing {results.length} appointment{results.length === 1 ? '' : 's'}{cursor !== null ? ' · more available' : ''}</p>
        </div>}
    {cancelling && <CancelDialog booking={cancelling} slot={slots.find((slot) => slot.id === cancelling.slotId)}
      onClose={() => setCancelling(null)} onConfirm={async () => { await page.cancel(cancelling); setCancelling(null) }} />}
  </section>
}
