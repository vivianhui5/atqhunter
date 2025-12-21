# Quick Start Guide

## What You Need to Set Up

### 1. Supabase (Database)

**Get your keys:**
1. Go to https://supabase.com
2. Create a new project (free tier is fine)
3. Go to Settings → API
4. Copy these values:
   - `Project URL` → This is your `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → This is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → This is your `SUPABASE_SERVICE_ROLE_KEY` (keep secret!)

**Set up the database:**
1. In Supabase, go to SQL Editor
2. Copy and paste the entire SQL script from `SETUP_INSTRUCTIONS.md` (under "Create Database Tables")
3. Click "Run" to create all the tables

### 2. Cloudflare R2 (Image Storage)

**Create a bucket:**
1. Log in to Cloudflare Dashboard
2. Go to R2 Object Storage (sidebar)
3. Click "Create bucket"
4. Name it something like "atqhunter-images"
5. Click "Create bucket"

**Get your credentials:**
1. In R2, click "Manage R2 API Tokens"
2. Click "Create API Token"
3. Give it a name like "ATQHunter"
4. Set permissions to "Object Read & Write"
5. Click "Create API Token"
6. **Copy these immediately** (you won't see them again!):
   - Access Key ID → `CLOUDFLARE_ACCESS_KEY_ID`
   - Secret Access Key → `CLOUDFLARE_SECRET_ACCESS_KEY`

**Get your Account ID:**
- Look at the URL in your R2 dashboard
- It looks like: `https://dash.cloudflare.com/ACCOUNT_ID_HERE/r2/`
- Copy that ID → `CLOUDFLARE_ACCOUNT_ID`

**Get your public URL:**
1. Go to your bucket settings
2. Under "Public access", enable it (or set up a custom domain)
3. Copy the URL (like `https://pub-xxxxx.r2.dev`) → `CLOUDFLARE_PUBLIC_URL`

### 3. Environment Variables

Create a file called `.env.local` in the project root with:

```bash
# From Supabase (Step 1)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...

# From Cloudflare (Step 2)
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_ACCESS_KEY_ID=your_access_key
CLOUDFLARE_SECRET_ACCESS_KEY=your_secret_key
CLOUDFLARE_BUCKET_NAME=atqhunter-images
CLOUDFLARE_PUBLIC_URL=https://pub-xxxxx.r2.dev

# Generate this (see below)
NEXTAUTH_SECRET=your_random_secret
NEXTAUTH_URL=http://localhost:3000
```

**Generate NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

Or use any random string generator online (at least 32 characters).

### 4. Run the App

```bash
# Install dependencies
npm install

# Start the dev server
npm run dev
```

The app will be running at http://localhost:3000

### 5. Create Your Admin Account

**In a new terminal window:**
```bash
npm run create-admin
```

Follow the prompts to enter your admin email and password.

### 6. Start Using It!

- **Public gallery**: http://localhost:3000
- **Admin login**: http://localhost:3000/admin

Log in with the admin credentials you just created, then start uploading artwork!

## Common Issues

### "Database connection failed"
- Double-check your Supabase URL and keys in `.env.local`
- Make sure you ran the SQL script in Supabase

### "Image upload failed"
- Verify your Cloudflare credentials
- Check that the bucket name matches
- Ensure the API token has write permissions

### "Can't create admin user"
- Make sure `npm run dev` is running
- Check that the Supabase keys are correct
- Verify you ran the database SQL script

## That's It!

You're ready to showcase your artwork collection. Enjoy! 🎨

