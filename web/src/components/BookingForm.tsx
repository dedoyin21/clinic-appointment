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
    <div className="panel-heading mb-[23px] flex items-center justify-between gap-2 [&_.eyebrow]:text-[9px] [&_.eyebrow]:tracking-[1.1px] [&_h2]:mt-[9px] [&_h2]:text-[22px] [&_h2]:leading-[1.4] [&_h2]:font-[550] [&_h2]:tracking-[-.7px] md:max-rail:[&_h2]:text-xl max-md:[&_h2]:text-2xl max-md:[&_.eyebrow]:text-[10px]"><div><span className="eyebrow block text-[10px] font-[650] tracking-[1.6px] text-[#607955]">YOUR APPOINTMENT</span><h2 id="panel-title">Let’s make it official.</h2></div>
      <button type="button" className="icon-button inline-flex min-h-9 min-w-9 items-center justify-center rounded-[7px] border-0 bg-transparent p-[9px] text-[#5c7150] hover:bg-[#edf2e7] disabled:opacity-40" aria-label="Close booking panel" onClick={onClose} disabled={submitting}><Icon name="close" /></button></div>
    <div className="appointment-summary rounded-[10px] border border-[#e1e9d9] bg-[#f5f8f1] p-4 [&_p]:mt-[11px] [&_p]:flex [&_p]:items-center [&_p]:gap-2 [&_p]:text-[11px] [&_p]:leading-[1.6] [&_p]:text-[#536b48] max-md:[&_p]:text-xs"><div className="provider-summary mb-4 flex items-center gap-2.5 [&_strong]:block [&_strong]:text-[13px] [&_strong]:font-semibold [&_div>span]:mt-[5px] [&_div>span]:block [&_div>span]:text-[10px] [&_div>span]:text-[#637854] max-md:[&_strong]:text-sm max-md:[&_div>span]:text-[11px]"><span className={`avatar grid size-9 shrink-0 place-items-center rounded-full bg-[#e5eddc] text-xs font-semibold text-[#536945] [&.daniel]:bg-[#e9eae2] [&.daniel]:text-[#636952] ${provider.id}`}>{provider.initials}</span>
      <div><strong>{provider.name}</strong><span>{provider.specialty}</span></div></div>
      <p><Icon name="calendar" size={17} />{longDate(slot.startsAt)}</p>
      <p><Icon name="clock" size={17} />{time(slot.startsAt)} · {slot.duration} minutes <span className="small-muted ml-auto text-[10px] text-[#647b56]">WAT</span></p>
      <p><Icon name="pin" size={17} />In-person · Wellnest Clinic</p></div>
    <form noValidate onSubmit={submit} className="booking-form mt-[26px] [&_h3]:text-base [&_h3]:font-[550] max-md:mt-[23px] max-md:[&_h3]:text-[17px]">
      <h3>Your details</h3><p className="field-intro mt-2 mb-5 text-sm leading-[1.8] text-muted">Just a couple of details, and you’re all set.</p>
      <div className="field mb-[18px] min-w-0 [&_label]:mb-2 [&_label]:block [&_label]:text-xs [&_label]:font-[550] [&_label]:text-[#405736] [&_label>span]:ml-0.5 [&_label>span]:text-[#607c4e] max-md:[&_label]:text-[13px]"><label htmlFor="patient-name">Full name <span aria-hidden="true">*</span></label>
        <input id="patient-name" name="name" autoComplete="name" placeholder="e.g. Alex Morgan" value={name}
          maxLength={100} disabled={submitting} onChange={(event) => setName(event.target.value)} onBlur={() => setTouched((value) => ({ ...value, name: true }))}
          aria-invalid={touched.name && !!errors.name} aria-describedby={touched.name && errors.name ? 'name-error' : undefined} required />
        {touched.name && errors.name && <p id="name-error" className="field-error mt-[7px] text-xs leading-[1.6] text-[#a33333]">{errors.name}</p>}</div>
      <div className="field mb-[18px] min-w-0 [&_label]:mb-2 [&_label]:block [&_label]:text-xs [&_label]:font-[550] [&_label]:text-[#405736] [&_label>span]:ml-0.5 [&_label>span]:text-[#607c4e] max-md:[&_label]:text-[13px]"><label htmlFor="patient-email">Email address <span aria-hidden="true">*</span></label>
        <input id="patient-email" name="email" type="email" autoComplete="email" placeholder="you@example.com" value={email}
          maxLength={254} disabled={submitting} onChange={(event) => setEmail(event.target.value)} onBlur={() => setTouched((value) => ({ ...value, email: true }))}
          aria-invalid={touched.email && !!errors.email} aria-describedby={touched.email && errors.email ? 'email-error' : 'email-hint'} required />
        {touched.email && errors.email ? <p id="email-error" className="field-error mt-[7px] text-xs leading-[1.6] text-[#a33333]">{errors.email}</p>
          : <p id="email-hint" className="field-hint mt-2 text-[10px] leading-[1.8] text-[#657b56] max-md:text-[11px]">Use this email to find your bookings later.</p>}</div>
      <button className="primary-button inline-flex min-h-[46px] items-center justify-center gap-[9px] rounded-lg border border-accent bg-accent px-4 py-[13px] text-xs font-[550] text-white enabled:hover:bg-accent-deep enabled:hover:shadow-[0_3px_8px_#23615320] disabled:opacity-65 max-md:min-h-12 max-md:text-[13px] full-width w-full" type="submit" disabled={submitting}>
        {submitting ? <><span className="spinner inline-block size-[15px] rounded-full border-2 border-current border-r-transparent motion-safe:animate-spin" />Confirming…</> : <>Confirm appointment<Icon name="arrow" size={18} /></>}</button>
      <p className="privacy-note mt-[15px] flex items-center justify-center gap-[5px] text-[10px] text-[#647b55] max-md:text-[11px]"><Icon name="shield" size={15} />Your details stay in this demo session.</p>
    </form>
  </>
}
