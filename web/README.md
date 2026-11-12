# Wellnest Clinic

A clinic appointment app built with React, TypeScript, Vite, and Tailwind CSS v4. No UI libraries or additional runtime dependencies.

## Run

From `web`, run `npm install` if dependencies are missing, then `npm run dev`.
Run `npm run build` for the TypeScript check and production build.

## Try the flow (mock mode)

- Choose a provider and an available appointment, then enter a name and email.
- Copy the generated reference, book another visit, or view your bookings.
- In My bookings, use `alex@example.com` to see five sample appointments and try Load more.
- Cancel a future appointment through the confirmation dialog. The slot becomes available again.

In mock mode, the 12 sample slots cover three Lagos calendar dates and two providers. Past and booked appointments remain visible. All times use Africa/Lagos (WAT). Mock data resets on refresh and no emails are sent. Real mode uses the configured clinic API. Inter loads through Google Fonts with a system font fallback.

## Source structure

```text
src/
  App.tsx
  index.css
  main.tsx
  types.ts
  vite-env.d.ts
  api/client.ts
  lib/format.ts
  lib/provider.ts
  mock/data.ts
  mock/api.ts
  hooks/useBookingPanel.ts
  hooks/useClinic.ts
  hooks/useBookings.ts
  components/
    Icon.tsx
    SlotCard.tsx
    SlotGrid.tsx
    BookingPanel.tsx
    BookingForm.tsx
    ConfirmationCard.tsx
    BookingList.tsx
    CancelDialog.tsx
    Toast.tsx
    RequestError.tsx
    Skeleton.tsx
    EmptyState.tsx
```

The desktop booking panel becomes a native modal bottom sheet below 768px. Native dialogs handle focus trapping and Escape; focus returns to the initiating control. Inputs have inline validation, lists have loading skeletons, and submissions prevent duplicate bookings. Notifications use an ARIA live region and the browser top layer so they remain visible above mobile sheets. Motion respects `prefers-reduced-motion`.

Styling uses Tailwind CSS v4 utilities directly in React components, with CSS-first theme tokens and animations in src/index.css. The Vite integration uses @tailwindcss/vite; no JavaScript Tailwind configuration is needed. Semantic classes alongside utilities serve as focus-management and browser-check hooks.
﻿
## API configuration

Copy `web/.env.example` to `web/.env.local` and restart Vite after changing it:

```dotenv
VITE_API_URL=http://localhost:8000
VITE_API_KEY=replace-with-your-api-key
VITE_USE_MOCK=false
```

- `VITE_API_URL`: API base URL, including any path prefix; trailing slashes are handled.
- `VITE_API_KEY`: sent as `X-API-Key` on every request. Vite embeds client variables in the browser bundle, so use a key intended for browser access.
- `VITE_USE_MOCK`: set exactly `true` to use the in-memory mock API without a backend or key; set `false` for real requests. Mock bookings reset on reload.

Vite reads env files from `web`; a parent-directory `.env` is not loaded. `.env.local` overrides `.env`. A cross-origin backend must allow the frontend origin, JSON requests, `X-API-Key`, and `Idempotency-Key`, and expose `Retry-After`.

The booking ID is displayed as the reference; duration is derived from slot start/end. No separate reference, specialty, or total count is expected from the API. Retries with unchanged booking details reuse the same idempotency UUID. Load more passes the server's opaque cursor unchanged.
