import { useCallback, useEffect, useRef, useState } from 'react'
import type { Booking, Patient, Slot, ToastMessage } from './types'
import { initialBookings, initialSlots, providers } from './mock/data'
import { formatDate, isAvailable, isPast, pause } from './lib/format'
import { Icon } from './components/Icon'
import { SlotGrid } from './components/SlotGrid'
import { Skeleton } from './components/Skeleton'
import { BookingPanel } from './components/BookingPanel'
import { BookingForm } from './components/BookingForm'
import { ConfirmationCard } from './components/ConfirmationCard'
import { BookingList } from './components/BookingList'
import { Toast } from './components/Toast'
import './App.css'

export default function App() {
  const [tab, setTab] = useState<'book' | 'bookings'>('book')
  const [slots, setSlots] = useState(initialSlots)
  const [bookings, setBookings] = useState(initialBookings)
  const [provider, setProvider] = useState('all')
  const [selected, setSelected] = useState<Slot | null>(null)
  const [confirmed, setConfirmed] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState<ToastMessage | null>(null)
  const [patientEmail, setPatientEmail] = useState('')
  const submitLock = useRef(false)
  const toastSequence = useRef(0)
  const [, refreshClock] = useState(0)
  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 650)
    const clock = window.setInterval(() => refreshClock((value) => value + 1), 30000)
    return () => { window.clearTimeout(timer); window.clearInterval(clock) }
  }, [])
  const notify = (message: string, tone: ToastMessage['tone'] = 'success') => setToast({ id: ++toastSequence.current, message, tone })
  const dismissToast = useCallback((id: number) => setToast((value) => value?.id === id ? null : value), [])
  const filtered = slots.filter((slot) => provider === 'all' || slot.providerId === provider)
  const availableCount = filtered.filter(isAvailable).length
  function closePanel() { if (!submitLock.current) { setSelected(null); setConfirmed(null) } }
  function switchTab(value: typeof tab) {
    if (submitLock.current) return
    closePanel(); setTab(value)
  }
  function pickSlot(slot: Slot) {
    if (submitLock.current || !isAvailable(slot)) return
    setConfirmed(null); setSelected(slot)
  }
  async function book(patient: Patient) {
    if (!selected || submitLock.current) return
    submitLock.current = true; setSubmitting(true)
    try {
      await pause(950)
      const current = slots.find((slot) => slot.id === selected.id)
      if (!current || !isAvailable(current)) {
        notify('This time is no longer available. Please choose another slot.', 'error')
        setSelected(null); setConfirmed(null); return
      }
      const booking: Booking = { ...patient, id: crypto.randomUUID(), reference: `WN-${crypto.randomUUID().replaceAll('-', '').slice(0, 8).toUpperCase()}`,
        slotId: selected.id, createdAt: new Date().toISOString(), status: 'confirmed' }
      setBookings((value) => [...value, booking])
      setSlots((value) => value.map((slot) => slot.id === selected.id ? { ...slot, status: 'booked' } : slot))
      setConfirmed(booking); setPatientEmail(patient.email)
      notify('Your appointment is confirmed. We’ll see you soon!')
    } catch { notify('We couldn’t complete your booking. Please try again.', 'error') }
    finally { submitLock.current = false; setSubmitting(false) }
  }
  async function cancel(booking: Booking) {
    await pause(700)
    const slot = slots.find((item) => item.id === booking.slotId)
    if (!slot || isPast(slot)) { notify('This appointment has already started and cannot be cancelled.', 'error'); return }
    setBookings((value) => value.map((item) => item.id === booking.id ? { ...item, status: 'cancelled' } : item))
    setSlots((value) => value.map((item) => item.id === booking.slotId ? { ...item, status: 'available' } : item))
    notify('Appointment cancelled. You can book a new time whenever you’re ready.')
  }
  async function copyReference() {
    if (!confirmed) return
    try { await navigator.clipboard.writeText(confirmed.reference); notify('Booking reference copied.') }
    catch { notify('Copy failed. You can select and copy the reference shown above.', 'error') }
  }
  return <div className="app-shell">
    <a className="skip-link" href="#main-content">Skip to content</a>
    <aside className="sidebar">
      <a className="brand" href="#" aria-label="Wellnest home" onClick={(event) => { event.preventDefault(); switchTab('book') }}>
        <span className="brand-mark"><span /><span /></span>wellnest<span className="brand-period">.</span></a>
      <span className="sidebar-label">YOUR HEALTH, SIMPLIFIED</span>
      <nav className="main-nav" aria-label="Main navigation">
        <button type="button" className={tab === 'book' ? 'active' : ''} aria-current={tab === 'book' ? 'page' : undefined} onClick={() => switchTab('book')} disabled={submitting}>
          <Icon name="calendar" />Book appointment<Icon name="chevron" size={16} /></button>
        <button type="button" className={tab === 'bookings' ? 'active' : ''} aria-current={tab === 'bookings' ? 'page' : undefined} onClick={() => switchTab('bookings')} disabled={submitting}>
          <Icon name="clock" />My bookings</button></nav>
      <div className="sidebar-bottom"><div className="care-note"><span className="care-note-icon"><Icon name="heart" size={23} /></span>
        <h3>A healthier you.<br />One visit at a time.</h3><p>Good care should feel<br />this simple.</p><span className="care-note-line" /></div>
        <div className="help-link"><Icon name="help" size={18} />Care at your own pace<Icon name="leaf" size={15} /></div>
        <div className="sidebar-footer"><span className="brand-mark tiny"><span /><span /></span>Made for your wellbeing</div></div>
    </aside>
    <div className="workspace">
      <header className="topbar"><div className="breadcrumb">Your care<Icon name="chevron" size={13} /><span>{tab === 'book' ? 'Book an appointment' : 'My bookings'}</span></div>
        <div className="topbar-right"><span className="clinic-status"><span className="status-dot" />Here for you</span><span className="topbar-divider" /><span className="guest-avatar"><Icon name="user" size={18} /></span><span className="guest-label">Guest</span></div></header>
      <main id="main-content" tabIndex={-1}>
        <div className="page-intro"><div><span className="eyebrow">A LITTLE TIME FOR YOUR WELLBEING</span>
          <h1>{tab === 'book' ? <>Good care starts <span>here.</span></> : <>Your health, <span>your plans.</span></>}</h1>
          <p>{tab === 'book' ? 'Find your time. Meet your provider. Feel taken care of.' : 'A little more peace of mind, with every appointment in one place.'}</p></div>
          <div className="today-stamp"><Icon name="calendar" size={19} /><div><span>Today</span><strong>{formatDate(new Date().toISOString(), { day: 'numeric', month: 'short', year: 'numeric' })}</strong></div></div></div>
        {tab === 'book' ? <>
          <ol className="steps" aria-label="Booking progress">{['Choose a time', 'Your details', 'All confirmed'].map((label, index) => {
            const current = confirmed ? 2 : selected ? 1 : 0
            return <li className={index <= current ? 'step-active' : ''} key={label} aria-current={index === current ? 'step' : undefined}>
              <span className="step-number">{index < current ? <Icon name="check" size={15} /> : `0${index + 1}`}</span><span>{label}</span>{index < 2 && <span className="step-line" />}</li>
          })}</ol>
          <div className="booking-layout"><section className="availability panel" aria-labelledby="availability-title" aria-busy={loading}>
            <div className="section-title"><div><h2 id="availability-title">Make time for you.</h2><p>Pick a 30-minute visit that fits your day.</p></div><span className="availability-badge"><span className="status-dot" />{availableCount} available</span></div>
            <div className="provider-filter"><span className="filter-label">Your provider</span><div className="provider-buttons" role="group" aria-label="Filter by provider">
              <button type="button" className={provider === 'all' ? 'selected' : ''} aria-pressed={provider === 'all'} onClick={() => setProvider('all')} disabled={submitting}>All providers</button>
              {providers.map((person) => <button key={person.id} type="button" className={provider === person.id ? 'selected' : ''} aria-pressed={provider === person.id}
                onClick={() => setProvider(person.id)} disabled={submitting}><span className={`avatar avatar-small ${person.id}`}>{person.initials}</span>{person.name}</button>)}
            </div></div>
            {loading ? <Skeleton /> : <SlotGrid slots={filtered} selected={selected?.id} onSelect={pickSlot} />}
            <div className="availability-footer"><Icon name="info" size={16} /><span>A little flexibility goes a long way. You can cancel from My bookings.</span></div>
          </section>
          <BookingPanel active={!!selected} busy={submitting} focusKey={confirmed?.id ?? selected?.id ?? ''} onClose={closePanel}>
            {selected && (confirmed ? <ConfirmationCard booking={confirmed} slot={selected} onAnother={closePanel} onCopy={copyReference} onBookings={() => switchTab('bookings')} />
              : <BookingForm key={selected.id} slot={selected} submitting={submitting} onSubmit={book} onClose={closePanel} />)}
          </BookingPanel></div>
        </> : <BookingList bookings={bookings} slots={slots} initialEmail={patientEmail} onCancel={cancel} />}
        <footer className="page-footer"><span><Icon name="shield" size={15} />A little care makes all the difference.</span><span>Mock data only <span className="footer-dot">·</span> No emails are sent</span></footer>
      </main>
    </div>
    <Toast toast={toast} onDismiss={dismissToast} />
  </div>
}
