# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
npm run dev          # Start dev server (Next.js)
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
```

No test framework is configured.

## Architecture

**TriPlan** is a race-centric triathlon training planner. Next.js 16 App Router with Supabase (PostgreSQL + Auth + RLS). Deployed on Vercel at `triathlonplan.vercel.app`.

### Stack

- Next.js 16.1.6 (App Router), React 19, TypeScript (strict)
- Supabase: `@supabase/ssr` + `@supabase/supabase-js` for auth and DB
- Tailwind CSS v4 with CSS custom properties for dual theme (light/dark)
- `date-fns` for dates, `papaparse` for CSV, `lucide-react` for icons

### Database (Supabase PostgreSQL)

Three tables with Row Level Security — users only access their own data:

- **profiles** — user preferences (units: metric/imperial, theme: dark/light). Auto-created by DB trigger on signup.
- **races** — user's races (name, location, date, details).
- **workouts** — training sessions belonging to a race. Types: Swim, Bike, Run, Strength, Rest, Stretching, Other. Duration stored as HH:MM text, intensity 0–10 with 0.5 steps.

Schema defined in `supabase_schema.sql`. RLS optimizations in `rls_optimization.sql`. TypeScript types in `types/database.ts`.

### Route Structure

- `app/page.tsx` — Home (race list). Server component, redirects unauthenticated users to `/login`.
- `app/(auth)/` — Login, signup, forgot-password pages. Auth actions in `app/(auth)/actions.ts`.
- `app/(protected)/[raceId]/page.tsx` — Race detail with workout list.
- `app/(protected)/profile/page.tsx` — Account settings, CSV import/export, security, danger zone.
- `app/api/export/route.ts` — GET endpoint exporting all user data as CSV.

### Server Actions (`app/actions.ts`)

All data mutations go through server actions: `createRace`, `updateRace`, `deleteRace`, `createWorkout`, `updateWorkout`, `deleteWorkout`, `duplicateWorkout`, `updateProfile`, `deleteAccount`, `importCsvData`. Each action calls `revalidatePath()` after mutations.

### Auth Flow

Supabase email/password auth. Three Supabase client factories in `lib/supabase/`:
- `client.ts` — browser client (client components)
- `server.ts` — server client (server components, server actions)
- `middleware.ts` — session refresh on every request

The root middleware (`middleware.ts`) refreshes auth sessions. Protected pages check `supabase.auth.getUser()` and redirect to `/login` if unauthenticated.

### Theming

Dual theme via CSS class on `<html>`: `:root` = light, `.dark` = dark. Theme is set server-side in `app/layout.tsx` from the user's profile, and toggled client-side in `ProfileForm` via `document.documentElement.classList`.

CSS variables defined in `app/globals.css` map to Tailwind's `@theme` block. Use semantic color tokens (`bg-background`, `text-foreground`, `border-border`, `bg-card`, `text-muted-foreground`, `bg-primary`, etc.).

### Component Patterns

- **UI primitives** in `components/ui/`: Button (with `isLoading` spinner), Input, Label, Checkbox, Modal. Not shadcn but similar API.
- **App components** in `components/app/`: Header, Footer, RaceList, RaceCard, WorkoutList, AddEditRaceModal, AddEditWorkoutModal, ProfileForm, CsvManager, workout-icons.
- The `cn()` utility (clsx + tailwind-merge) lives in `components/ui/button.tsx` and is imported from there by other components.
- Modals are conditionally rendered (not portal-based). Client components use `useTransition` for async server action calls.
- Workout intensity uses a green-to-red HSL color scale (`lib/colors.ts`).

### CSV Import/Export

Export: `/api/export` joins races+workouts into a flat CSV with headers: Race Name, Race Location, Race Date, Race Details, Workout Date, Workout Type, Workout Duration, Workout Distance, Workout Intensity, Workout Details.

Import: `importCsvData` in `app/actions.ts` validates headers, date formats (DD/MM/YYYY for workouts), workout types, and checks for duplicate races by name+date before inserting.

### Known Issues

- `Stretching` type exists in DB schema/types but is missing from `WORKOUT_TYPES` in `add-workout-modal.tsx` and CSV import validation.
- Forgot-password page is a non-functional placeholder.
- The `cn()` utility is unconventionally located in `button.tsx` rather than a standalone `lib/utils.ts`.
