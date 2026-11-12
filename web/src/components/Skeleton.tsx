export function Skeleton({ kind = 'slots' }: { kind?: 'slots' | 'bookings' }) {
  return <div role="status" aria-label={kind === 'slots' ? 'Loading appointments' : 'Loading bookings'}>
    <span className="sr-only">Loading, please wait.</span>
    {Array.from({ length: kind === 'slots' ? 3 : 2 }, (_, index) => <div className="skeleton-group mb-[26px]" key={index} aria-hidden="true">
      <div className="skeleton rounded-lg bg-[linear-gradient(90deg,#f0f3ec_25%,#e5ebdf_50%,#f0f3ec_75%)] bg-size-[200%_100%] motion-safe:animate-shimmer skeleton-title mb-3.5 h-[17px] w-[45%]" /><div className={kind === 'slots' ? 'slot-grid grid grid-cols-2 gap-2.5 wide:grid-cols-4' : ''}>
        {Array.from({ length: kind === 'slots' ? 4 : 1 }, (_, item) => <div key={item} className="skeleton rounded-lg bg-[linear-gradient(90deg,#f0f3ec_25%,#e5ebdf_50%,#f0f3ec_75%)] bg-size-[200%_100%] motion-safe:animate-shimmer skeleton-card h-[105px]" />)}
      </div></div>)}
  </div>
}
