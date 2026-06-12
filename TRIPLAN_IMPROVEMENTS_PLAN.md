# TriPlan — Major Feature Plan

This document specifies a set of major changes to TriPlan: a **Maintenance Training** page, a **Race Results** feature (modal + dedicated page), and a **navigation restructure** to tie it all together. It's written to be handed to an agentic coding tool one step at a time.

## How to use this document

- The work is broken into **7 sequential steps**. They build on each other in order — don't skip ahead.
- Tell the coding agent: *"Read TRIPLAN_IMPROVEMENTS_PLAN.md and execute Step 1"*, then review/test, then move to Step 2, etc.
- Each step lists: **Goal**, **Files**, **Requirements**, and a **Definition of done** checklist.
- Every new UI element must work in **both light and dark mode** and be **responsive** (tested at ~375px mobile, ~768px tablet, ~1280px+ desktop).
- Follow existing conventions: semantic color tokens (`bg-background`, `text-foreground`, `border-border`, `bg-card`, `text-muted-foreground`, `bg-primary`, etc.), the `cn()` utility, `components/ui/*` primitives, server actions in `app/actions.ts` with `revalidatePath`, and the RLS policy style in `rls_optimization.sql` (`(select auth.uid())`).

## High-level summary

1. **Database**: 2 new tables (`maintenance_entries`, `race_results`) + 2 new `profiles` columns (`landing_page`, `maintenance_defaults`).
2. **Navigation**: new top-level routes `/races`, `/maintenance`, `/results`. Desktop gets a horizontal tab bar in the header; mobile gets a fixed bottom tab bar. `/` becomes a redirect based on the user's landing-page preference.
3. **Account Settings**: new "Maintenance Training" default-schedule editor, new "Landing Page" preference dropdown.
4. **Maintenance Training page**: weekly planner with AM/PM cards per day, paste-from-defaults, and week/month/year summary stats.
5. **Race Results**: a modal (Timer icon) on each completed race for entering 13 result fields, plus a dedicated `/results` page listing all completed races as cards.

---

## Step 1 — Database schema, RLS policies, and TypeScript types

### Goal
Lay the foundation: new tables and columns, RLS policies, and matching TypeScript types. No UI changes in this step.

### Files
- **New**: `migrations/20260612_maintenance_and_results.sql`
- **Update**: `supabase_schema.sql` (append the same DDL so it stays the canonical full-schema reference)
- **Update**: `types/database.ts`

### Requirements

#### 1.1 `profiles` table — two new columns

```sql
alter table profiles
  add column landing_page text not null default 'races'
    check (landing_page in ('races', 'maintenance', 'results'));

alter table profiles
  add column maintenance_defaults jsonb not null default '{}'::jsonb;
```

`maintenance_defaults` shape (object with one key per day, each holding `am`/`pm` workout types or `null`):

```json
{
  "mon": { "am": "Swim",  "pm": null },
  "tue": { "am": "Run",   "pm": "Strength" },
  "wed": { "am": "Bike",  "pm": null },
  "thu": { "am": null,    "pm": null },
  "fri": { "am": "Run",   "pm": "Strength" },
  "sat": { "am": "Bike",  "pm": null },
  "sun": { "am": "Rest",  "pm": null }
}
```

Valid type values: `'Swim' | 'Bike' | 'Run' | 'Strength' | 'Rest' | 'Other' | null`. Default `'{}'::jsonb` means "nothing defined yet" — treat any missing day/session key as `null`.

#### 1.2 New table `maintenance_entries`

One row per populated AM/PM cell on the Maintenance Training calendar. An empty cell simply has no row.

```sql
create table maintenance_entries (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  date date not null,
  session text not null check (session in ('AM', 'PM')),
  type text not null check (type in ('Swim', 'Bike', 'Run', 'Strength', 'Rest', 'Other')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (user_id, date, session)
);

alter table maintenance_entries enable row level security;

create policy "Users can view own maintenance entries" on maintenance_entries
  for select using (user_id = (select auth.uid()));
create policy "Users can insert own maintenance entries" on maintenance_entries
  for insert with check (user_id = (select auth.uid()));
create policy "Users can update own maintenance entries" on maintenance_entries
  for update using (user_id = (select auth.uid()));
create policy "Users can delete own maintenance entries" on maintenance_entries
  for delete using (user_id = (select auth.uid()));

create index idx_maintenance_entries_user_date on maintenance_entries (user_id, date);
```

#### 1.3 New table `race_results`

One row per race, **fully manual entry** for every field (no derived/auto-calculated columns). Times are stored as integer seconds for easy sorting/comparison over time; the UI converts to/from `HH:MM:SS` or `MM:SS`.

