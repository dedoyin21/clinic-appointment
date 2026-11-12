# Wellnest Clinic

A mock clinic appointment app built with React, TypeScript, Vite, and Tailwind CSS v4. No UI libraries or additional runtime dependencies.

## Run

From `web`, run `npm install` if dependencies are missing, then `npm run dev`.
Run `npm run build` for the TypeScript check and production build.

## Try the flow

- Choose a provider and an available appointment, then enter a name and email.
- Copy the generated reference, book another visit, or view your bookings.
- In My bookings, use `alex@example.com` to see five sample appointments and try Load more.
- Cancel a future appointment through the confirmation dialog. The slot becomes available again.

The 12 mock slots cover three Lagos calendar dates and two providers. Past and booked appointments remain visible. All times use Africa/Lagos (WAT). Data is kept in React state and resets on refresh; no emails or network booking requests are sent. Inter loads through Google Fonts with a system font fallback.

## Source structure

```text
src/
  App.tsx
  index.css
  main.tsx
  types.ts
  lib/format.ts
  mock/data.ts
  hooks/useBookingPanel.ts
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
    Skeleton.tsx
    EmptyState.tsx
```

The desktop booking panel becomes a native modal bottom sheet below 768px. Native dialogs handle focus trapping and Escape; focus returns to the initiating control. Inputs have inline validation, lists have loading skeletons, and submissions prevent duplicate bookings. Notifications use an ARIA live region and the browser top layer so they remain visible above mobile sheets. Motion respects `prefers-reduced-motion`.

Styling uses Tailwind CSS v4 utilities directly in React components, with CSS-first theme tokens and animations in src/index.css. The Vite integration uses @tailwindcss/vite; no JavaScript Tailwind configuration is needed. Semantic classes alongside utilities serve as focus-management and browser-check hooks.
