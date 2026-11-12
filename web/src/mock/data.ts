import type { Booking, Provider, Slot } from '../types'

export const providers: Provider[] = [
  { id: 'amara', name: 'Dr. Amara Okafor', initials: 'AO', specialty: 'Family medicine' },
  { id: 'daniel', name: 'Dr. Daniel Cole', initials: 'DC', specialty: 'General practice' },
]
// Calendar dates follow Lagos time and move forward with the day the demo is opened.
const today = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Africa/Lagos', year: 'numeric', month: '2-digit', day: '2-digit',
}).format(new Date())
const start = new Date(`${today}T12:00:00+01:00`)
const hours = ['08:30', '09:30', '13:30', '15:00']
export const initialSlots: Slot[] = Array.from({ length: 12 }, (_, index) => {
  const date = new Date(start)
  date.setUTCDate(date.getUTCDate() + Math.floor(index / 4))
  return {
    id: `slot-${index + 1}`,
    providerId: index % 2 === 0 ? 'amara' : 'daniel',
    startsAt: new Date(`${date.toISOString().slice(0, 10)}T${hours[index % 4]}:00+01:00`).toISOString(),
    duration: 30,
    status: index < 2 ? 'past' : [5, 8, 10].includes(index) ? 'booked' : 'available',
  }
})
export const demoEmail = 'alex@example.com'
export const initialBookings: Booking[] = [0, 1, 5, 8, 10].map((slotIndex, index) => ({
  id: `booking-${index + 1}`,
  reference: `WN-${['A7K2P9', 'B8M3Q2', 'C9N4R3', 'D2P5S4', 'E3Q6T5'][index]}`,
  slotId: initialSlots[slotIndex].id,
  name: 'Alex Morgan', email: demoEmail,
  createdAt: new Date(start.getTime() - (5 - index) * 86400000).toISOString(),
  status: 'confirmed',
}))
