# Supabase Setup Guide

## What We've Built

✅ **Created:**
- `/app/auth/page.tsx` - Combined login/signup page
- `/app/posts/page.tsx` - Posts list and create new post
- `/lib/supabase.js` - Supabase client instance
- `.env.local` - Environment variables (already configured)
- Updated `/app/page.tsx` - Redirects based on auth status

## Next Steps: Set Up Supabase Database

### 1. Create the Posts Table
Go to [Supabase Dashboard](https://supabase.com/dashboard) and:

1. Select your project (ckprygvkyvdufhnfeyci)
2. Go to **SQL Editor** → **New Query**
3. Run this SQL to create the posts table:

```sql
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX posts_user_id_idx ON posts(user_id);
CREATE INDEX posts_created_at_idx ON posts(created_at DESC);
```

### 2. Set Up Row Level Security (RLS)

Still in SQL Editor, run:

```sql
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Allow users to read all posts
CREATE POLICY "Anyone can read posts" ON posts
  FOR SELECT USING (true);

-- Allow users to create posts
CREATE POLICY "Users can create posts" ON posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own posts
CREATE POLICY "Users can delete own posts" ON posts
  FOR DELETE USING (auth.uid() = user_id);
```

### 3. Test the App

Run your development server:

```bash
npm run dev
```

Then:
1. Open `http://localhost:3000`
2. You'll be redirected to `/auth`
3. Click **"Don't have an account? Sign up"** to create an account
4. After signup/login, you'll see the posts page
5. Create posts and see them appear instantly!

## Features

- **Authentication**: Sign up and login with email/password
- **Create Posts**: Add new posts that save to the database
- **View Posts**: See all posts in reverse chronological order
- **Auto-Redirect**: Non-logged-in users go to auth page
- **Logout**: Sign out and return to login

## Troubleshooting

- **"Posts table not found" error**: Make sure you ran the SQL to create the table
- **Auth not working**: Check that `.env.local` has the correct Supabase URL and anon key
- **Posts not loading**: Verify Row Level Security policies are enabled
