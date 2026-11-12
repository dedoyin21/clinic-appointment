import { useEffect, useRef } from 'react'
import type { ToastMessage } from '../types'
import { Icon } from './Icon'
export function Toast({ toast, onDismiss }: { toast: ToastMessage | null; onDismiss: (id: number) => void }) {
  const region = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const current = region.current
    current?.hidePopover()
    if (!toast) return
    current?.showPopover()
    const timer = window.setTimeout(() => onDismiss(toast.id), 5500)
    return () => window.clearTimeout(timer)
  }, [toast, onDismiss])
  return <div ref={region} popover="manual" className="toast-region fixed right-6 bottom-6 top-auto left-auto z-100 m-0 max-w-[calc(100vw-32px)] overflow-visible border-0 bg-transparent p-0 max-md:right-4 max-md:bottom-[calc(16px+env(safe-area-inset-bottom))]" aria-live="polite" aria-atomic="true">
    {toast && <div className={`toast flex max-w-[460px] items-center gap-2.5 rounded-xl border border-[#cbdac5] bg-white py-3 pr-3 pl-[17px] text-[13px] leading-[1.7] text-[#355c36] shadow-[0_6px_30px_#263b2920] motion-safe:animate-panel-in [&.error]:border-[#e8c8c3] [&.error]:text-[#9a3c37] [&_.icon-button]:ml-auto max-md:pl-[13px] max-md:text-xs ${toast.tone}`} key={toast.id}><Icon name={toast.tone === 'success' ? 'check' : 'info'} /><span>{toast.message}</span>
      <button type="button" className="icon-button inline-flex min-h-9 min-w-9 items-center justify-center rounded-[7px] border-0 bg-transparent p-[9px] text-[#5c7150] hover:bg-[#edf2e7] disabled:opacity-40" onClick={() => onDismiss(toast.id)} aria-label="Dismiss notification"><Icon name="close" size={17} /></button></div>}
  </div>
}
