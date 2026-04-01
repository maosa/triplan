# Deployment Guide

## Prerequisites

- **Supabase Project**: You need a Supabase project set up.
- **Vercel Account**: For hosting the Next.js application.

## 1. Environment Variables

Configure the following environment variables in your Vercel project settings:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 2. Database Setup

Run the following SQL in your Supabase SQL Editor to set up the schema and RLS policies:

1. Copy the contents of `supabase_schema.sql` from the project root.
2. Paste it into the Supabase SQL Editor.
3. Run the script.

**Important**: This script includes:
- `profiles`, `races`, `workouts` tables.
- Row Level Security (RLS) policies for data isolation.
- A trigger to automatically create a profile for new users.
- A function `delete_user()` to allow users to delete their account.

## 3. Auth Configuration

In your Supabase Dashboard:
1. Go to **Authentication** > **Providers**.
2. Enable **Email/Password**.
3. (Optional) Configure **Site URL** and **Redirect URLs** for production (e.g., `https://your-app.vercel.app/auth/callback`).

## 4. Deploy to Vercel

1. Push your code to a Git repository (GitHub/GitLab/Bitbucket).
2. Import the project into Vercel.
3. Add the Environment Variables from step 1.
4. Deploy!

## 5. Account Deletion Note

The "Delete Account" feature uses a Supabase RPC function `delete_user()`. Ensure this function is created by running the `supabase_schema.sql` script. It allows a user to delete their own account from `auth.users`, which cascades to delete all their data.

## 6. CSV Export/Import

The CSV feature is available on desktop screens only.
- **Export**: Generates a CSV of all your races and workouts.
- **Import**: Upload a CSV with the same format. Validation prevents duplicate races (Name + Date).