```sql
create table race_results (
  race_id uuid references races on delete cascade primary key,
  user_id uuid references auth.users on delete cascade not null,

  swim_distance numeric,            -- meters or yards (per profile units)
  swim_time_seconds integer,        -- HH:MM:SS
  swim_pace_seconds integer,        -- MM:SS per 100m / 100y

  t1_time_seconds integer,          -- HH:MM:SS

  bike_distance numeric,            -- km or mi
  bike_elevation numeric,           -- m or ft
  bike_time_seconds integer,        -- HH:MM:SS
  bike_speed numeric,               -- km/h or mph (decimal, e.g. 32.4)

  t2_time_seconds integer,          -- HH:MM:SS

  run_distance numeric,             -- km or mi
  run_time_seconds integer,         -- HH:MM:SS
  run_pace_seconds integer,         -- MM:SS per km / mi

  total_time_seconds integer,       -- HH:MM:SS

  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table race_results enable row level security;

create policy "Users can view own race results" on race_results
  for select using (user_id = (select auth.uid()));
create policy "Users can insert own race results" on race_results
  for insert with check (user_id = (select auth.uid()));
create policy "Users can update own race results" on race_results
  for update using (user_id = (select auth.uid()));
create policy "Users can delete own race results" on race_results
  for delete using (user_id = (select auth.uid()));
```

> Note: like the existing `workouts.distance` field, no per-row unit is stored — display units always follow the user's current `profiles.units` setting. This matches existing app behaviour and keeps the schema simple.

#### 1.4 `types/database.ts`

Add `maintenance_entries` and `race_results` table types (Row/Insert/Update) following the exact pattern already used for `workouts` and `security_events`. Extend the `profiles` Row/Insert/Update types with:

```ts
landing_page: 'races' | 'maintenance' | 'results'
maintenance_defaults: Record<string, { am: WorkoutType | null; pm: WorkoutType | null }>
```

