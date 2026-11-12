import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { useBookingPanel } from '../hooks/useBookingPanel'
import { Icon } from './Icon'
export function BookingPanel({ active, busy, focusKey, onClose, children }: {
  active: boolean; busy: boolean; focusKey: string; onClose: () => void; children: ReactNode
}) {
  const mobile = useBookingPanel()
  const dialog = useRef<HTMLDialogElement>(null)
  const region = useRef<HTMLElement>(null)
  useEffect(() => {
    if (!active) return
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const current = dialog.current
    if (mobile) current?.showModal()
    const panel = mobile ? current : region.current
    const target = panel?.querySelector<HTMLElement>('#panel-title[tabindex], input') ?? panel?.querySelector<HTMLElement>('button')
    target?.focus({ preventScroll: true })
    return () => {
      current?.close()
      const fallback = document.querySelector<HTMLElement>('.slot-card:not(:disabled)') ?? document.getElementById('main-content')
      const target = previous?.isConnected && !previous.matches(':disabled') ? previous : fallback
      target?.focus({ preventScroll: true })
    }
  }, [active, mobile, focusKey])
  useEffect(() => {
    if (!mobile || !active) return
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = original }
  }, [mobile, active])
  if (mobile && active) return <dialog ref={dialog} className="booking-sheet panel" aria-labelledby="panel-title"
    onCancel={(event) => { event.preventDefault(); if (!busy) onClose() }}>
    <div className="sheet-handle" aria-hidden="true" /><div className="panel-content">{children}</div></dialog>
  return <aside ref={region} className={`panel booking-panel ${active ? 'panel-active' : ''}`} aria-label="Your appointment">
    {active ? children : <div className="panel-placeholder">
      <div className="calendar-illustration" aria-hidden="true"><span className="orbit orbit-one" /><span className="orbit orbit-two" />
        <div className="mini-calendar"><span className="calendar-rings" /><div className="mini-calendar-top">A LITTLE TIME FOR YOU</div>
          <div className="mini-calendar-grid">{Array.from({ length: 12 }, (_, index) => <span key={index} className={index === 6 ? 'mini-selected' : ''}>{index === 6 ? <Icon name="heart" size={17} /> : ''}</span>)}</div></div>
        <span className="floating-leaf"><Icon name="leaf" size={25} /></span><span className="floating-check"><Icon name="check" size={20} /></span></div>
      <span className="eyebrow">GOOD HEALTH STARTS HERE</span><h2>A small step.<br />A little peace of mind.</h2>
      <p>Choose a time that works for you.<br />We’ll take care of the rest.</p>
      <div className="next-step"><span>1</span><p>Select an available time to<br />start your booking.</p><Icon name="arrow" size={18} /></div>
      <div className="panel-trust"><Icon name="shield" size={17} /><span>Thoughtful care. Simple booking.</span></div>
    </div>}
  </aside>
}
