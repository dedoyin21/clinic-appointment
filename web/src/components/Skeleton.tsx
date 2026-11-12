export function Skeleton({ kind = 'slots' }: { kind?: 'slots' | 'bookings' }) {
  return <div role="status" aria-label={kind === 'slots' ? 'Loading appointments' : 'Loading bookings'}>
    <span className="sr-only">Loading, please wait.</span>
    {Array.from({ length: kind === 'slots' ? 3 : 2 }, (_, index) => <div className="skeleton-group" key={index} aria-hidden="true">
      <div className="skeleton skeleton-title" /><div className={kind === 'slots' ? 'slot-grid' : ''}>
        {Array.from({ length: kind === 'slots' ? 4 : 1 }, (_, item) => <div key={item} className="skeleton skeleton-card" />)}
      </div></div>)}
  </div>
}
