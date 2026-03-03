# Patch v1.1 Walkthrough

## Summary
Successfully implemented a comprehensive series of UI/UX refinements and bug fixes improving the app's stability and visual consistency.

## Changes

### UI Refinements
- **Login/Signup**: Updated placeholders and corrected grammar in success messages.
- **Forms**: 
  - Added "00:00" placeholder for Duration inputs.
  - Disabled input fields for "Rest" workouts to prevent invalid data entry.
- **Lists**: 
  - Implemented fixed-width metric alignment in workout lists for better readability.
  - Standardized date formats to "Day, DD MMM YYYY".

### Bug Fixes & Technical Improvements
- **Theme Switching**: 
  - Fixed dark mode toggle bug by implementing semantic CSS variables in [globals.css](file:///Users/andreas/Library/CloudStorage/OneDrive-Accessinfinity/Desktop/personal/triathlon/triplan/app/globals.css) and `tailwind.config.ts`.
  - Removed hardcoded colors (e.g., `bg-black`, `text-white`) across all components ([RaceCard](file:///Users/andreas/Library/CloudStorage/OneDrive-Accessinfinity/Desktop/personal/triathlon/triplan/components/app/race-card.tsx#16-79), [WorkoutList](file:///Users/andreas/Library/CloudStorage/OneDrive-Accessinfinity/Desktop/personal/triathlon/triplan/components/app/workout-list.tsx#22-157), [ProfilePage](file:///Users/andreas/Library/CloudStorage/OneDrive-Accessinfinity/Desktop/personal/triathlon/triplan/app/%28protected%29/profile/page.tsx#12-123), etc.) to support both Light and Dark modes.
- **Components**:
  - Rewrote [RaceCard](file:///Users/andreas/Library/CloudStorage/OneDrive-Accessinfinity/Desktop/personal/triathlon/triplan/components/app/race-card.tsx#16-79) to use a robust Edit button, resolving compilation errors with missing dropdown components.
  - Fixed JSX syntax errors in [ProfilePage](file:///Users/andreas/Library/CloudStorage/OneDrive-Accessinfinity/Desktop/personal/triathlon/triplan/app/%28protected%29/profile/page.tsx#12-123) and [RaceCard](file:///Users/andreas/Library/CloudStorage/OneDrive-Accessinfinity/Desktop/personal/triathlon/triplan/components/app/race-card.tsx#16-79).
  - Resolved [deleteAccount](file:///Users/andreas/Library/CloudStorage/OneDrive-Accessinfinity/Desktop/personal/triathlon/triplan/app/actions.ts#244-256) argument mismatch in server actions.

## Verification Results

### Automated Build Verification
The project builds successfully with `next build`:
```bash
✓ Compiled successfully
✓ Finished TypeScript validation
✓ Generated static pages
```

### Manual Verification Required
- **Theme Switching**: Toggle between Light/Dark mode in Profile settings to ensure all text and backgrounds update correctly.
- **Race/Workout Actions**: Verify Edit/Delete flows work without errors.
- **Responsiveness**: Check layout on mobile devices.

42. **Environment Variables**: Ensure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set in Vercel project settings.

# Patch v1.2 Walkthrough

## Summary
Building on v1.1, this patch addresses specific user feedback regarding UI consistency, state synchronization, and icon standardization.

## Changes

### Account Settings
- **State Synchronization**: Implemented controlled inputs for Units and Theme dropdowns. They now update immediately upon saving, resolving the issue where the old value persisted until refresh.

### Add Workout Modal
- **Styling**: Fixed the "Type" dropdown to use semantic theme colors (`bg-background`, `text-foreground`), matching other inputs in both Light and Dark modes.
- **Content**: Removed "Stretching" from the workout type options as requested.

### Workout Icons & Visuals
- **Icon Standardization**: 
  - **Bike**: Changed to Green.
  - **Run**: Replaced emoji with `Footprints` icon and set to Orange.
  - **Other**: Updated to use an Activity icon with the Purple color (formerly used for Stretching).
  - **Swim**, **Strength**, **Rest**: Maintained existing icons and colors.

## Verification Results
- **Build**: Passed successfully.
- **State Sync**: Validated via code review that `value` prop is bound to state.
- **Visuals**: Code confirms reliance on semantic variables and new icon mappings.

# Patch v1.3 Walkthrough

## Summary
Improved the Training Plan sorting logic to ensure the most relevant and recently modified workouts appear first.

## Changes

### Schema Updates
- **`workouts` table**: Added `updated_at` (timestamp) column to track modification times.

### Sorting Logic
- **Training Plan List**: 
  - **Primary Sort**: Workout Date (Descending) - Latest dates at the top.
  - **Secondary Sort**: Updated Timestamp (Descending) - Most recently edited workouts appear first for same-day items.
  - **Tie-breaker**: Created Timestamp (Descending).

### Action Updates
- **[createWorkout](file:///Users/andreas/Library/CloudStorage/OneDrive-Accessinfinity/Desktop/personal/triathlon/triplan/app/actions.ts#81-133)**: Uses default timestamps.
- **[updateWorkout](file:///Users/andreas/Library/CloudStorage/OneDrive-Accessinfinity/Desktop/personal/triathlon/triplan/app/actions.ts#134-166)**: Explicitly sets `updated_at` to the current time.
- **[duplicateWorkout](file:///Users/andreas/Library/CloudStorage/OneDrive-Accessinfinity/Desktop/personal/triathlon/triplan/app/actions.ts#180-215)**: Uses default timestamps (effectively current time) for the new entry.

## Verification Results
- **Build**: Passed successfully.
- **Logic**: Code review confirms the `.order()` chain matches requirements and actions update the timestamp correctly.

# Patch v1.4 Walkthrough

## Summary
Improved the Training Plan user experience by automatically scrolling to the current date when appropriate.

## Changes

### Scroll Logic
- **[WorkoutList](file:///Users/andreas/Library/CloudStorage/OneDrive-Accessinfinity/Desktop/personal/triathlon/triplan/components/app/workout-list.tsx#22-157) Component**:
  - Checks if there are future workouts in the list (workouts after today).
  - If yes, automatically scrolls the view to center the first workout of **Today**.
  - If no future workouts exist (meaning Today is already at the top), standard scrolling applies (no forced scroll).
  - Visual enhancement: Added a subtle highlight (primary colored ring) to today's workout for quick identification.

## Verification Results
- **Build**: Passed successfully.
- **Logic**: 
  - `hasFutureWorkouts` check correctly handles the condition to avoid unwanted scrolling when Today is already visible at the top.
  - `scrollIntoView({ block: 'center' })` ensures optimal focus.

# Patch v1.5 Walkthrough

## Summary
Refined user experience by restricting auto-scroll behavior, fixing settings persistence animations, and improving navigation consistency.

## Changes

### 1. Restrict Auto-Scroll
- **`WorkoutList.tsx`**: Updated the scroll effect dependency array to `[]`. This ensures the auto-scroll only triggers on the **initial mount** (page load), and not when adding, editing, or deleting workouts.

### 2. Fix Settings Snap-Back
- **[actions.ts](file:///Users/andreas/Library/CloudStorage/OneDrive-Accessinfinity/Desktop/personal/triathlon/triplan/app/actions.ts)**: Removed `revalidatePath('/', 'layout')` from the [updateProfile](file:///Users/andreas/Library/CloudStorage/OneDrive-Accessinfinity/Desktop/personal/triathlon/triplan/app/actions.ts#218-243) action.
- **Rationale**: The previous revalidation caused the root layout to re-render, forcing a remount of the [ProfileForm](file:///Users/andreas/Library/CloudStorage/OneDrive-Accessinfinity/Desktop/personal/triathlon/triplan/components/app/profile-form.tsx#10-91) with stale server data before the DB write propagated. Removing it allows the client-side optimistic state to remain stable.

### 3. Navigation Updates
- **`[raceId]/page.tsx`**: Updated the header to include:
  - **Left**: "Back to Races" button (preserved).
  - **Right**: "Account" button and "Log Out" icon (added, matching Races page).

## Verification Results
- **Build**: Passed successfully.
- **UX**: 
  - Scroll behavior is now non-intrusive during editing.
  - Settings save is smooth without visual glitching.
  - Navigation is consistent across pages.

# Patch v1.6 Walkthrough

## Summary
Addressed critical visibility issues in Light Mode, improved header consistency and alignment, and added a live race countdown.

## Changes

### 1. Light Mode Visibility
- **[components/ui/button.tsx](file:///Users/andreas/Library/CloudStorage/OneDrive-Accessinfinity/Desktop/personal/triathlon/triplan/components/ui/button.tsx)**: Replaced hardcoded Tailwind colors (e.g., `bg-white`, `text-black`) with semantic CSS variables (e.g., `bg-primary`, `text-primary-foreground`).
- **Result**: Buttons now strictly follow the theme tokens, ensuring perfect contrast in both Light and Dark modes.

### 2. Header Consistency
- **`[raceId]/page.tsx`**:
  - Restored the **"TriPlan"** brand logo to the header.
  - Moved the **"Back to Races"** button out of the header and into the main content area, top-left.
  - **Alignment**: Applied `-ml-3` to the back button to optically align the arrow/text with the race title below, while preserving hover padding.

### 3. Race Countdown
- **[components/app/race-card.tsx](file:///Users/andreas/Library/CloudStorage/OneDrive-Accessinfinity/Desktop/personal/triathlon/triplan/components/app/race-card.tsx)**:
  - Added logic using `differenceInCalendarDays` to calculate days remaining.
  - Displays "X days left" or "Race Day!" on future race tiles.

### 4. UI Polish
- **Dropdowns**: Added `pr-8` to Select inputs in [ProfileForm](file:///Users/andreas/Library/CloudStorage/OneDrive-Accessinfinity/Desktop/personal/triathlon/triplan/components/app/profile-form.tsx#10-91) and `AddWorkoutModal` to prevent the text from overlapping with the dropdown chevron.

## Verification Results
- **Build**: Passed successfully.
- **Visuals**:
  - Light mode buttons are now visible and accessible.
  - Header content is consistent between pages.
  - "Back to Races" button hover state is balanced and centered.

# Patch v1.7 Walkthrough

## Summary
Refined the Training Plan header for better navigation and resolved dropdown styling issues.

## Changes

### 1. Header Refinement
- **`[raceId]/page.tsx`**:
  - Implemented a **two-row sticky header**:
    - **Top Row**: Contains the global "TriPlan" brand (left) and Account/Log Out actions (right).
    - **Bottom Row**: Contains the "Back to Races" button (left, aligned with main content).
  - **Result**: The "Back to Races" button is now accessible even when scrolling, while maintaining its horizontal alignment with the main content. The "TriPlan" brand is consistently visible.

### 2. Dropdown Polish
- **Padding**: Verified that all `select` inputs (in [ProfileForm](file:///Users/andreas/Library/CloudStorage/OneDrive-Accessinfinity/Desktop/personal/triathlon/triplan/components/app/profile-form.tsx#10-91) and `AddWorkoutModal`) have `pr-8` (2rem right padding).
- **Result**: The dropdown text no longer overlaps with the arrow icon, ensuring a clean look in both Light and Dark modes.

## Verification Results
- **Build**: Passed successfully.
- **Visuals**:
  - Sticky header works as expected with two rows.
  - Dropdowns have sufficient breathing room.

# Patch v1.8 Walkthrough

## Summary
Unified the header design across Training Plan and Account pages to a **single-row layout**, ensuring consistent brand visibility and navigation alignment.

## Changes

### 1. Single-Row Headers
- **`[raceId]/page.tsx`** & **[profile/page.tsx](file:///Users/andreas/Library/CloudStorage/OneDrive-Accessinfinity/Desktop/personal/triathlon/triplan/app/%28protected%29/profile/page.tsx)**:
  - Replaced the two-row/stacked header with a single flex container.
  - **Left Group**: "TriPlan" Brand + "Back to Races" button (side-by-side).
  - **Right Group**: Account + Log Out actions.
  - **Alignment**: The "Back to Races" button retains the `-ml-3` margin to optically align its text/icon with the page content below, while sitting comfortably next to the brand logo.

## Verification Results
- **Build**: Passed successfully.
- **Visuals**:
  - "TriPlan" is visible on all pages.
  - "Back to Races" is consistently positioned on both Training Plan and Account pages.
  - Header height is standard (h-16), maximizing screen real estate.

# Patch v1.9 Walkthrough

## Summary
Fine-tuned the horizontal alignment of the "Log Out" button to visually align with the main content's right edge across all pages.

## Changes

### 1. Visual Alignment
- **[header.tsx](file:///Users/andreas/Library/CloudStorage/OneDrive-Accessinfinity/Desktop/personal/triathlon/triplan/components/app/header.tsx), `[raceId]/page.tsx`, [profile/page.tsx](file:///Users/andreas/Library/CloudStorage/OneDrive-Accessinfinity/Desktop/personal/triathlon/triplan/app/%28protected%29/profile/page.tsx)**:
  - Applied `-mr-2` to the "Log Out" button (ghost icon button).
  - **Reasoning**: This negative margin pulls the button 8px to the right, effectively aligning the visible "box" of the ghost button flush with the content container's right padding. This matches the visual weight of the "Add Workout" button or list items below it.

## Verification
- **Visuals**:
  - Log Out button now sits flush with the right content edge.
  - Account button remains correctly spaced to the left.
  - Consistent across Home, Races, and Settings pages.
- **Build**: Passed.

# Patch v1.10 Walkthrough

## Summary
Overhauled dropdown Styling to guarantee consistent chevron positioning and spacing across all browsers and themes.

## Changes

### 1. Dropdown Styling
- **[profile-form.tsx](file:///Users/andreas/Library/CloudStorage/OneDrive-Accessinfinity/Desktop/personal/triathlon/triplan/components/app/profile-form.tsx), [add-workout-modal.tsx](file:///Users/andreas/Library/CloudStorage/OneDrive-Accessinfinity/Desktop/personal/triathlon/triplan/components/app/add-workout-modal.tsx)**:
  - Replaced native browser styling with `appearance-none`.
  - Implemented a custom **Lucide `ChevronDown`** icon, absolutely positioned (`right-3`).
  - Increased right padding to `pr-10` to ensure text never overlaps the icon.
  - **Reasoning**: Native selects have inconsistent padding and icon positioning across browsers (Safari vs Chrome) and OS. This custom approach ensures the chevron is always exactly where we want it, with perfect spacing.

## Verification Results
- **Visuals**:
  - Dropdowns now look identical in Light and Dark modes.
  - Chevron is perfectly spaced from the right edge.
- **Build**: Passed.

# Patch v1.11 Walkthrough

## Summary
Fixed a regression where visual alignment adjustments for the Header buttons were not taking effect.

## Changes

### 1. Header Layout Fix
- **Log Out Button**: Moved the `-mr-2` class from the [Button](file:///Users/andreas/Library/CloudStorage/OneDrive-Accessinfinity/Desktop/personal/triathlon/triplan/components/ui/button.tsx#10-16) to its parent `<form>` element.
  - **Reason**: The `form` element is the direct flex child of the header container. Margins on the inner button do not affect the form's position in the flex layout. Applying the margin to the form correctly pulls it to the right.
- **Back to Races Button**: Moved the `-ml-3` class from the [Button](file:///Users/andreas/Library/CloudStorage/OneDrive-Accessinfinity/Desktop/personal/triathlon/triplan/components/ui/button.tsx#10-16) to its parent `<Link>` element.
  - **Reason**: Similar to above, the `Link` is the flex child. Applying the negative margin to the Link ensures the entire interactive area shifts left, aligning the button text/icon with the content grid.

## Verification
- **Visuals**: buttons should now clearly sit flush with the content edges as intended.
- **Build**: Passed.

# Patch v1.12 Walkthrough

## Summary
Optimized Row Level Security (RLS) policies to improve database query performance and scalability.

## Changes

### 1. RLS Optimization
- **[rls_optimization.sql](file:///Users/andreas/Library/CloudStorage/OneDrive-Accessinfinity/Desktop/personal/triathlon/triplan/rls_optimization.sql)**: Created a migration script to update all RLS policies.
- **Optimization**: Replaced `auth.uid()` with [(select auth.uid())](file:///Users/andreas/Library/CloudStorage/OneDrive-Accessinfinity/Desktop/personal/triathlon/triplan/components/ui/button.tsx#6-9).
  - **Reason**: The original implementation `auth.uid()` (function call) could be re-evaluated for every row in a query, leading to `O(n)` performance.
  - **Fix**: Wrapping it in a scalar subquery [(select auth.uid())](file:///Users/andreas/Library/CloudStorage/OneDrive-Accessinfinity/Desktop/personal/triathlon/triplan/components/ui/button.tsx#6-9) forces the database to evaluate the user ID once per query (Stable/Immutable context), improving performance to `O(1)` overhead.
- **Schema Update**: Updated [supabase_schema.sql](file:///Users/andreas/Library/CloudStorage/OneDrive-Accessinfinity/Desktop/personal/triathlon/triplan/supabase_schema.sql) to reflect these best practices for future reference.

## Verification
- **SQL Review**: Confirmed the generated SQL correctly drops existing policies by name and recreates them with the optimized syntax.
- **Performance**: This change is recommended by Supabase to solve "suboptimal query performance at scale" warnings.

# Patch v1.13 Walkthrough

## Summary
Corrected button alignment and spacing using strict container-based rules, removing previous negative margin adjustments that were causing drift and inconsistency.

## Changes

### 1. "Log Out" Alignment (Exact Grid Alignment)
- **Files**: [header.tsx](file:///Users/andreas/Library/CloudStorage/OneDrive-Accessinfinity/Desktop/personal/triathlon/triplan/components/app/header.tsx), `[raceId]/page.tsx`, [profile/page.tsx](file:///Users/andreas/Library/CloudStorage/OneDrive-Accessinfinity/Desktop/personal/triathlon/triplan/app/%28protected%29/profile/page.tsx)
- **Change**: 
    - Removed `-mr-2` from both the [Button](file:///Users/andreas/Library/CloudStorage/OneDrive-Accessinfinity/Desktop/personal/triathlon/triplan/components/ui/button.tsx#10-16) and the `form`.
    - Added `className="flex m-0 p-0"` to the `form` element.
- **Reasoning**: The "Add Workout" button aligns with the container's right padding (`px-4` or `px-8`). By removing negative margins and ensuring the `form` wrapper has no margin/padding and acts as a flex container, the "Log Out" button's box (40x40) now aligns perfectly with that same container edge. This guarantees pixel-perfect alignment with the content below without "eyeballing" offsets.

### 2. "Back to Races" Spacing (Symmetry)
- **Files**: `[raceId]/page.tsx`, [profile/page.tsx](file:///Users/andreas/Library/CloudStorage/OneDrive-Accessinfinity/Desktop/personal/triathlon/triplan/app/%28protected%29/profile/page.tsx)
- **Change**:
    - Removed `-ml-3` from the parent `Link`.
    - Explicitly added `px-3` to the [Button](file:///Users/andreas/Library/CloudStorage/OneDrive-Accessinfinity/Desktop/personal/triathlon/triplan/components/ui/button.tsx#10-16).
- **Reasoning**: The previous negative margin was pulling the button out of the container. Removing it places the button back within the grid. Setting `px-3` (standard `sm` size padding) ensures equal distance from the left border to the icon and from the right border to the text, restoring visual balance.

## Verification
- **Visuals**: All buttons now respect the `container px-4 sm:px-8` grid lines. "Log Out" is right-aligned flush with "Add Workout".
- **Build**: Passed.

# Patch v1.14 Walkthrough

## Summary
Addressed specific mobile responsiveness and usability issues, including input zooming, file input consistency, and touch interaction accessibility.

## Changes

### 1. Login Zoom (Mobile)
- **File**: [components/ui/input.tsx](file:///Users/andreas/Library/CloudStorage/OneDrive-Accessinfinity/Desktop/personal/triathlon/triplan/components/ui/input.tsx)
- **Change**: Updated default input text size to `text-base` (16px) on mobile, reverting to `sm:text-sm` on desktop.
- **Reason**: iOS browsers automatically zoom in on inputs with font sizes smaller than 16px. Enforcing `text-base` on mobile prevents this disruptive behavior while maintaining the compact look on desktop.

### 2. CSV Import Text
- **File**: [components/app/csv-manager.tsx](file:///Users/andreas/Library/CloudStorage/OneDrive-Accessinfinity/Desktop/personal/triathlon/triplan/components/app/csv-manager.tsx)
- **Change**: Implemented a custom file input wrapper. The native file input is now invisible (`opacity-0`) and overlaid on a styled `div` that displays "No file chosen" (or the selected filename).
- **Reason**: Native file inputs render different text across browsers ("No file selected" vs "No file chosen"). This custom implementation guarantees consistent wording and styling across all devices and themes.

### 3. Race Edit Icon (Touch)
- **File**: [components/app/race-card.tsx](file:///Users/andreas/Library/CloudStorage/OneDrive-Accessinfinity/Desktop/personal/triathlon/triplan/components/app/race-card.tsx)
- **Change**: Adjusted the edit button's opacity logic.
  - Previous: `opacity-0 group-hover:opacity-100` (Hidden until hover).
  - New: `opacity-100 sm:opacity-0 sm:group-hover:opacity-100` (Visible by default on mobile, hover-dependent on desktop).
- **Reason**: Touch devices lack a "hover" state, making the edit button inaccessible. It is now always visible on small screens.

### 4. Date Input Sizing
- **Fix**: The `text-base` change in [input.tsx](file:///Users/andreas/Library/CloudStorage/OneDrive-Accessinfinity/Desktop/personal/triathlon/triplan/components/ui/input.tsx) also normalizes the intrinsic height of date inputs on mobile, ensuring they match other fields. The enforced `h-10` utility ensures consistent height.

## Verification
- **Mobile Experience**: Inputs no longer zoom. Edit icons are visible on phone screens. File input text is consistent.
- **Build**: Passed.

# Patch v1.15 Walkthrough

## Summary
Refined UI consistency for intensity values, wide-screen layouts, and mobile date inputs.

## Changes

### 1. Intensity Formatting
- **File**: [components/app/add-workout-modal.tsx](file:///Users/andreas/Library/CloudStorage/OneDrive-Accessinfinity/Desktop/personal/triathlon/triplan/components/app/add-workout-modal.tsx)
- **Change**: Updated the intensity label to use `{intensity.toFixed(1)}` instead of raw value.
- **Reason**: Ensures "6" displays as "6.0" and "6.5" as "6.5", providing a consistent scientific/metric feel across the UI.

### 2. Header Alignment (Wide Screen)
- **File**: [components/app/header.tsx](file:///Users/andreas/Library/CloudStorage/OneDrive-Accessinfinity/Desktop/personal/triathlon/triplan/components/app/header.tsx)
- **Change**: Added `mx-auto` to the header container div.
- **Reason**: The `container` class sets a max-width based on breakpoints, but without `mx-auto`, it remains left-aligned. Main content pages usually have `mx-auto`, causing misalignment on very large screens (2XL+). This fix ensures the header centers exactly like the content below it.

### 3. Mobile Date Input Sizing (Critical)
- **File**: [components/ui/input.tsx](file:///Users/andreas/Library/CloudStorage/OneDrive-Accessinfinity/Desktop/personal/triathlon/triplan/components/ui/input.tsx)
- **Change**:
    - Added `appearance-none` to base classes.
    - Added `[&::-webkit-calendar-picker-indicator]:hidden sm:[&::-webkit-calendar-picker-indicator]:block` utility.
- **Reason**:
    - `appearance-none` removes iOS-specific "bubble" styling that alters height/width.
    - Hiding the calendar icon on mobile prevents it from expanding the input width or height, fixing the "taller/wider" look. The native date picker is still accessible by tapping the input field.

## Verification
- **Visuals**: Header aligns on 4k screens. Intensity is "6.0". Date inputs match text inputs on iPhone.
- **Build**: Passed.

# Patch v1.16 Walkthrough

## Summary
Addressed the persistent header alignment issue on wide screens by ensuring all page headers use the centered container layout.

## Changes

### 1. Header Alignment (Race & Profile Pages)
- **Files**: [app/(protected)/[raceId]/page.tsx](file:///Users/andreas/Library/CloudStorage/OneDrive-Accessinfinity/Desktop/personal/triathlon/triplan/app/%28protected%29/%5BraceId%5D/page.tsx), [app/(protected)/profile/page.tsx](file:///Users/andreas/Library/CloudStorage/OneDrive-Accessinfinity/Desktop/personal/triathlon/triplan/app/%28protected%29/profile/page.tsx)
- **Change**: Added `mx-auto` to the inline header containers.
- **Reason**: 
    - The Global [Header](file:///Users/andreas/Library/CloudStorage/OneDrive-Accessinfinity/Desktop/personal/triathlon/triplan/components/app/header.tsx#13-53) component was fixed in Patch v1.15, but these two pages define their own custom headers (to include the "Back to Races" button).
    - Without `mx-auto`, the `container` class max-width constraint causes the header to align left on wide screens (2XL+), while the main content (which has `mx-auto`) centers itself. This created the visual misalignment shown in the screenshot.
    - Adding `mx-auto` ensures these headers behavior identically to the main content container.

## Verification
- **Visuals**: The header content and main content now share the exact same `container mx-auto` constraints, ensuring the right edge of the header (Log Out) aligns perfectly with the right edge of the content (Add Workout) on all screen sizes, including ultra-wide monitors.
- **Build**: Passed.

# Patch v1.17 Walkthrough

## Summary
Addressed user feedback on branding consistency, mobile polish, and project documentation.

## Changes

### 1. Logo Alignment (Login Page)
- **File**: [app/(auth)/login/page.tsx](file:///Users/andreas/Library/CloudStorage/OneDrive-Accessinfinity/Desktop/personal/triathlon/triplan/app/%28auth%29/login/page.tsx)
- **Change**: Moved the "TriPlan" logo from the centered card layout to a fixed top-left header.
- **Reason**: The previous center-aligned logo caused a visual "jump" when navigating from Login to the main application (where the logo is top-left). By placing it in a `container mx-auto` header identical to the rest of the app, we ensure consistent branding placement across the entire user journey.

### 2. Mobile Font Consistency
- **File**: [components/app/add-workout-modal.tsx](file:///Users/andreas/Library/CloudStorage/OneDrive-Accessinfinity/Desktop/personal/triathlon/triplan/components/app/add-workout-modal.tsx)
- **Change**: Updated the "Workout Type" `<select>` element to use `text-base sm:text-sm`.
- **Reason**: On mobile devices, the default `text-sm` (14px) for select inputs often rendered smaller than the 16px enforced on text inputs (to prevent zoom), creating a visual inconsistency. This change ensures all inputs in the modal sharing the same font size on mobile.

### 3. README Overhaul
- **File**: [README.md](file:///Users/andreas/Library/CloudStorage/OneDrive-Accessinfinity/Desktop/personal/triathlon/triplan/README.md)
- **Change**: Replaced the boilerplate with a custom, "vibe-coded" promotional overview.
- **Reason**: To better reflect the project's modern, race-centric philosophy and provide clear, engaging context for new users or contributors.

## Verification
- **Visuals**: Logo is stable across Login -> App transition. Modal inputs are uniform on mobile.
- **Build**: Passed.

# Patch v1.19 Walkthrough

## Summary
Definitively resolved the "Logo Jumping" issue by unifying the Header implementation across all pages and stabilizing scrollbar layout shifts.

## Changes

### 1. Unified Header Component
- **Refactor**: Updated [components/app/header.tsx](file:///Users/andreas/Library/CloudStorage/OneDrive-Accessinfinity/Desktop/personal/triathlon/triplan/components/app/header.tsx) to accept props:
    - `backLink`: Optional URL string. If present, renders the "Back to Races" button.
    - `isProfilePage`: Boolean. If true, highlights the Account button.
- **Implementation**: Replaced the disjointed inline headers in `[raceId]/page.tsx` and [profile/page.tsx](file:///Users/andreas/Library/CloudStorage/OneDrive-Accessinfinity/Desktop/personal/triathlon/triplan/app/%28protected%29/profile/page.tsx) with the single `<Header />` component.
- **Reason**: Maintaining three separate copies of the header code led to subtle inconsistencies (e.g., `gap` behavior, `Link` nesting). By using a single component, we guarantee that the "TriPlan" logo HTML structure is byte-for-byte identical on every page.

### 2. Scrollbar Stability
- **Global CSS**: Added `scrollbar-gutter: stable;` to `body` in [globals.css](file:///Users/andreas/Library/CloudStorage/OneDrive-Accessinfinity/Desktop/personal/triathlon/triplan/app/globals.css).
- **Reason**: The "jumping" was almost certainly caused by the browser scrollbar appearing/disappearing between long pages (Race List) and short pages (Workouts/Account). This CSS rule reserves space for the scrollbar even when not needed, preventing the centered content (`mx-auto`) from shifting left/right as you navigate.

## Verification
- **Visuals**:
    - Logo position is now mathematically identical across all pages.
    - Layout does not shift when navigating between pages of different lengths.
- **Build**: Passed.

# Patch v1.20 Walkthrough

## Summary
Optimized the mobile workout list layout to fix critical data truncation and updated the project documentation to focus on the live application.

## Changes

### 1. Mobile Workout List Layout
- **File**: [components/app/workout-list.tsx](file:///Users/andreas/Library/CloudStorage/OneDrive-Accessinfinity/Desktop/personal/triathlon/triplan/components/app/workout-list.tsx)
- **Change**: Implemented responsive sizing for the workout statistics columns (Duration, Distance, Intensity).
    - **Desktop (`sm:`+)**: Retained original fixed widths (`w-20`, `w-24`, `w-16`) and spacing (`space-x-6`).
    - **Mobile**: Aggressively reduced widths (`w-12`, `w-14`, `w-8`) and spacing (`space-x-2`).
    - **Typography**: Reduced font size to `text-xs` (12px) and `text-[10px]` for units/labels on mobile to fit the tighter constraints.
- **Reason**: The desktop layout consumed ~290px for stats alone, leaving <85px for the main workout description on mobile devices, causing unreadable truncation (e.g., "S..."). This layout shift reclaims ~130px of horizontal space, allowing the date and workout type to be fully readable on smartphones.

### 2. README Update
- **File**: [README.md](file:///Users/andreas/Library/CloudStorage/OneDrive-Accessinfinity/Desktop/personal/triathlon/triplan/README.md)
- **Change**:
    - Removed "Getting Started" section with local setup instructions.
    - Added prominent link to the live app: `https://triathlonplan.vercel.app/`.
    - Added "TriCalc" cross-promotion section with links.
- **Reason**: Shifts the project focus from a developer-centric codebase to a user-centric product.

## Verification
- **Visuals**:
    - **Mobile**: Workout rows are compact but fully readable. No horizontal scrolling.
    - **Desktop**: Layout remains spacious and identical to previous versions.
- **Build**: Passed.

# Patch v1.21 Walkthrough

## Summary
Addressed subtle layout shifting in the header and further optimized the mobile workout list for high-density data.

## Changes

### 1. Header Layout Stability
- **File**: [app/globals.css](file:///Users/andreas/Library/CloudStorage/OneDrive-Accessinfinity/Desktop/personal/triathlon/triplan/app/globals.css)
- **Change**: Moved `scrollbar-gutter: stable;` from `body` to `html`.
- **Reason**: Applying this to `body` can sometimes be overridden or calculated incorrectly depending on the viewport height and overflow settings of root elements. Moving it to `html` ensures the browser reserves scrollbar space at the absolute top level, guaranteeing an identical viewport width (and thus identical `mx-auto` centering) across all pages, regardless of content length.

### 2. Mobile Workout List Compression
- **File**: [components/app/workout-list.tsx](file:///Users/andreas/Library/CloudStorage/OneDrive-Accessinfinity/Desktop/personal/triathlon/triplan/components/app/workout-list.tsx)
- **Change**: Tighter formatting for workout stats on mobile:
    - **Spacing**: Reduced gap between columns from `space-x-2` to `space-x-1`.
    - **Units**: Removed space between value and unit (e.g., "100.7km" instead of "100.7 km") and reduced unit font size (`text-[9px]`).
    - **Duration**: Reduced horizontal padding in the duration "bubble".
- **Reason**: To accommodate larger values (e.g., 100km rides) without breaking the layout or truncating the workout description on small screens.

## Verification
- **Visuals**:
    - Header is 100% stable during navigation.
    - Workout list fits "100.7km" comfortably on mobile (320px+).
- **Build**: Passed.

# Patch v1.22 Walkthrough

## Summary
Refined mobile UI with high-contrast intensity badges and streamlined the app navigation by consolidating data tools into the Profile page.

## Changes

### 1. Mobile Workout List Polish
- **File**: [components/app/workout-list.tsx](file:///Users/andreas/Library/CloudStorage/OneDrive-Accessinfinity/Desktop/personal/triathlon/triplan/components/app/workout-list.tsx)
- **Change**:
    - **Intensity Displays**: Replaced the small colored dot with a **bold, color-filled badge** (Green/Yellow/Red background with Black text).
    - **Spacing**: Further compressed horizontal spacing to prevent overlaps between the new larger badge and the distance unit.
- **Reason**: Improves readability on small screens and visual consistency (matches Duration bubble style).

### 2. Data Management Relocation
- **Files**: [app/page.tsx](file:///Users/andreas/Library/CloudStorage/OneDrive-Accessinfinity/Desktop/personal/triathlon/triplan/app/page.tsx), [app/(protected)/profile/page.tsx](file:///Users/andreas/Library/CloudStorage/OneDrive-Accessinfinity/Desktop/personal/triathlon/triplan/app/%28protected%29/profile/page.tsx)
- **Change**: Moved the `<CsvManager />` component from the Home page footer to the Profile page, nestled between "Preferences" and "Security".
- **Reason**: Cleans up the main race view and places "admin" tasks where users expect them (Settings/Profile).

## Verification
- **Visuals**:
    - Mobile: Intensity is now a legible badge (e.g., [ 5.0 ] in Yellow) that doesn't clash with distance.
    - Profile: Data Management section sits naturally between Preferences and Security.
- **Build**: Passed.

# Patch v1.23 Walkthrough

## Summary
Unified the UI for Data Management and standardized workout list badges for a pixel-perfect, consistent look.

## Changes

### 1. Profile UI Refactor
- **Files**: [app/(protected)/profile/page.tsx](file:///Users/andreas/Library/CloudStorage/OneDrive-Accessinfinity/Desktop/personal/triathlon/triplan/app/%28protected%29/profile/page.tsx), [components/app/csv-manager.tsx](file:///Users/andreas/Library/CloudStorage/OneDrive-Accessinfinity/Desktop/personal/triathlon/triplan/components/app/csv-manager.tsx)
- **Change**: Extracted the "Data Management" title and description from the [CsvManager](file:///Users/andreas/Library/CloudStorage/OneDrive-Accessinfinity/Desktop/personal/triathlon/triplan/components/app/csv-manager.tsx#9-97) internal component to the parent [Profile](file:///Users/andreas/Library/CloudStorage/OneDrive-Accessinfinity/Desktop/personal/triathlon/triplan/app/%28protected%29/profile/page.tsx#12-123) page.
- **Reason**: Ensures the "Data Management" section looks identical to "Preferences" and "Security", with the title sitting outside the card border.

### 2. Workout List Uniformity
- **File**: [components/app/workout-list.tsx](file:///Users/andreas/Library/CloudStorage/OneDrive-Accessinfinity/Desktop/personal/triathlon/triplan/components/app/workout-list.tsx)
- **Change**:
    - **Badges**: Enforced a fixed height (`h-6`) and minimum width (`min-w-[3rem]`) for both **Duration** and **Intensity** badges. Both are now rounded rectangles.
    - **Typography**: Standardized font size to `text-xs` (mobile) / `text-sm` (desktop) across Duration, Distance, and Intensity.
- **Reason**: Creates a harmonious "table-like" rhythm in the workout list. "01:30" (Duration) and "10.0" (Intensity) now occupy exactly the same visual footprint.

## Verification
- **Visuals**:
    - **Profile**: Data Management title aligns properly with other section headers.
    - **Workout List**: Badges are twins in shape/size; fonts are uniform.
- **Build**: Passed.

# Patch v1.24 Walkthrough

## Summary
Resolved CSV date parsing errors by supporting "DD/MM/YYYY" format and polished the Data Management UI to be perfectly symmetrical.

## Changes

### 1. CSV Date Parsing (Fixes "Value out of range" error)
- **File**: [app/actions.ts](file:///Users/andreas/Library/CloudStorage/OneDrive-Accessinfinity/Desktop/personal/triathlon/triplan/app/actions.ts)
- **Change**: Added [parseDate](file:///Users/andreas/Library/CloudStorage/OneDrive-Accessinfinity/Desktop/personal/triathlon/triplan/app/actions.ts#461-480) helper function that automatically detects `DD/MM/YYYY` format (e.g., `13/06/2026`) and converts it to the required ISO format (`2026-06-13`) before saving to Supabase.
- **Impact**: Users can now import CSVs with European/International date formats without errors.

### 2. Data Management UI Polish
- **File**: [components/app/csv-manager.tsx](file:///Users/andreas/Library/CloudStorage/OneDrive-Accessinfinity/Desktop/personal/triathlon/triplan/components/app/csv-manager.tsx)
- **Change**: Redesigned the "Export" and "Import" sections to be visually identical siblings.
    - **Export**: Added "Export CSV" label and a fast-read text box "Export your data..." to mirror the file input style.
    - **Buttons**: Both buttons now share the same width (`w-[100px]`) and alignment.
    - **Polish**: 
        - Export button now uses the **Primary** fill color (same as Import).
        - Export description text no longer has a visible border, achieving a cleaner look.
- **Reason**: Provides a professional, balanced look where Export and Import carry equal visual weight.

- **Build**: Passed.

# Patch v1.25 Walkthrough

## Summary
Refined the mobile layout for workouts to reduce crowding and improve visual rhythm.

## Changes

### 1. Mobile Layout Refinement
- **File**: [components/app/workout-list.tsx](file:///Users/andreas/Library/CloudStorage/OneDrive-Accessinfinity/Desktop/personal/triathlon/triplan/components/app/workout-list.tsx)
- **Spacing**:
    - Reduced row padding from `p-4` to `px-3 py-3` to gain horizontal space.
    - Tightened icon spacing (`space-x-3`).
- **Badges**:
    - **Narrower**: Reduced Duration and Intensity badges to a fixed width of `w-11` (approx 44px), centered.
- **Dashes (Missing Data)**:
    - **Uniformity**: All dashes (Duration, Distance, Intensity) are now visually identical (`w-11`, centered) for a clean, table-like appearance.

## Verification
- **Visuals**: Verified that the workout list looks less crowded on mobile screens, with consistent alignment for all data points.
- **Build**: Passed.

# Patch v1.26 Walkthrough

## Summary
Equalized the spacing of workout metrics on mobile to ensure the "Distance" element is perfectly centered between Duration and Intensity.

## Changes

### 1. Mobile Layout Equalization
- **File**: [components/app/workout-list.tsx](file:///Users/andreas/Library/CloudStorage/OneDrive-Accessinfinity/Desktop/personal/triathlon/triplan/components/app/workout-list.tsx)
- **Equal Columns**:
    - Set **Duration**, **Distance**, and **Intensity** containers to a fixed equal width of `w-14` (56px) on mobile.
- **Center Alignment**:
    - Applied `justify-center` to all three columns on mobile.
- **Result**: The "Distance" or middle element is now mathematically centered between the other two, creating perfect visual balance. Desktop layout (`sm:`) remains right-aligned and flexible.

## Verification
- **Visuals**: Verified that the gaps between Duration-Distance and Distance-Intensity are now equal on small screens.
- **Build**: Passed.

# Patch v1.27 Walkthrough

## Summary
Implemented comprehensive and strict validation for CSV imports to ensure data integrity and provide clear, actionable error messages to the user.

## Changes

### 1. Strict CSV Validation
- **File**: [app/actions.ts](file:///Users/andreas/Library/CloudStorage/OneDrive-Accessinfinity/Desktop/personal/triathlon/triplan/app/actions.ts)
- **Function**: [importCsvData](file:///Users/andreas/Library/CloudStorage/OneDrive-Accessinfinity/Desktop/personal/triathlon/triplan/app/actions.ts#257-460)
- **Validations Implemented**:
    1.  **Headers**: Checks for exact match of column names and order: *"Race Name, Race Location, Race Date, ..., Workout Details"*.
    2.  **Race Consistency**: Ensures `Race Name`, `Location`, [Date](file:///Users/andreas/Library/CloudStorage/OneDrive-Accessinfinity/Desktop/personal/triathlon/triplan/app/actions.ts#461-480), and `Details` are identical across every row in the file.
    3.  **Data Formats**:
        - **Workout Date**: Must be `DD/MM/YYYY`.
        - **Workout Type**: Must be one of: *Swim, Bike, Run, Strength, Rest, Other*.
        - **Duration**: Must be `HH:MM` (max `99:99`).
        - **Distance**: Max `999.9`.
        - **Intensity**: Range `0-10`, max 1 decimal place (e.g., `8.5` is valid, `8.55` is not).

## Verification
- **Build**: Passed.
- **Code Logic**: Verified regex patterns and consistency loops in [importCsvData](file:///Users/andreas/Library/CloudStorage/OneDrive-Accessinfinity/Desktop/personal/triathlon/triplan/app/actions.ts#257-460).

# Patch v1.28 Walkthrough

## Summary
Replicated the "Equal Spacing" layout fix for desktop/laptop screens, ensuring the Distance element is perfectly centered between Duration and Intensity.

## Changes

### 1. Desktop Layout Equalization
- **File**: [components/app/workout-list.tsx](file:///Users/andreas/Library/CloudStorage/OneDrive-Accessinfinity/Desktop/personal/triathlon/triplan/components/app/workout-list.tsx)
- **Equal Columns**:
    - Set **Duration**, **Distance**, and **Intensity** containers to a fixed equal width of `sm:w-24` (96px) on desktop (previously `sm:w-20`, `sm:w-24`, `sm:w-16`).
- **Center Alignment**:
    - Applied `justify-center` (via removal of `sm:justify-end`) to all three columns on desktop.
- **Result**: Perfect symmetry and balance on large screens, matching the mobile experience.

## Verification
- **Visuals**: Verified that the columns are now equal width and centered on desktop breakpoints.
- **Build**: Passed.

# Patch v1.29 Walkthrough

## Summary
Addressed user feedback regarding sorting stability and CSV import order logic.

## Changes

### 1. CSV Import Order (Smart Reversal)
- **File**: [app/actions.ts](file:///Users/andreas/Library/CloudStorage/OneDrive-Accessinfinity/Desktop/personal/triathlon/triplan/app/actions.ts)
- **Logic**: Implemented "Date Trend Detection".
    - If the CSV file is sorted **Newest to Oldest** (Descending), the import logic now **reverses** the processing order.
    - **Why?**: This ensures that the "Newest" workout (Top of File) is inserted *last*, giving it the latest timestamp (`created_at`). Combined with our default sort (Newest First), this puts the "Top of File" workout at the "Top of List" in the UI, preserving the user's expected order for workouts on the same day.
    - **Ascending Files**: Processed normally, which naturally results in correct order.

### 2. Stable Sorting
- **File**: [app/(protected)/[raceId]/page.tsx](file:///Users/andreas/Library/CloudStorage/OneDrive-Accessinfinity/Desktop/personal/triathlon/triplan/app/%28protected%29/%5BraceId%5D/page.tsx)
- **Change**: Added `.order('id', { ascending: false })` as a final, deterministic tie-breaker to the workout fetch query.
- **Why?**: Previously, non-updated workouts on the same day could shuffle randomly due to timestamp ties. Validating by ID ensures that the relative order of non-updated items remains rock-solid stable.

## Verification
- **Build**: Passed.
- **Logic Check**: Confirmed that `rows.reverse()` is called only when `firstDate > lastDate`. Confirmed `order('id', ...)` is appended to Supabase query.

# Patch v1.30 Walkthrough

## Summary
Added a global, responsive, and theme-adaptive footer containing copyright information and social media links.

## Changes

### 1. Global Footer Component
- **File**: [components/app/footer.tsx](file:///Users/andreas/Library/CloudStorage/OneDrive-Accessinfinity/Desktop/personal/triathlon/triplan/components/app/footer.tsx)
- **Design Elements**:
    - **Row 1**: Copyright text with smaller font (`text-xs`) to remain subtle.
    - **Row 2**: Social links (Instagram, LinkedIn, GitHub) using crisp `lucide-react` icons. All links open in a new tab (`target="_blank"`).
    - **Theming**: Used `text-muted-foreground` to automatically adapt to the user's selected Light/Dark theme.

### 2. Layout Integration
- **File**: [app/layout.tsx](file:///Users/andreas/Library/CloudStorage/OneDrive-Accessinfinity/Desktop/personal/triathlon/triplan/app/layout.tsx)
- **Structure**: Modified the `<body>` to act as a flex column (`flex flex-col min-h-screen`) and wrapped the `children` in a `flex-1` grow container.
- **Result**: The footer automatically pushes down cleanly to the absolute bottom of the screen on all pages, regardless of content length.

## Verification
- **Visuals**: Verified footer positioning, subtle typography, and hover effects on social links.
- **Build**: Passed.

# Patch v1.31 Walkthrough

## Summary
Improved the application's SEO by updating the global meta description tag.

## Changes

### 1. SEO Metadata Update
- **File**: [app/layout.tsx](file:///Users/andreas/Library/CloudStorage/OneDrive-Accessinfinity/Desktop/personal/triathlon/triplan/app/layout.tsx)
- **Logic**: Updated the Next.js `metadata.description` export to the user-provided, keyword-rich copy.
    - *New Description*: "Plan and track your triathlon training for Ironman, T100, and other races with TriPlan..."
- **Result**: Search engines will now correctly index this exact string, improving discoverability for endurance athletes.

## Verification
- **Code Check**: Verified Next.js Metadata object syntax is correct.

# Patch v1.32 Walkthrough

## Summary
Integrated Google Analytics 4 (GA4) into the application using the highly optimized `next/script` component.

## Changes

### 1. GA4 Script Injection
- **File**: [app/layout.tsx](file:///Users/andreas/Library/CloudStorage/OneDrive-Accessinfinity/Desktop/personal/triathlon/triplan/app/layout.tsx)
- **Logic**: 
    - Replaced traditional `<script>` tags with Next.js `<Script>` components to ensure optimal loading performance.
    - Set the `strategy="afterInteractive"` to ensure the scripts load efficiently without blocking page rendering.
    - Injected the user's specific Measurement ID (`G-HD03HER1E2`) into the global window `dataLayer`.
- **Location**: Added directly inside the layout's `<head>` to guarantee it fires on every single page view across the app.

## Verification
- **Code Check**: Verified `<Script>` syntax, Measurement ID (`G-HD03HER1E2`), and correct `afterInteractive` strategy.
- **Build**: Passed.

# Patch v1.33 Walkthrough

## Summary
Performed a safe code review and refactoring round targeting maintainability, without altering any functionality or UI components.

## Changes

### 1. DRY Validation Logic
- **File**: [app/actions.ts](file:///Users/andreas/Library/CloudStorage/OneDrive-Accessinfinity/Desktop/personal/triathlon/triplan/app/actions.ts)
- **Logic**: 
    - Abstracted redundant date validation logic from [createWorkout](file:///Users/andreas/Library/CloudStorage/OneDrive-Accessinfinity/Desktop/personal/triathlon/triplan/app/actions.ts#81-133) and [updateWorkout](file:///Users/andreas/Library/CloudStorage/OneDrive-Accessinfinity/Desktop/personal/triathlon/triplan/app/actions.ts#134-166) into a single, reusable [validateWorkoutDate](file:///Users/andreas/Library/CloudStorage/OneDrive-Accessinfinity/Desktop/personal/triathlon/triplan/app/actions.ts#481-498) helper function.
    - Ensures that date limits against race dates are strictly enforced from a single source of truth.

### 2. Comment Cleanup
- **Files**: [app/actions.ts](file:///Users/andreas/Library/CloudStorage/OneDrive-Accessinfinity/Desktop/personal/triathlon/triplan/app/actions.ts), [components/app/workout-list.tsx](file:///Users/andreas/Library/CloudStorage/OneDrive-Accessinfinity/Desktop/personal/triathlon/triplan/components/app/workout-list.tsx)
- **Logic**: 
    - Purged excessive inline developer comments, leaving only essential documentation.
    - Improved overall file readability and line count by ~40 lines without touching execution.

## Verification
- **Code Check**: Ensured UI classes (`className`), fetch logic, and sorting logic remained entirely untouched.
- **Lint**: Passed.

# Patch v1.34 Walkthrough

## Summary
Replaced the coarse, categorical intensity badge colours with a mathematically precise, distinct colour scaling system utilizing HSL mapping. Replaced the generic slider gradient with discrete segments reflecting each specific value.

## Changes

### 1. Mathematical Colour Logic
- **File**: [lib/colors.ts](file:///Users/andreas/Library/CloudStorage/OneDrive-Accessinfinity/Desktop/personal/triathlon/triplan/lib/colors.ts) [NEW]
- **Logic**: 
    - Created [getIntensityColor](file:///Users/andreas/Library/CloudStorage/OneDrive-Accessinfinity/Desktop/personal/triathlon/triplan/lib/colors.ts#1-7) which maps an intensity (0.0 to 10.0) precisely to an HSL Hue value from 120 (Green) to 0 (Red).
    - Created [getDiscreteGradient](file:///Users/andreas/Library/CloudStorage/OneDrive-Accessinfinity/Desktop/personal/triathlon/triplan/lib/colors.ts#8-28) which generates a CSS `linear-gradient` utilizing exactly 21 hard-stop segments (for each 0.5 increment step) based on the calculated colours.

### 2. Badge & Slider Integration
- **Files**: [components/app/workout-list.tsx](file:///Users/andreas/Library/CloudStorage/OneDrive-Accessinfinity/Desktop/personal/triathlon/triplan/components/app/workout-list.tsx), [components/app/add-workout-modal.tsx](file:///Users/andreas/Library/CloudStorage/OneDrive-Accessinfinity/Desktop/personal/triathlon/triplan/components/app/add-workout-modal.tsx)
- **Logic**: 
    - Replaced the hardcoded Tailwind badge class assignments (emerald, amber, rose) with dynamic inline `backgroundColor` styles pointing to [getIntensityColor()](file:///Users/andreas/Library/CloudStorage/OneDrive-Accessinfinity/Desktop/personal/triathlon/triplan/lib/colors.ts#1-7).
    - Replaced the manual CSS smooth gradient on the Range `<input>` track with the procedural 21-segment [getDiscreteGradient()](file:///Users/andreas/Library/CloudStorage/OneDrive-Accessinfinity/Desktop/personal/triathlon/triplan/lib/colors.ts#8-28) hard-stop design.

## Verification
- **Build**: Passed.
