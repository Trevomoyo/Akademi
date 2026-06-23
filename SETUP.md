# Akademì — Production Setup Guide

## 1. Supabase Project

1. Go to https://supabase.com → New project
2. Once created, open **SQL Editor → New Query**
3. Paste and run the entire contents of `supabase/schema.sql`
4. Go to **Authentication → Settings** and turn OFF:
   - **Enable email confirmations** (users don't get a real email — our usernames become internal emails)
   - **Secure email change**
5. Copy your project's **URL**, **anon key**, and **service_role key** from Settings → API

## 2. Environment Variables

Copy `.env.example` to `.env` and fill in all values:

```
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # Keep this secret — never expose to browser
GEMINI_API_KEY=AIza...
APP_URL=https://your-domain.com
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

## 3. Grant Yourself Admin

After signing up through the app for the first time:

1. Go to Supabase → Table Editor → profiles
2. Find your row and set `is_admin = true`

Or use the SQL editor:
```sql
UPDATE profiles SET is_admin = true WHERE phone = '+2637XXXXXXXX';
```

## 4. PayNow Integration

When you have a PayNow merchant account:

1. Get your **Integration ID** and **Integration Key** from PayNow
2. Add to `.env`:
   ```
   PAYNOW_INTEGRATION_ID=your-id
   PAYNOW_INTEGRATION_KEY=your-key
   ```
3. In `server.ts`, uncomment and implement the PayNow API call in `/api/subscriptions/initiate`
4. Set your PayNow result URL to `https://your-domain.com/api/webhooks/paynow`

## 5. Cloudflare R2 (Past Paper Storage)

1. Create a Cloudflare account → R2 → New bucket named `akademi-papers`
2. Create an API token with R2 write permissions
3. Add to `.env`:
   ```
   R2_ACCOUNT_ID=your-account-id
   R2_ACCESS_KEY_ID=your-key-id
   R2_SECRET_ACCESS_KEY=your-secret
   R2_BUCKET=akademi-papers
   R2_PUBLIC_URL=https://pub-xxxx.r2.dev
   ```
4. When R2 upload is wired, the Admin panel will upload files directly to R2 and store the public URL in the database

## 6. Run Locally

```bash
npm install        # installs all dependencies including concurrently
npm run dev        # starts BOTH Express (port 3001) and Vite (port 5173) together
```

Open http://localhost:5173 in your browser.

If you want to run them separately (e.g. to see logs clearly):
```bash
# Terminal 1
npm run dev:server   # Express API on :3001

# Terminal 2
npm run dev:vite     # Vite frontend on :5173
```

## 7. Deploy

The app is designed for a single-server deploy (Express serves the built Vite frontend):

```bash
npm run build      # builds frontend to dist/
node server.ts     # serves dist/ + API on :3001
```

Recommended hosts: Railway, Render, Fly.io, or a VPS.
Set `NODE_ENV=production` and all env vars on the host.
