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

Tables with Row Level Security — users only access their own data:

- **profiles** — user preferences (units: metric/imperial, theme: dark/light, `landing_page`: races/maintenance/results, `maintenance_defaults`: JSONB weekly schedule template). Auto-created by DB trigger on signup.
- **races** — user's races (name, location, date, details, `race_type`: swim/bike/run/triathlon — nullable for legacy rows, required on create/edit; a null type is treated as triathlon for display). Constants in `lib/race-constants.ts`.
- **workouts** — training sessions belonging to a race. Types: Swim, Bike, Run, Strength, Rest, Other. Duration stored as HH:MM text, intensity 0–10 with 0.5 steps.
- **maintenance_entries** — one row per populated cell on the Maintenance Training calendar (`date`, `session` first/second, `type`). Empty cells have no row; unique on (user_id, date, session).
- **race_results** — one row per race (PK = `race_id`), fully manual entry of 13 result fields. Times stored as integer seconds; the UI converts to/from HH:MM:SS / MM:SS. Distances/units follow `profiles.units` (no per-row unit).
- **security_events** — audit log of security-relevant actions.

Schema defined in `supabase_schema.sql`; incremental DDL lives in `migrations/`. RLS optimizations in `rls_optimization.sql`. TypeScript types in `types/database.ts` (shared `WorkoutType` alias).

### Route Structure

- `app/page.tsx` — Home. Thin server component that redirects to the user's `profile.landing_page` (`/races` default), or `/login` if unauthenticated.
- `app/(auth)/` — Login, signup, forgot-password pages. Auth actions in `app/(auth)/actions.ts`.
- `app/(protected)/layout.tsx` — shared protected shell; renders the mobile `<BottomNav />` once.
- `app/(protected)/races/page.tsx` — race list (the former home page).
- `app/(protected)/maintenance/page.tsx` — Maintenance Training weekly planner (AM/PM grid, paste-from-defaults, summary stats).
- `app/(protected)/results/page.tsx` — Race Results list (one card per completed race, expandable breakdown).
- `app/(protected)/[raceId]/page.tsx` — Race detail with workout list (+ Results modal for completed races).
- `app/(protected)/profile/page.tsx` — Account settings, maintenance-defaults editor, CSV import/export, security, danger zone.
- `app/api/export/route.ts` — GET endpoint exporting all user data as CSV.

Top-level nav: horizontal tabs in the header (`top-nav.tsx`) on `sm:` and up; fixed bottom tab bar (`bottom-nav.tsx`) on mobile — Races / Maintenance / Results / Account.

### Server Actions (`app/actions.ts`)

All data mutations go through server actions: `createRace`, `updateRace`, `deleteRace`, `createWorkout`, `updateWorkout`, `deleteWorkout`, `duplicateWorkout`, `upsertRaceResult`, `updateProfile`, `updateMaintenanceDefaults`, `upsertMaintenanceEntry`, `pasteDefaultSchedule`, `clearMaintenanceWeek`, `fillRestWeek`, `deleteAccount`, `updateSecuritySettings`, `importCsvData`. Most call `revalidatePath()` after mutations; the maintenance actions intentionally skip it since the page updates optimistically client-side and persists in the background.

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

- **UI primitives** in `components/ui/`: Button (with `isLoading` spinner), Input, Label, Checkbox, Modal (optional `size` prop). Not shadcn but similar API.
- **App components** in `components/app/`: Header, Footer, TopNav, BottomNav, RaceList, RaceCard, WorkoutList, AddEditRaceModal, AddEditWorkoutModal, ProfileForm, CsvManager, workout-icons. Maintenance: MaintenanceGrid, MaintenanceCell, MaintenanceWeekView, MaintenanceDefaultsForm. Results: ResultsList, ResultsCard, RaceResultsModal.
- The `cn()` utility (clsx + tailwind-merge) lives in `lib/utils.ts`.
- Modals are conditionally rendered (not portal-based). Client components use `useTransition` for async server action calls.
- Workout intensity uses a green-to-red HSL color scale (`lib/colors.ts`). Maintenance cells use per-type badge styles in `lib/maintenance-colors.ts` (hues match the workout icons). Result time/pace conversion helpers in `lib/time-format.ts`; week-range helpers in `lib/date-utils.ts`.

### CSV Import/Export

Export: `/api/export` joins races+workouts into a flat CSV with headers: Race Type, Race Name, Race Location, Race Date, Race Details, Workout Date, Workout Type, Workout Duration, Workout Distance, Workout Intensity, Workout Details.

Import: `importCsvData` in `app/actions.ts` validates headers, race type (required, must be swim/bike/run/triathlon), date formats (DD/MM/YYYY for workouts), workout types, and checks for duplicate races by name+date before inserting.