import { useCallback, useEffect, useRef, useState } from 'react'
import type { Booking, Patient, Provider, Slot, ToastMessage } from '../types'
import { api, ApiError, errorMessage } from '../api/client'
import { isAvailable } from '../lib/format'
import { providerFor } from '../lib/provider'

export function useClinic() {
  const [tab, setTab] = useState<'book' | 'bookings'>('book')
  const [slots, setSlots] = useState<Slot[]>([])
  const [catalog, setCatalog] = useState<Slot[]>([])
  const [providers, setProviders] = useState<Provider[]>([])
  const [provider, setProvider] = useState<string | null>(null)
  const [selected, setSelected] = useState<Slot | null>(null)
  const [confirmed, setConfirmed] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)
  const [slotError, setSlotError] = useState<unknown>(null)
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState<ToastMessage | null>(null)
  const [patientEmail, setPatientEmail] = useState('')
  const lock = useRef(false)
  const requestSequence = useRef(0)
  const toastSequence = useRef(0)
  const [, refreshClock] = useState(0)
  const notify = useCallback((message: string, tone: ToastMessage['tone'] = 'success') => {
    setToast({ id: ++toastSequence.current, message, tone })
  }, [])
  const dismissToast = useCallback((id: number) => setToast(value => value?.id === id ? null : value), [])
  const refreshSlots = useCallback(async (signal?: AbortSignal) => {
    const sequence = ++requestSequence.current
    setLoading(true); setSlotError(null)
    try {
      const results = await api.getSlots(provider ?? undefined, signal)
      if (signal?.aborted || sequence !== requestSequence.current) return
      setSlots(results)
      setCatalog(current => [...new Map([...current, ...results].map(slot => [slot.id, slot])).values()])
      if (provider === null) setProviders([...new Map(results.map(slot => [slot.providerId, providerFor(slot)])).values()])
    } catch (error) {
      if (!signal?.aborted && sequence === requestSequence.current) setSlotError(error)
    } finally {
      if (!signal?.aborted && sequence === requestSequence.current) setLoading(false)
    }
  }, [provider])
  useEffect(() => {
    const controller = new AbortController()
    void refreshSlots(controller.signal)
    return () => { controller.abort(); requestSequence.current++ }
  }, [refreshSlots])
  useEffect(() => {
    const timer = window.setInterval(() => refreshClock(value => value + 1), 1000)
    return () => window.clearInterval(timer)
  }, [])
  function closePanel() { if (!lock.current) { setSelected(null); setConfirmed(null) } }
  function switchTab(value: typeof tab) { if (!lock.current) { closePanel(); setTab(value) } }
  function pickSlot(slot: Slot) {
    if (!lock.current && isAvailable(slot)) { setConfirmed(null); setSelected(slot) }
  }
  async function book(patient: Patient, key: string) {
    if (!selected || lock.current) return
    lock.current = true; setSubmitting(true)
    try {
      const booking = await api.createBooking({ slot_id: selected.id, ...patient }, key)
      setConfirmed(booking); setPatientEmail(booking.email)
      setSlots(current => current.map(slot => slot.id === booking.slotId ? { ...slot, status: 'booked' } : slot))
      setCatalog(current => current.map(slot => slot.id === booking.slotId ? { ...slot, status: 'booked' } : slot))
      notify('Your appointment is confirmed. We’ll see you soon!')
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        setSelected(null); setConfirmed(null)
        notify('That slot was just taken. Please choose another time.', 'error')
        await refreshSlots()
      } else throw error
    } finally { lock.current = false; setSubmitting(false) }
  }
  async function copyReference() {
    if (!confirmed) return
    try { await navigator.clipboard.writeText(confirmed.reference); notify('Booking reference copied.') }
    catch { notify('Copy failed. You can select and copy the reference shown above.', 'error') }
  }
  return {
    tab, provider, setProvider, providers, selected, confirmed, loading, slotError,
    submitting, toast, patientEmail, dismissToast, notify, refreshSlots,
    filtered: slots, slots: catalog, availableCount: slots.filter(isAvailable).length,
    closePanel, switchTab, pickSlot, book, copyReference, slotErrorMessage: slotError ? errorMessage(slotError) : '',
  }
}
