import { useCallback, useEffect, useRef, useState } from 'react'
import type { Booking, ToastMessage } from '../types'
import { api, ApiError, errorMessage } from '../api/client'
import { emailError } from '../lib/format'

export function useBookings(initialEmail: string, notify: (message: string, tone?: ToastMessage['tone']) => void, onChanged: () => Promise<void>) {
  const [results, setResults] = useState<Booking[]>([])
  const [searched, setSearched] = useState('')
  const [cursor, setCursor] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const [fieldError, setFieldError] = useState('')
  const lock = useRef(false)
  const cancelLock = useRef(false)
  const request = useRef<AbortController | null>(null)
  const lastRequest = useRef<{ email: string; cursor?: string; append: boolean } | null>(null)
  const fetchPage = useCallback(async (email: string, next?: string, append = false) => {
    if (lock.current) return
    lock.current = true
    const controller = new AbortController()
    request.current = controller
    lastRequest.current = { email, cursor: next, append }
    setError(null)
    if (append) setLoadingMore(true)
    else { setLoading(true); setResults([]); setCursor(null); setSearched(email) }
    try {
      const page = await api.getBookings(email, next, controller.signal)
      if (controller.signal.aborted) return
      setResults(current => append
        ? [...current, ...page.bookings.filter(booking => !current.some(item => item.id === booking.id))]
        : page.bookings)
      setCursor(page.next_cursor)
    } catch (failure) {
      if (!controller.signal.aborted) {
        if (failure instanceof ApiError && failure.status === 400) setFieldError(failure.message)
        else setError(failure)
      }
    } finally {
      if (request.current === controller) {
        lock.current = false
        if (!controller.signal.aborted) { setLoading(false); setLoadingMore(false) }
      }
    }
  }, [])
  useEffect(() => {
    if (initialEmail) void fetchPage(initialEmail)
    return () => { request.current?.abort(); lock.current = false }
  }, [initialEmail, fetchPage])
  async function search(value: string) {
    if (lock.current) return
    const message = emailError(value)
    setFieldError(message)
    if (!message) await fetchPage(value.trim().toLowerCase())
  }
  async function cancel(booking: Booking) {
    if (cancelLock.current) return
    cancelLock.current = true
    try {
      const updated = await api.cancelBooking(booking.id)
      setResults(current => current.map(item => item.id === updated.id ? updated : item))
      notify('Appointment cancelled. You can book a new time whenever you’re ready.')
    } catch (failure) {
      if (failure instanceof ApiError && failure.status === 409) {
        setResults(current => current.map(item => item.id === booking.id ? { ...item, status: 'cancelled' } : item))
        notify('This appointment was already cancelled. Your list is now up to date.', 'success')
      } else if (failure instanceof ApiError && failure.status === 404) {
        setResults(current => current.filter(item => item.id !== booking.id))
        notify('This appointment no longer exists. Your list is now up to date.', 'error')
      } else throw failure
    } finally { cancelLock.current = false }
    void onChanged()
  }
  function retry() {
    const previous = lastRequest.current
    if (previous) void fetchPage(previous.email, previous.cursor, previous.append)
  }
  return {
    results, searched, loading, loadingMore, cursor, error, fieldError, setFieldError, search, cancel, retry,
    errorMessage: error ? errorMessage(error) : '',
    loadMore: () => { if (cursor !== null) void fetchPage(searched, cursor, true) },
  }
}
