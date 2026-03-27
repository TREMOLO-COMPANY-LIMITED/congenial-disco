---
paths:
  - "apps/web/**"
  - "apps/admin/**"
---

# Frontend Rules

## Stack Assumptions

- Next.js App Router
- React 19
- Tailwind CSS
- Shared UI from `@starter/ui`
- API access through the existing app-level client helpers

## General Rules

- Default to Server Components unless client-side interaction is required
- Use `"use client"` only where necessary
- Keep page structure aligned with the App Router conventions: `page.tsx`, `layout.tsx`, route groups, and colocated components
- Reuse existing shared components before introducing app-local duplicates

## Data Fetching and State

- Use TanStack Query where the app already uses it for remote server state
- Keep local UI state local unless it is genuinely cross-cutting
- Use Zustand only for state that needs to be shared across components and is already modeled that way
- Keep API base URLs sourced from `NEXT_PUBLIC_API_URL`

## Forms and Validation

- Use React Hook Form and Zod for form-heavy flows
- Keep validation messages and field labels consistent within each app
- Reuse shared auth or upload types where they already exist

## App Separation

- `apps/web` and `apps/admin` are separate apps; do not blur boundaries casually
- Shared behavior belongs in `packages/shared` or `packages/ui`, not by importing across app directories
- Admin-specific UX and route guards should stay in `apps/admin`

## Testing

- Update component or page tests when behavior changes
- Prefer focused tests close to the feature area
- Keep user-facing copy in tests aligned with the actual UI copy
