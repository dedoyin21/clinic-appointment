export type Provider = { id: string; name: string; initials: string; specialty: string }
export type Slot = {
  id: string
  providerId: string
  startsAt: string
  duration: number
  status: 'available' | 'booked' | 'past'
}
export type Booking = {
  id: string
  reference: string
  slotId: string
  name: string
  email: string
  createdAt: string
  status: 'confirmed' | 'cancelled'
}
export type Patient = Pick<Booking, 'name' | 'email'>
export type ToastMessage = { id: number; message: string; tone: 'success' | 'error' }
