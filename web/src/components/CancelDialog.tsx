import { useEffect, useRef, useState } from 'react'
import type { Booking, Slot } from '../types'
import { longDate, time } from '../lib/format'
import { Icon } from './Icon'
export function CancelDialog({ booking, slot, onClose, onConfirm }: {
  booking: Booking; slot: Slot; onClose: () => void; onConfirm: () => Promise<void>
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    const current = dialog.current
    current?.showModal()
    return () => {
      current?.close()
      if (previous?.isConnected && !previous.matches(':disabled')) previous.focus()
      else document.querySelector<HTMLElement>('.results-heading')?.focus()
    }
  }, [])
  async function confirm() {
    if (busy) return
    setBusy(true)
    try { await onConfirm() } finally { setBusy(false) }
  }
  return <dialog ref={dialog} className="cancel-dialog" aria-labelledby="cancel-title" aria-describedby="cancel-description"
    onCancel={(event) => { event.preventDefault(); if (!busy) onClose() }}>
    <span className="empty-icon"><Icon name="calendar" size={26} /></span><h2 id="cancel-title">Cancel this appointment?</h2>
    <p id="cancel-description">Your visit on {longDate(slot.startsAt)} at {time(slot.startsAt)} WAT will be cancelled and the time made available again.</p>
    <p className="cancel-reference">Reference: {booking.reference}</p>
    <div className="dialog-actions"><button autoFocus type="button" className="secondary-button" disabled={busy} onClick={onClose}>Keep appointment</button>
      <button type="button" className="danger-button" disabled={busy} onClick={confirm}>{busy ? <><span className="spinner" />Cancelling…</> : 'Yes, cancel'}</button></div>
  </dialog>
}
