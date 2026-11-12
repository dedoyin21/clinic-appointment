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
  if (mobile && active) return <dialog ref={dialog} className="booking-sheet fixed inset-x-0 top-auto bottom-0 m-0 max-h-[92svh] w-full max-w-full overflow-auto overscroll-contain rounded-t-[23px] border-0 bg-white p-0 text-ink shadow-card motion-safe:animate-panel-in" aria-labelledby="panel-title"
    onCancel={(event) => { event.preventDefault(); if (!busy) onClose() }}>
    <div className="sheet-handle mx-auto mt-3 h-1 w-[34px] rounded bg-[#d8dfd2]" aria-hidden="true" /><div className="panel-content px-6 pt-[15px] pb-[calc(25px+env(safe-area-inset-bottom))]">{children}</div></dialog>
  return <aside ref={region} className={`panel rounded-2xl border border-line bg-white shadow-card booking-panel sticky top-6 min-w-0 px-6 py-[27px] roomy:p-[30px] max-wide:px-5 max-wide:py-[26px] max-md:static max-md:mt-[19px] max-md:p-[26px] max-md:[&:not(.panel-active)]:hidden ${active ? 'panel-active motion-safe:animate-panel-in' : ''}`} aria-label="Your appointment">
    {active ? children : <div className="panel-placeholder text-center [&_.eyebrow]:text-[9px] [&_.eyebrow]:tracking-[1.3px] [&_h2]:mt-[13px] [&_h2]:text-[27px] [&_h2]:leading-[1.4] [&_h2]:font-medium [&_h2]:tracking-[-1px] [&>p]:mt-3.5 [&>p]:text-sm [&>p]:leading-[1.9] [&>p]:text-[#687c5c] max-wide:[&_h2]:text-[25px]">
      <div className="calendar-illustration relative -mx-1 -mt-2 mb-4 grid h-[218px] place-items-center overflow-hidden bg-[radial-gradient(ellipse,#f0f4e9_0,#f7f9f2_38%,#fff0_70%)]" aria-hidden="true"><span className="orbit absolute -rotate-27 rounded-full border border-[#e2ead9] orbit-one h-[165px] w-[235px]" /><span className="orbit absolute -rotate-27 rounded-full border border-[#e2ead9] orbit-two h-[195px] w-[267px] border-dashed opacity-70" />
        <div className="mini-calendar relative h-[142px] w-[145px] -rotate-8 rounded-[10px] border border-[#d1ddc7] bg-white px-3 shadow-[6px_10px_0_#e2e8da80,0_10px_24px_#4a633418]"><span className="calendar-rings before:absolute before:-top-2 before:left-[29px] before:h-5 before:w-[5px] before:rounded-[9px] before:border-2 before:border-[#f1f5ea] before:bg-[#8d9e7e] before:content-[''] after:absolute after:-top-2 after:right-[29px] after:h-5 after:w-[5px] after:rounded-[9px] after:border-2 after:border-[#f1f5ea] after:bg-[#8d9e7e] after:content-['']" /><div className="mini-calendar-top -mx-3 rounded-t-[9px] bg-[#dce8d1] pt-[19px] pb-2.5 text-[7px] font-[650] tracking-[1px] text-[#546f44]">A LITTLE TIME FOR YOU</div>
          <div className="mini-calendar-grid grid grid-cols-4 gap-2 pt-[17px] [&>span]:grid [&>span]:h-[13px] [&>span]:w-[17px] [&>span]:place-items-center [&>span]:rounded-[3px] [&>span]:bg-[#edf1e7] [&>.mini-selected]:-mt-1.5 [&>.mini-selected]:-mb-[5px] [&>.mini-selected]:-ml-1 [&>.mini-selected]:h-6 [&>.mini-selected]:w-[25px] [&>.mini-selected]:rounded-[5px] [&>.mini-selected]:bg-[#688257] [&>.mini-selected]:text-white">{Array.from({ length: 12 }, (_, index) => <span key={index} className={index === 6 ? 'mini-selected' : ''}>{index === 6 ? <Icon name="heart" size={17} /> : ''}</span>)}</div></div>
        <span className="floating-leaf absolute bottom-6 left-[26px] -rotate-25 text-[#6e8c58]"><Icon name="leaf" size={25} /></span><span className="floating-check absolute top-11 right-[27px] grid size-[35px] place-items-center rounded-full border-4 border-white bg-[#e4eddb] text-[#6a8853]"><Icon name="check" size={20} /></span></div>
      <span className="eyebrow block text-[10px] font-[650] tracking-[1.6px] text-[#607955]">GOOD HEALTH STARTS HERE</span><h2>A small step.<br />A little peace of mind.</h2>
      <p>Choose a time that works for you.<br />We’ll take care of the rest.</p>
      <div className="next-step mt-7 flex items-center gap-[11px] rounded-[9px] border border-[#e2ead9] bg-[#f3f7ec] px-3 py-[17px] text-left text-[#647b56] [&>span]:grid [&>span]:size-[25px] [&>span]:shrink-0 [&>span]:place-items-center [&>span]:rounded-full [&>span]:border [&>span]:border-[#d0dec4] [&>span]:bg-[#e9f0df] [&>span]:text-[11px] [&>span]:text-[#587445] [&_p]:text-[11px] [&_p]:leading-[1.8] [&_p]:text-[#536b44] [&>svg]:ml-auto"><span>1</span><p>Select an available time to<br />start your booking.</p><Icon name="arrow" size={18} /></div>
      <div className="panel-trust mt-6 flex items-center justify-center gap-1.5 border-t border-line pt-[23px] text-[10px] text-[#647958]"><Icon name="shield" size={17} /><span>Thoughtful care. Simple booking.</span></div>
    </div>}
  </aside>
}
