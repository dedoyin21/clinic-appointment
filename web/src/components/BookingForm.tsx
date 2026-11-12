import { useState } from 'react'
import type { FormEvent } from 'react'
import type { Patient, Slot } from '../types'
import { providers } from '../mock/data'
import { emailError, longDate, time } from '../lib/format'
import { Icon } from './Icon'

export function BookingForm({ slot, submitting, onSubmit, onClose }: {
  slot: Slot; submitting: boolean; onSubmit: (patient: Patient) => void; onClose: () => void
}) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [touched, setTouched] = useState({ name: false, email: false })
  const provider = providers.find((person) => person.id === slot.providerId)!
  const errors = { name: !name.trim() ? 'Enter your full name.' : name.trim().length < 2 ? 'Enter at least 2 characters.' : '', email: emailError(email) }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setTouched({ name: true, email: true })
    if (errors.name || errors.email) document.getElementById(errors.name ? 'patient-name' : 'patient-email')?.focus()
    else if (!submitting) onSubmit({ name: name.trim(), email: email.trim().toLowerCase() })
  }
  return <>
    <div className="panel-heading"><div><span className="eyebrow">YOUR APPOINTMENT</span><h2 id="panel-title">Let’s make it official.</h2></div>
      <button type="button" className="icon-button" aria-label="Close booking panel" onClick={onClose} disabled={submitting}><Icon name="close" /></button></div>
    <div className="appointment-summary"><div className="provider-summary"><span className={`avatar ${provider.id}`}>{provider.initials}</span>
      <div><strong>{provider.name}</strong><span>{provider.specialty}</span></div></div>
      <p><Icon name="calendar" size={17} />{longDate(slot.startsAt)}</p>
      <p><Icon name="clock" size={17} />{time(slot.startsAt)} · {slot.duration} minutes <span className="small-muted">WAT</span></p>
      <p><Icon name="pin" size={17} />In-person · Wellnest Clinic</p></div>
    <form noValidate onSubmit={submit} className="booking-form">
      <h3>Your details</h3><p className="field-intro">Just a couple of details, and you’re all set.</p>
      <div className="field"><label htmlFor="patient-name">Full name <span aria-hidden="true">*</span></label>
        <input id="patient-name" name="name" autoComplete="name" placeholder="e.g. Alex Morgan" value={name}
          maxLength={100} disabled={submitting} onChange={(event) => setName(event.target.value)} onBlur={() => setTouched((value) => ({ ...value, name: true }))}
          aria-invalid={touched.name && !!errors.name} aria-describedby={touched.name && errors.name ? 'name-error' : undefined} required />
        {touched.name && errors.name && <p id="name-error" className="field-error">{errors.name}</p>}</div>
      <div className="field"><label htmlFor="patient-email">Email address <span aria-hidden="true">*</span></label>
        <input id="patient-email" name="email" type="email" autoComplete="email" placeholder="you@example.com" value={email}
          maxLength={254} disabled={submitting} onChange={(event) => setEmail(event.target.value)} onBlur={() => setTouched((value) => ({ ...value, email: true }))}
          aria-invalid={touched.email && !!errors.email} aria-describedby={touched.email && errors.email ? 'email-error' : 'email-hint'} required />
        {touched.email && errors.email ? <p id="email-error" className="field-error">{errors.email}</p>
          : <p id="email-hint" className="field-hint">Use this email to find your bookings later.</p>}</div>
      <button className="primary-button full-width" type="submit" disabled={submitting}>
        {submitting ? <><span className="spinner" />Confirming…</> : <>Confirm appointment<Icon name="arrow" size={18} /></>}</button>
      <p className="privacy-note"><Icon name="shield" size={15} />Your details stay in this demo session.</p>
    </form>
  </>
}