where `WorkoutType = 'Swim' | 'Bike' | 'Run' | 'Strength' | 'Rest' | 'Other'`. Export a shared `WorkoutType` type alias if convenient (it's currently inlined in the `workouts` table type).

### Definition of done
- [ ] Migration file created and applied; `supabase_schema.sql` updated to match.
- [ ] `npx supabase gen types` (or manual edit) — `types/database.ts` compiles with the new tables/columns and the project still builds (`npm run build`).
- [ ] No changes to existing tables' behavior.

---

## Step 2 — Navigation restructure: routes, top tabs, bottom nav

### Goal
Introduce three top-level destinations — **Races**, **Maintenance**, **Results** — with a responsive nav: horizontal tabs in the header on larger screens, a fixed bottom tab bar on mobile. `/` becomes a redirect based on the user's landing-page preference (built in Step 3, but the redirect logic goes in now with a safe default).

### Files
- **Move**: contents of `app/page.tsx` → new `app/(protected)/races/page.tsx` (same logic, just relocated)
- **New**: `app/page.tsx` (now a thin redirect)
- **New**: `app/(protected)/maintenance/page.tsx` (temporary placeholder, fleshed out in Step 4)
- **New**: `app/(protected)/results/page.tsx` (temporary placeholder, fleshed out in Step 6)
- **New**: `components/app/top-nav.tsx`
- **New**: `components/app/bottom-nav.tsx`
- **Update**: `components/app/header.tsx`
- **Update**: `app/(protected)/[raceId]/page.tsx` and `app/(protected)/[raceId]/dashboard/page.tsx` (back-link target)
- **Update**: `app/layout.tsx` (bottom padding for mobile bottom nav)

### Requirements

#### 2.1 Route changes
- `app/(protected)/races/page.tsx` — exact current content of `app/page.tsx` (the races list at `/races`).
- `app/page.tsx` — server component:
  ```ts
  // Fetch user + profile.landing_page, then:
  // redirect('/races' | '/maintenance' | '/results')
  // If unauthenticated, redirect('/login') as today.
  // If landing_page is null/unset/unrecognized, default to '/races'.
  ```
- `app/(protected)/maintenance/page.tsx` and `app/(protected)/results/page.tsx`: for now, render `<Header backLink="/races" />` plus a centered "Coming soon" message inside `<main>`, so the new nav doesn't 404. These get replaced in Steps 4 and 6.
- Update every `backLink="/"` reference (in `[raceId]/page.tsx`, `[raceId]/dashboard/page.tsx`) to `backLink="/races"`, label "Back to Races" / "Back to Plan" as currently.
- The **"TriPlan" logo** in the header continues to link to `/` (which redirects appropriately) — don't hardcode `/races` there.

#### 2.2 `components/app/top-nav.tsx` (new, client component)
- Horizontal tab list: **Races**, **Maintenance**, **Results**. Use `usePathname()` to determine the active tab:
  - `/races`, `/[raceId]`, `/[raceId]/dashboard` → "Races" active
  - `/maintenance` → "Maintenance" active
  - `/results` → "Results" active
- Active tab styling: `text-foreground` with a bottom border/underline in `border-primary` (or `bg-accent` pill — pick whichever matches existing hover states best, see `Account` button styling in current header for reference). Inactive tabs: `text-muted-foreground hover:text-foreground`.
- Icons (lucide-react): Races = `Flag`, Maintenance = `CalendarDays`, Results = `Trophy`. Show icon + label on `sm:` and up.
- Only rendered on `sm:` and up (`hidden sm:flex`).

#### 2.3 `components/app/bottom-nav.tsx` (new, client component)
- Fixed bottom bar, **mobile only** (`sm:hidden`): `fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur-md`.
- Four items: **Races** (`Flag`), **Maintenance** (`CalendarDays`), **Results** (`Trophy`), **Account** (`User`) — same active-route logic as the top nav, plus `/profile` → "Account" active.
- Each item: icon (h-5 w-5) stacked above a small label (`text-[10px]` or `text-xs`), centered, equal-width flex columns, `py-2`.
- Active item: `text-primary`; inactive: `text-muted-foreground`.

#### 2.4 `components/app/header.tsx` updates
- Desktop (`sm:` and up): keep the "TriPlan" logo on the left; render `<TopNav />` next to it (or centered); keep the Logout icon button on the far right. The existing "Account" button can be removed from the header on desktop since Account is now a tab — or kept as a redundant shortcut if it doesn't crowd the layout. Prefer removing it for cleanliness since `/profile` is reachable via the bottom nav (mobile) and... actually on desktop there's no bottom nav, so **keep an "Account" entry accessible on desktop** — simplest: include "Account" as a 4th item in `<TopNav />` on desktop too (Races / Maintenance / Results / Account), keeping Logout as the separate icon button it already is.
- Mobile (`<sm`): header shows just the logo + Logout icon (compact, as today minus the Account button). `<BottomNav />` is rendered by the layout (see 2.5), not inside the header itself, so it persists even if a page doesn't render `<Header>`.
- `backLink`/`backLinkLabel`/`isProfilePage` props: keep for the secondary "Back to Races" / "Back to Plan" breadcrumbs on race detail/dashboard pages — these are additive to the main nav, not a replacement.

#### 2.5 Bottom nav placement & layout padding
- Render `<BottomNav />` once in `app/layout.tsx` (it already wraps all pages), but **only when the user is authenticated** — simplest approach: render it unconditionally, but make it self-hide via CSS on auth routes is awkward from a layout server component. Instead: render `<BottomNav />` inside each protected page alongside `<Header>` is also awkward (rendered N times). 

  **Chosen approach**: Add a small server component `components/app/app-shell.tsx` that protected pages already implicitly share via the `(protected)` route group — create `app/(protected)/layout.tsx` if it doesn't exist, and render `<BottomNav />` there once, plus add `pb-16 sm:pb-0` to the page body wrapper so content isn't hidden behind the fixed bar. Auth pages (`(auth)` group) are unaffected.
- Check whether `app/(protected)/layout.tsx` already exists; if not, create it as a minimal pass-through layout (`{children}`) plus `<BottomNav />`.

### Definition of done
- [ ] `/`, `/races`, `/maintenance`, `/results` all resolve correctly for a logged-in user; `/` redirects per `landing_page` (default `/races`).
- [ ] Top tab bar visible and functional on desktop (≥640px); bottom tab bar visible and functional on mobile (<640px); never both at once.
- [ ] Active tab/item correctly highlighted on all routes, including `/[raceId]` and `/[raceId]/dashboard` (both count as "Races").
- [ ] No layout shift/overlap: page content has enough bottom padding to clear the mobile bottom nav.
- [ ] Light and dark mode both look correct for both nav variants.

---

## Step 3 — Account Settings: Maintenance defaults editor + Landing Page preference

### Goal
Add two new things to `/profile` → Preferences: (a) a "Maintenance Training" default weekly schedule editor (the 7×2 grid of AM/PM cards users can pre-fill), and (b) a "Landing Page" dropdown matching the existing Units/Theme selects.

This step also builds the **shared grid/cell components** that Step 4 (the live Maintenance Training page) will reuse — build them generically now.

### Files
- **New**: `lib/maintenance-colors.ts`
- **New**: `components/app/maintenance-cell.tsx`
- **New**: `components/app/maintenance-grid.tsx`
- **New**: `components/app/maintenance-defaults-form.tsx`
- **Update**: `app/actions.ts` (add `updateMaintenanceDefaults`, extend `updateProfile`)
- **Update**: `components/app/profile-form.tsx` (landing page dropdown)
- **Update**: `app/(protected)/profile/page.tsx` (render the new section)

### Requirements

#### 3.1 `lib/maintenance-colors.ts`
Define the badge styling per workout type, **derived from the same base hue used for each type's icon** in `workout-icons.tsx` (Swim=blue-400, Bike=green-400, Run=orange-400, Strength=red-400, Rest=gray-400, Other=purple-400) — same family of colors as the training plan page, just adapted into a "badge" look (lighter background, darker/saturated text in light mode; translucent background, lighter text in dark mode). Export something like:

```ts
export type WorkoutCellType = 'Swim' | 'Bike' | 'Run' | 'Strength' | 'Rest' | 'Other'

export const MAINTENANCE_TYPE_STYLES: Record<WorkoutCellType, { badge: string; icon: typeof Waves }> = {
  Swim:     { badge: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300',     icon: Waves },
  Bike:     { badge: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300', icon: Bike },
  Run:      { badge: 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300', icon: Footprints },
  Strength: { badge: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300',         icon: Dumbbell },
  Rest:     { badge: 'bg-gray-100 text-gray-600 dark:bg-gray-500/15 dark:text-gray-400',     icon: BedDouble },
  Other:    { badge: 'bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300', icon: Activity },
}

export const MAINTENANCE_TYPE_ORDER: WorkoutCellType[] = ['Swim', 'Bike', 'Run', 'Strength', 'Rest', 'Other']
```

> The exact shades/opacities above are a starting point and may be refined after Andreas sees them rendered — the constraint is the hue family per type (blue/green/orange/red/gray/the existing "other" purple), matching the training plan page's icon colors.

The **empty cell** style (used everywhere a slot has no type set): `border border-dashed border-border bg-muted/30` with no text/icon.

#### 3.2 `components/app/maintenance-cell.tsx` (client component)
A single AM/PM cell — visually a small rounded "badge/card" (~`h-9` to `h-10`, full width of its grid column, `rounded-md`).

- **Empty state**: dashed border, muted background, no content (per the brief — empty cells show no text, just gray + dotted border).
- **Filled state**: colored badge per `MAINTENANCE_TYPE_STYLES`, showing the workout type icon (h-3.5 w-3.5) + label (e.g. "Swim"), centered both horizontally and vertically. On very narrow mobile columns, the label can be hidden (`hidden xs:inline` / use a custom breakpoint or just rely on `sm:`) and show icon-only if needed — verify it doesn't truncate awkwardly; prefer keeping the label and letting the column be wide enough (2-column mobile layout from Step 4 gives plenty of width).
- **Interaction**: clicking anywhere on the cell opens a selection of the 6 types + an "empty/clear" option. Implementation: overlay a native `<select>` (transparent, `absolute inset-0 opacity-0 cursor-pointer`) on top of the visual badge/card — this gives accessible, keyboard- and touch-friendly dropdown behavior for free, without building a custom popover. `<option value="">` (empty/blank) maps to "clear this cell". On change, call the `onChange(type | null)` prop immediately (no separate save button for individual cells in the live Maintenance page; the defaults editor batches changes — see 3.4).
- Props: `{ value: WorkoutCellType | null; onChange: (value: WorkoutCellType | null) => void; disabled?: boolean }`.

#### 3.3 `components/app/maintenance-grid.tsx` (client component)
Renders the 7-day × 2-session grid of `MaintenanceCell`s, in two responsive layouts sharing the same data:

- **Desktop/tablet (`sm:` and up)**: CSS grid, 7 columns (one per day) × 2 rows (AM, PM), with a header row of day labels above. For the *defaults editor* (Step 3), there's also a leading label column (AM/PM row labels) — so 8 columns total there; for the *live page* (Step 4), day headers are full dates, no leading label column needed since AM/PM row labels sit to the left instead.
- **Mobile (`<sm`)**: **transposed** — 2 columns (AM, PM) × 7 rows (one per day), with day labels as row headers on the left and AM/PM as column headers on top.
- Make this component flexible via props so both Step 3 and Step 4 can use it:
  ```ts
  interface MaintenanceGridProps {
    columns: { key: string; label: string; sublabel?: string; isToday?: boolean }[] // 7 days
    values: Record<string, { am: WorkoutCellType | null; pm: WorkoutCellType | null }> // keyed by column key
    onChange?: (columnKey: string, session: 'am' | 'pm', value: WorkoutCellType | null) => void
    readOnly?: boolean
  }
  ```
- `isToday` on a column draws a visual highlight (e.g. `text-primary font-semibold` on that day's header, or a small underline/dot) — used by Step 4's live page, irrelevant for the defaults editor (all `isToday: false`).

#### 3.4 `components/app/maintenance-defaults-form.tsx` (client component)
Lives in the Profile page's Preferences section, under a "Maintenance Training" subheading.

- Renders `<MaintenanceGrid>` with `columns` = Mon–Sun (generic labels, no dates, `isToday: false` for all), seeded from `profile.maintenance_defaults`.
- Local state only — edits via `onChange` update local state, **not** persisted until Save.
- **Clear** button: resets all 14 cells to `null` in local state (with a confirm — see below — or just immediate, since Save is still required to persist; immediate local clear is fine, no confirm needed for this one since nothing is saved yet).
- **Save** button: calls `updateMaintenanceDefaults(formData)` server action with the full 14-cell JSON. On success, show an inline success message (same pattern as `ProfileForm`'s "Your preferences have been saved" — fade-in text below the buttons, auto-dismiss after ~3s).
- Layout: place this as its own `rounded-lg border border-border bg-card p-6 space-y-6` block, consistent with `ProfileForm`'s card, either as a sibling card right after `ProfileForm` within the "Preferences" section, or integrated as an additional section inside the same card — a separate card is cleaner given its size.

#### 3.5 `app/actions.ts` additions
```ts
export async function updateMaintenanceDefaults(formData: FormData): Promise<ActionResult> {
  // formData contains a single JSON string field, e.g. "schedule"
  // Validate: object with keys mon..sun, each { am, pm } where values are
  // one of WORKOUT_TYPES or null. Reject anything else.
  // supabase.from('profiles').update({ maintenance_defaults: parsed }).eq('id', user.id)
  // No revalidatePath needed (consumed client-side / on next maintenance page load)
}
```

Extend `updateProfile`:
```ts
const landingPage = formData.get('landing_page') as string
if (!['races', 'maintenance', 'results'].includes(landingPage)) return { error: 'Invalid landing page value.' }
// include landing_page in the .update({...}) call
```

#### 3.6 Landing page dropdown (`components/app/profile-form.tsx`)
Add a third `<select>` block, styled identically to the existing Units/Theme selects (`relative` wrapper, `ChevronDown` icon, same classes), labeled **"Landing Page"**, with options:
```html
<option value="races">Your Races</option>
<option value="maintenance">Maintenance Training</option>
<option value="results">Race Results</option>
```
Wire it up the same way as `units`/`theme` (local state + included in the submitted `formData`).

### Definition of done
- [ ] Profile page shows a new "Maintenance Training" card with the 14-cell grid (Mon–Sun × AM/PM), Clear and Save buttons.
- [ ] Save persists to `profiles.maintenance_defaults` and shows a success message; reloading the page shows the saved values.
- [ ] Clear empties all 14 cells locally (requires Save to persist).
- [ ] New "Landing Page" dropdown saves to `profiles.landing_page` via the existing Save Preferences flow, and `/` now redirects accordingly (built in Step 2).
- [ ] Grid is usable on mobile (transposed 2×7) and desktop (7×2 + label column); dropdown-on-click works via touch and mouse; light/dark mode both correct.

---

## Step 4 — Maintenance Training page (`/maintenance`)

### Goal
Build the live weekly planner: week navigation, AM/PM grid (reusing Step 3's components), paste-from-defaults, and week/month/year summary stats.

### Files
- **Replace placeholder**: `app/(protected)/maintenance/page.tsx`
- **New**: `components/app/maintenance-week-view.tsx` (client component, the bulk of the page)
- **New**: `lib/date-utils.ts` (week range helpers, if not trivially inlined)
- **Update**: `app/actions.ts` (add `upsertMaintenanceEntry`, `pasteDefaultSchedule`)
- Reuses: `maintenance-grid.tsx`, `maintenance-cell.tsx`, `maintenance-colors.ts` from Step 3

### Requirements

#### 4.1 Page/data flow (`app/(protected)/maintenance/page.tsx`, server component)
- Read `searchParams.week` (a `YYYY-MM-DD` date string representing the **Monday** of the displayed week). If absent/invalid, default to the Monday of the current week (`startOfWeek(new Date(), { weekStartsOn: 1 })`).
- Fetch in parallel:
  - `profiles` row for `units` and `maintenance_defaults`.
  - `maintenance_entries` for the **entire year containing the displayed week's Monday** (`date >= Jan 1` and `<= Dec 31` of that year) — this single query supplies the live week grid *and* the month/year summary stats (see 4.4). For a personal-use app this is a small, cheap query; no pagination needed.
- Pass `weekStart`, `entries`, `defaults`, `units` to `<MaintenanceWeekView>`.

#### 4.2 Header row: navigation + paste button
Two groups, vertically aligned, above the grid:

- **Left**: `<` button, the date range label, `>` button, and a **Today** button — in that order (arrows flank the range label, Today sits to the right of the right arrow per the brief's "Today button in the middle").
  - Date range format: if the week's Mon–Sun fall in the same month, `"8–14 Jun 2026"`; if they span two months in the same year, `"29 Jun – 5 Jul 2026"`; if they span a year boundary, `"29 Dec 2026 – 4 Jan 2027"`.
  - `<` / `>` navigate via `router.push` updating the `week` search param to the previous/next Monday (`subWeeks`/`addWeeks` by 1).
  - **Today** button: navigates to the current week. Its styling reflects whether the user is *currently viewing* the current week: active/highlighted (e.g. `bg-primary/10 text-primary`) when `isSameWeek(weekStart, today, { weekStartsOn: 1 })`, otherwise neutral/ghost. This doubles as the "visual indicator that you're in the current week" the brief asks for. Clicking it when already on the current week is a no-op.
- **Right**: a single icon button with the `ClipboardPaste` icon (lucide-react), vertically centered with the left group. Tooltip/aria-label: "Paste default schedule".

#### 4.3 The grid
- Use `<MaintenanceGrid>` with `columns` = the 7 dates of the displayed week:
  - Desktop label: `"Mon, 8 Jun 2026"` (full date) — or, to honor the brief's space-saving option, show just `"Mon"` / `"Tue"` etc. as the column header (3-letter abbreviation) since the date *range* is already shown next to the nav arrows. **Use the abbreviated form** (`Mon`, `Tue`, …) for column headers; the date range covers the "when".
  - `isToday: true` for whichever column matches `new Date()` (only meaningful when viewing the current week) — give that column header a distinct style (e.g. `text-primary font-semibold` plus a small dot/underline).
- Row labels: `AM` / `PM`.
- Cell values come from `maintenance_entries` for that week (keyed by date+session); `onChange` calls `upsertMaintenanceEntry(date, session, type)` (see 4.5), then the page re-renders via `revalidatePath('/maintenance')`.
- Mobile: transposed 2 (AM/PM) × 7 (days) per `MaintenanceGrid`'s responsive behavior from Step 3 — day row labels show `"Mon 8 Jun"` (short date) since there's no separate header row to carry the date.

#### 4.4 Paste-from-defaults button
- On click, open a small confirmation `<Modal>` (reuse `components/ui/modal.tsx`): title "Paste default schedule?", body: "This will apply your saved weekly schedule to **{date range}**, overwriting any existing entries for this week. Continue?" with Cancel / Confirm (`variant="destructive"`-style isn't quite right since it's not deleting data permanently from history, but it *does* overwrite — use a clear affirmative button, e.g. `variant="default"` labeled "Paste Schedule").
- On confirm, call `pasteDefaultSchedule(weekStartDate)`. The server action:
  1. Reads `profiles.maintenance_defaults` for the user.
  2. For each of the 7 days × 2 sessions, computes the actual date (`weekStart + dayOffset`) and upserts (or deletes, if the default is `null`) the corresponding `maintenance_entries` row — i.e. the displayed week becomes an exact copy of the defaults (cells with a `null` default become empty, clearing any existing entry).
  3. `revalidatePath('/maintenance')`.
- If `maintenance_defaults` is empty/unset (`'{}'`), show a friendly message instead of pasting nothing silently — e.g. disable the paste button with a tooltip "Set up your default schedule in Account Settings first," or let the click proceed but the confirm dialog says "You haven't set up a default schedule yet — set one up in Account Settings."

#### 4.5 `app/actions.ts` additions
```ts
export async function upsertMaintenanceEntry(date: string, session: 'AM' | 'PM', type: WorkoutCellType | null): Promise<ActionResult> {
  // if type is null: delete the row matching (user_id, date, session)
  // else: upsert (user_id, date, session, type) with onConflict: 'user_id,date,session'
  // revalidatePath('/maintenance')
}

export async function pasteDefaultSchedule(weekStartDate: string): Promise<ActionResult> {
  // as described in 4.4
}
```

#### 4.6 Summary stats (below the grid)
Three rows, each showing icon+count pairs (only types with count > 0) for the 6 workout types in `MAINTENANCE_TYPE_ORDER`, styled like the existing workout-count row on `RaceCard` (icon `h-3.5 w-3.5` + number, `gap-3` between type groups):

- **Row 1 — "This week"**: counts from `maintenance_entries` within the *displayed* week (Mon–Sun of `weekStart`).
- **Row 2 — "This month"**: counts within the calendar month containing `weekStart`.
- **Row 3 — "This year"**: counts within the calendar year containing `weekStart`.

Each row gets a small muted label (`This week` / `This month` / `This year`) to its left (or above on mobile). All three derive from the single year-range query fetched in 4.1 — bucket client-side (or server-side before passing to the component) using `date-fns` (`isSameWeek`, `isSameMonth`, `isSameYear` against `weekStart`).

> Design note: these stats reflect the **displayed week** (and its containing month/year), not necessarily "today" — so as the user navigates weeks, all three rows update consistently together.

### Definition of done
- [ ] `/maintenance` loads the current week by default; `?week=YYYY-MM-DD` navigates correctly via arrows, with Today returning to the present week and visually indicating when already there.
- [ ] Date range label formats correctly across month/year boundaries.
- [ ] Grid cells: empty = dashed/muted, filled = colored badge with icon+label; click → dropdown of 6 types + clear; changes persist immediately.
- [ ] Mobile shows the transposed 2×7 layout; desktop shows 7×2 with abbreviated day headers + date-range label.
- [ ] Paste button shows confirmation, then correctly overwrites the week from `maintenance_defaults` (including clearing cells whose default is empty).
- [ ] Three summary rows show correct counts for week/month/year, update when navigating weeks, and only show types with count > 0.
- [ ] Light/dark mode correct; works on mobile and desktop.

---

## Step 5 — Race Results modal

### Goal
Let users record the 13 race-result fields for completed races via a modal, opened from a new "Results" button on the race detail page.

### Files
- **New**: `lib/time-format.ts`
- **New**: `components/app/race-results-modal.tsx`
- **Update**: `components/ui/modal.tsx` (optional `size` prop for a wider modal)
- **Update**: `components/app/workout-list.tsx` (add the Results button + modal trigger)
- **Update**: `app/(protected)/[raceId]/page.tsx` (fetch existing `race_results` row, determine "completed" status, pass down)
- **Update**: `app/actions.ts` (add `upsertRaceResult`)

### Requirements

#### 5.1 `lib/time-format.ts`
Small helpers for converting between display strings and stored integer seconds:

```ts
// "1:23:45" or "23:45" or "45" -> seconds (supports H:MM:SS, M:SS, or bare seconds)
export function parseTimeToSeconds(value: string): number | null

// seconds -> "H:MM:SS" (for times) 
export function formatSecondsToHMS(seconds: number | null): string

// "1:45" (MM:SS) -> seconds, and the reverse, for pace fields
export function parsePaceToSeconds(value: string): number | null
export function formatSecondsToPace(seconds: number | null): string
```
Validation regexes: time `^\d{1,3}:[0-5]\d:[0-5]\d$` (allow up to 999 hours for ultra distances) or `^\d{1,2}:[0-5]\d$` (MM:SS, treated as 0 hours); pace `^\d{1,2}:[0-5]\d$`.

#### 5.2 Determining "completed" races
A race is completed when `new Date(race.date) < startOfToday()` — mirror the existing logic in `race-card.tsx` (`differenceInCalendarDays(raceDate, today) < 0`). Compute this in `app/(protected)/[raceId]/page.tsx` and pass `isCompleted: boolean` down.

#### 5.3 Results button (`components/app/workout-list.tsx`)
- Only rendered when `isCompleted` is true.
- Placed in the same button group as the existing "Dashboard" button (to its left or right — pick whichever reads better; suggest order: Results, Dashboard, Add Workout).
- Styling identical to the Dashboard button (`bg-primary text-primary-foreground hover:bg-primary/90 px-3 sm:px-4`), icon = `Timer` (lucide-react), label "Results" hidden below `sm:` (`<span className="hidden sm:inline">Results</span>`) — i.e. icon-only on mobile, exactly like Dashboard.
- onClick opens `<RaceResultsModal>`.

#### 5.4 `components/app/race-results-modal.tsx`
- Reuses `<Modal>`. Title: "Race Results — {race.name}".
- **All 13 fields are independent, fully-manual text inputs** — no auto-calculation or cross-field validation beyond format checks. Group them visually with small section headers for readability:

  | Section | Fields |
  |---|---|
  | Swim | Distance (`m`/`y` per `units`), Time (`H:MM:SS`), Pace (`MM:SS` per 100m/100y) |
  | Transition 1 | T1 Time (`H:MM:SS`) |
  | Bike | Distance (`km`/`mi`), Elevation Gain (`m`/`ft`), Time (`H:MM:SS`), Speed (`km/h`/`mph`, decimal) |
  | Transition 2 | T2 Time (`H:MM:SS`) |
  | Run | Distance (`km`/`mi`), Time (`H:MM:SS`), Pace (`MM:SS` per km/mi) |
  | Total | Total Time (`H:MM:SS`) |

- Layout: 2-column grid (`grid grid-cols-2 gap-4`) per section on `sm:` and up, single column on mobile — same grid pattern already used in `add-workout-modal.tsx`. Section headers as small `text-sm font-semibold text-muted-foreground uppercase tracking-wide` labels.
- Distance/elevation/speed fields: `<Input type="number" step="0.01">`. Time/pace fields: `<Input type="text" placeholder="H:MM:SS">` / `placeholder="MM:SS"`, validated on blur with the regexes from 5.1 (same pattern as the duration field in `add-workout-modal.tsx` — inline error text below the field, doesn't block typing, blocks submit).
- All fields optional (a user might only have swim+bike data, etc.) — `null` if left blank.
- Pre-fill from the existing `race_results` row if one exists (passed in as a prop); otherwise all fields blank.
- Footer buttons: Cancel / Save — same as other modals. No Delete needed (saving with all-blank fields is equivalent to "no results", but you can optionally add a "Clear all" ghost button that blanks the form locally without saving).
- Because this modal has ~13 fields, consider widening it: add an optional `size?: 'default' | 'lg'` prop to `components/ui/modal.tsx` (`lg` → `max-w-2xl` instead of `max-w-lg`), defaulting to `'default'` so existing modals are unaffected. Use `size="lg"` here, and make the modal body scrollable on short viewports (`max-h-[85vh] overflow-y-auto` on the inner content area).

#### 5.5 `app/actions.ts` — `upsertRaceResult`
```ts
export async function upsertRaceResult(raceId: string, formData: FormData): Promise<ActionResult> {
  // Parse all 13 fields via lib/time-format.ts helpers; numeric fields via Number() or null if blank.
  // Validate time/pace formats server-side too (defense in depth) — return { error } with a
  // clear message if any provided value fails its regex.
  // supabase.from('race_results').upsert({ race_id: raceId, user_id: user.id, ...fields }, { onConflict: 'race_id' })
  // revalidatePath(`/${raceId}`)
  // revalidatePath('/results')
}
```

#### 5.6 Data fetching in `app/(protected)/[raceId]/page.tsx`
Add a third parallel query: `supabase.from('race_results').select('*').eq('race_id', raceId).maybeSingle()`. Pass the result (or `null`) plus `isCompleted` and `units` to `<WorkoutList>`, which forwards them to `<RaceResultsModal>`.

### Definition of done
- [ ] "Results" button (Timer icon) appears only on completed races, icon-only on mobile, icon+label on desktop, styled like "Dashboard".
- [ ] Modal opens with all 13 fields, grouped by discipline, correct units shown per `profiles.units`.
- [ ] Saving persists to `race_results` (upsert, one row per race); reopening the modal shows previously saved values.
- [ ] Time/pace fields validate format on blur with inline errors; numeric fields accept decimals.
- [ ] Light/dark mode correct; modal usable on mobile (scrolls if needed) and desktop.

---

## Step 6 — Race Results page (`/results`)

### Goal
A dedicated page listing every completed race as a card, showing result highlights with an expandable full breakdown, and an "Add results" prompt for races without data yet. Edits here use the **same modal** from Step 5, so the two stay in sync automatically via `revalidatePath`.

### Files
- **Replace placeholder**: `app/(protected)/results/page.tsx`
- **New**: `components/app/results-list.tsx` (client component)
- **New**: `components/app/results-card.tsx` (client component)
- Reuses: `race-results-modal.tsx`, `time-format.ts`

### Requirements

#### 6.1 Page (`app/(protected)/results/page.tsx`, server component)
- Fetch: `profile.units`, all `races` where `date < today` ordered by `date desc` (most recent completed race first), and all `race_results` rows for those race IDs in one query (`.in('race_id', ids)`).
- If there are no completed races at all, show the existing empty-state pattern (`border border-dashed border-border p-12 text-center`, message like "No completed races yet — results will appear here once a race date has passed.").
- Otherwise render `<ResultsList races={...} results={...} units={...} />`.

#### 6.2 `components/app/results-card.tsx`
One card per completed race — **not a literal table row**, a `rounded-lg border border-border bg-card` block, consistent with `RaceCard`'s styling.

- **Header** (always visible): race name (bold, truncate with `title` attr for full text on hover), then a smaller muted line with location + date: `"{location} · {format(date, 'd MMM yyyy')}"`. If `location` is null, just the date. This addresses the "name can be long" concern — name gets its own line and can wrap/truncate; location+date is secondary and smaller.
- **Right side of header**: if results exist, show **Total Time** prominently (large, monospace, e.g. `text-lg font-mono`); if not, show a muted "Add results" label/button. Also include a small chevron (`ChevronDown`/`ChevronUp`) to expand/collapse the full breakdown, and a `Pencil` icon button to open the edit modal directly.
- **Collapsed state**: header only, plus (if results exist) a compact one-line summary row with small icons for Swim/Bike/Run sub-times (e.g. `Waves 0:28:30 · Bike 2:41:10 · Footprints 1:52:00`), using the same icon set as `workout-icons.tsx`. If no results yet, collapsed state is just the header with the "Add results" affordance — clicking it (or the row) opens the modal directly, no need to expand first.
- **Expanded state** (only reachable/useful when results exist): a responsive grid of all 13 fields grouped by discipline (Swim / T1 / Bike / T2 / Run / Total), `grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4`, each cell showing a small label (`text-xs text-muted-foreground`) above the value (`font-mono text-sm`). Fields with no value show `–`.
- Clicking the `Pencil` icon (or the "Add results" affordance) opens `<RaceResultsModal>` pre-filled (or empty) for that race — exactly the modal from Step 5.

#### 6.3 `components/app/results-list.tsx`
- Maps over completed races, rendering a `<ResultsCard>` for each, in a `space-y-3` (or `space-y-4`) vertical stack — cards naturally stack well on both mobile and desktop, avoiding the horizontal-overflow problem of a literal 13-column table.
- Manages which card is expanded (only one at a time, or independent — independent is simpler and fine) and which race's modal is open (shared single modal instance, keyed by selected race, same pattern as `RaceList`'s single `AddEditRaceModal` instance reused for add/edit).

#### 6.4 Sync between modal and page
Because `upsertRaceResult` calls `revalidatePath('/results')` (Step 5.5) in addition to `revalidatePath('/[raceId]')`, saving from either the race detail page's modal or the results page's modal refreshes both — no extra work needed beyond making sure both call paths use the same `upsertRaceResult` action and the same `<RaceResultsModal>` component.

### Definition of done
- [ ] `/results` lists all completed races, most recent first, as cards (not a scrolling table).
- [ ] Races without results show a clear "Add results" affordance; clicking opens the modal.
- [ ] Races with results show Total Time + a compact Swim/Bike/Run summary when collapsed, and the full 13-field breakdown when expanded.
- [ ] Editing from `/results` and from a race's detail page both update the same underlying row and both views reflect the change after save.
- [ ] Long race names/locations don't break the layout on mobile (wrap/truncate gracefully).
- [ ] Light/dark mode correct on both mobile and desktop.

---

## Step 7 — Final polish & QA

### Goal
Sweep for consistency, accessibility, and correctness across everything built in Steps 1–6.

### Requirements
- [ ] `npm run lint` and `npm run build` both pass cleanly.
- [ ] Manually test every new page/component in **light and dark mode**.
- [ ] Manually test at **mobile (~375px)**, **tablet (~768px)**, and **desktop (~1280px+)** widths:
  - Top tabs vs. bottom nav never overlap or double up.
  - Maintenance grid transposes correctly on mobile (2×7) vs desktop (7×2).
  - Results modal scrolls correctly on short mobile viewports.
  - Results cards don't overflow horizontally on mobile.
- [ ] Verify `profiles.units` (metric/imperial) correctly drives all unit labels: maintenance page has none, but Results modal/page must show `m/y`, `km/mi`, `m/ft`, `km/h`/`mph` correctly.
- [ ] Verify RLS: a second test account cannot see/edit another user's `maintenance_entries` or `race_results`.
- [ ] Verify CSV export/import (`app/api/export/route.ts`, `importCsvData`) still work unaffected — these new tables are intentionally **out of scope** for CSV import/export in this round.
- [ ] Update `CLAUDE.md` — add the new routes, tables, and components to the "Route Structure", "Database", and "Component Patterns" sections so future sessions have accurate context.
- [ ] Spot-check that navigating away mid-edit (e.g. closing the results modal without saving) doesn't leave stale state on reopening.

---

## Open items / explicitly out of scope for this round
- CSV import/export does not cover `maintenance_entries` or `race_results` (could be a future addition).
- No charts/trends for race results over time (the Results page itself serves as the historical record; charting could be a future enhancement, e.g. reusing `training-charts.tsx` patterns).
- No "optional" workout modifier (as seen in the inspiration screenshot) — the 6 existing workout types are the only maintenance-cell options, matching the training plan page.
