# TriPlan

**The vibe-coded, race-centric triathlon planner for athletes who hate spreadsheets.**

TriPlan is a modern, minimalist training log built for triathletes who want to focus on the work, not the admin. It’s designed to be clean, fast, and strictly race-focused. No clutter, no social feeds, just your race and the path to get there.

## Features

- **Race-Centric Planning**: Everything revolves around your "A" race. The countdown is always on.
- **Vibe-Coded UI**: Dark mode by default (but Light mode ready), with semantic colors and slick interactions.
- **Strict Data Isolation**: Your data is yours. Multi-user support with Row Level Security (RLS) ensures total privacy.
- **Mobile First**: Add workouts from your phone without zooming, pinching, or squinting.
- **Data Freedom**: Simple CSV import and export. We don't lock you in.

## Getting Started

1. **Clone the repo**
2. **Install dependencies**: `npm install`
3. **Set up Supabase**:
   - Create a project at [supabase.com](https://supabase.com)
   - Run the schema migration in SQL Editor
   - Add credentials to `.env.local`
4. **Run it**: `npm run dev`

## Tech Stack

- **Next.js 15 (App Router)**
- **Supabase (Auth & Database)**
- **Tailwind CSS**
- **Lucide Icons**

Built for speed. Built for PRs.
