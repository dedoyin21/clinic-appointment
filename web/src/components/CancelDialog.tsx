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
  return <dialog ref={dialog} className="cancel-dialog m-auto max-h-[calc(100svh-40px)] w-[min(460px,calc(100%-32px))] overflow-auto rounded-[20px] border border-line bg-white p-[30px] text-[#31472f] shadow-[0_20px_80px_#1c302c30] motion-safe:animate-panel-in [&_h2]:mb-[13px] [&_h2]:text-[23px] [&_h2]:font-[550] [&_h2]:tracking-[-.8px] [&_p]:text-sm [&_p]:leading-[1.8] [&_p]:text-[#5f774f] max-md:px-[21px] max-md:py-[25px] max-md:[&_h2]:text-[22px]" aria-labelledby="cancel-title" aria-describedby="cancel-description"
    onCancel={(event) => { event.preventDefault(); if (!busy) onClose() }}>
    <span className="empty-icon mb-[18px] inline-grid size-[58px] place-items-center rounded-[17px] bg-[#eef3e8] text-[#69825a]"><Icon name="calendar" size={26} /></span><h2 id="cancel-title">Cancel this appointment?</h2>
    <p id="cancel-description">Your visit on {longDate(slot.startsAt)} at {time(slot.startsAt)} WAT will be cancelled and the time made available again.</p>
    <p className="cancel-reference [&]:mt-4 [&]:rounded-md [&]:bg-[#f6f8f1] [&]:p-2.5 [&]:text-[11px]">Reference: {booking.reference}</p>
    <div className="dialog-actions mt-6 flex gap-[9px] [&_button]:flex-1 [&_button]:px-2.5 max-md:flex-col max-md:[&_button]:w-full"><button autoFocus type="button" className="secondary-button inline-flex min-h-[46px] items-center justify-center gap-[9px] rounded-lg border border-[#d8e3ce] bg-white px-4 py-[13px] text-xs font-[550] text-[#446337] enabled:hover:bg-[#f4f7ef] disabled:opacity-65 max-md:min-h-12 max-md:text-[13px]" disabled={busy} onClick={onClose}>Keep appointment</button>
      <button type="button" className="danger-button inline-flex min-h-[46px] items-center justify-center gap-[9px] rounded-lg border border-transparent bg-[#a33b38] px-4 py-[13px] text-xs font-[550] text-white enabled:hover:bg-[#8c2d2b] disabled:opacity-65 max-md:min-h-12 max-md:text-[13px]" disabled={busy} onClick={confirm}>{busy ? <><span className="spinner inline-block size-[15px] rounded-full border-2 border-current border-r-transparent motion-safe:animate-spin" />Cancelling…</> : 'Yes, cancel'}</button></div>
  </dialog>
}
