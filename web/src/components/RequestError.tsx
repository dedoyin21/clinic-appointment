export function RequestError({ message, onRetry, busy = false }: { message: string; onRetry?: () => void; busy?: boolean }) {
  return <div data-request-error className="my-4 rounded-lg border border-[#e8c8c3] bg-[#fffafa] p-3">
    <p role="alert" className="text-xs leading-relaxed text-[#9a3c37]">{message}</p>
    {onRetry && <button type="button" disabled={busy} onClick={onRetry}
      className="mt-2 rounded-lg border border-line bg-white px-3 py-2 text-xs text-accent disabled:opacity-65">Retry</button>}
  </div>
}
