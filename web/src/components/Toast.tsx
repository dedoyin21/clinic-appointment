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
  return <div ref={region} popover="manual" className="toast-region" aria-live="polite" aria-atomic="true">
    {toast && <div className={`toast ${toast.tone}`} key={toast.id}><Icon name={toast.tone === 'success' ? 'check' : 'info'} /><span>{toast.message}</span>
      <button type="button" className="icon-button" onClick={() => onDismiss(toast.id)} aria-label="Dismiss notification"><Icon name="close" size={17} /></button></div>}
  </div>
}
