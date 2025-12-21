# ✅ Setup Checklist - ATQ Hunter

Use this checklist to ensure you have everything configured correctly.

## Step 1: Supabase Setup ☐

### Create Project
- [ ] Sign up at https://supabase.com
- [ ] Create a new project
- [ ] Wait for project to finish provisioning (~2 minutes)

### Get API Keys
- [ ] Navigate to: Settings → API
- [ ] Copy `Project URL` 
- [ ] Copy `anon public` key
- [ ] Copy `service_role` key (Click to reveal)

### Run SQL Schema
- [ ] Go to: SQL Editor
- [ ] Create a new query
- [ ] Copy the entire SQL script from `SETUP_INSTRUCTIONS.md`
- [ ] Paste into the query editor
- [ ] Click "Run" or press Cmd+Enter
- [ ] Verify you see: "Success. No rows returned"
- [ ] Check Tables: You should see 4 new tables:
  - [ ] `galleries`
  - [ ] `artwork_posts`
  - [ ] `artwork_images`
  - [ ] `admin_users`

## Step 2: Cloudflare R2 Setup ☐

### Create Bucket
- [ ] Log in to Cloudflare Dashboard
- [ ] Navigate to: R2 Object Storage (left sidebar)
- [ ] Click "Create bucket"
- [ ] Enter bucket name (e.g., "atqhunter-images")
- [ ] Click "Create bucket"

### Generate API Token
- [ ] Click "Manage R2 API Tokens" (top right)
- [ ] Click "Create API Token"
- [ ] Enter token name (e.g., "ATQHunter Upload")
- [ ] Set permissions: "Object Read & Write"
- [ ] (Optional) Scope to your bucket
- [ ] Click "Create API Token"
- [ ] ⚠️ **IMPORTANT**: Copy both keys immediately (you won't see them again!)
  - [ ] Copy `Access Key ID`
  - [ ] Copy `Secret Access Key`

### Configure Public Access
- [ ] Go to your bucket settings
- [ ] Navigate to: Settings → Public access
- [ ] Enable "Allow public access" (or set up custom domain)
- [ ] Copy the public URL (e.g., `https://pub-xxxxx.r2.dev`)

### Get Account ID
- [ ] Look at your browser's URL bar
- [ ] The URL looks like: `https://dash.cloudflare.com/ACCOUNT_ID_HERE/r2/`
- [ ] Copy the Account ID (32 characters)

## Step 3: Environment Variables ☐

### Create .env.local File
- [ ] Navigate to project root in terminal
- [ ] Run: `cp .env.example .env.local` (or create file manually)

### Fill in Supabase Values
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
- [ ] Paste `NEXT_PUBLIC_SUPABASE_URL`
- [ ] Paste `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Paste `SUPABASE_SERVICE_ROLE_KEY`

### Fill in Cloudflare Values
```env
CLOUDFLARE_ACCOUNT_ID=your_32_character_account_id
CLOUDFLARE_ACCESS_KEY_ID=your_access_key_id
CLOUDFLARE_SECRET_ACCESS_KEY=your_secret_access_key
CLOUDFLARE_BUCKET_NAME=atqhunter-images
CLOUDFLARE_PUBLIC_URL=https://pub-xxxxx.r2.dev
```
- [ ] Paste `CLOUDFLARE_ACCOUNT_ID`
- [ ] Paste `CLOUDFLARE_ACCESS_KEY_ID`
- [ ] Paste `CLOUDFLARE_SECRET_ACCESS_KEY`
- [ ] Enter `CLOUDFLARE_BUCKET_NAME` (exact name from Step 2)
- [ ] Paste `CLOUDFLARE_PUBLIC_URL` (from public access settings)

### Generate NextAuth Secret
- [ ] Run in terminal: `openssl rand -base64 32`
- [ ] Copy the output
- [ ] Paste as `NEXTAUTH_SECRET`
- [ ] Set `NEXTAUTH_URL=http://localhost:3000`

### Verify .env.local
- [ ] All 10 environment variables are filled in
- [ ] No placeholder text remains
- [ ] File is saved

## Step 4: Install and Run ☐

### Install Dependencies
```bash
npm install
```
- [ ] Run the command above
- [ ] Wait for installation to complete (~1-2 minutes)
- [ ] Verify: No error messages

### Start Development Server
```bash
npm run dev
```
- [ ] Run the command above
- [ ] Wait for server to start
- [ ] Look for: "Local: http://localhost:3000"
- [ ] Open browser and visit: http://localhost:3000
- [ ] Verify: You see the gallery homepage

## Step 5: Create Admin User ☐

### Run Create Admin Script
In a **NEW terminal window** (keep dev server running):
```bash
npm run create-admin
```
- [ ] Run the command above
- [ ] Enter your admin email when prompted
- [ ] Enter your admin password when prompted
- [ ] Look for: "✅ Admin user created successfully!"
- [ ] Note down your credentials

## Step 6: Test Everything ☐

### Test Public Pages
- [ ] Visit: http://localhost:3000
- [ ] Verify: Homepage loads (even if empty)
- [ ] Click: "Galleries" in navigation
- [ ] Verify: Galleries page loads (even if empty)

### Test Admin Login
- [ ] Visit: http://localhost:3000/admin
- [ ] Verify: Redirects to login page
- [ ] Enter your admin email
- [ ] Enter your admin password
- [ ] Click "Sign In"
- [ ] Verify: Redirects to admin dashboard

### Test Admin Dashboard
- [ ] Verify: Upload form is visible
- [ ] Click "New" next to Gallery dropdown
- [ ] Enter test gallery name: "Test Gallery"
- [ ] Click "Create"
- [ ] Verify: Success message appears
- [ ] Verify: New gallery appears in dropdown

### Test Artwork Upload
- [ ] Fill in Title: "Test Artwork"
- [ ] Fill in Description: Type some text and try bold/italic
- [ ] Fill in Price: 99.99
- [ ] Select Gallery: "Test Gallery"
- [ ] Click image upload area
- [ ] Select 1-3 test images from your computer
- [ ] Click "Upload Artwork"
- [ ] Verify: "Artwork uploaded successfully!" message
- [ ] Verify: Form clears

### Test Public View
- [ ] Visit: http://localhost:3000
- [ ] Verify: Your test artwork appears
- [ ] Click on the artwork card
- [ ] Verify: Detail page shows all images
- [ ] Verify: Description and price display correctly
- [ ] Verify: Gallery badge shows "Test Gallery"
- [ ] Test image navigation with ◀ ▶ buttons
- [ ] Click on main image
- [ ] Verify: Lightbox opens
- [ ] Press ESC or click X to close

## Step 7: Production Deployment (Optional) ☐

### Prepare for Deployment
- [ ] Push code to GitHub
- [ ] Verify `.env.local` is in `.gitignore` (it is by default)
- [ ] Verify `.env.local` is NOT committed to Git

### Deploy to Vercel
- [ ] Visit: https://vercel.com
- [ ] Click "Import Project"
- [ ] Connect your GitHub repository
- [ ] Add all environment variables:
  - [ ] All 8 Supabase/Cloudflare variables
  - [ ] Generate new `NEXTAUTH_SECRET` for production
  - [ ] Set `NEXTAUTH_URL` to your production domain
- [ ] Click "Deploy"
- [ ] Wait for deployment to complete
- [ ] Visit your production URL
- [ ] Test login and upload

## Troubleshooting Checklist ☐

### If Database Connection Fails
- [ ] Verify Supabase URL is correct (should end in .supabase.co)
- [ ] Verify both Supabase keys are correct
- [ ] Check that SQL schema was executed successfully
- [ ] Check Supabase project is not paused

### If Image Upload Fails
- [ ] Verify Cloudflare Account ID is correct
- [ ] Verify both Cloudflare keys are correct
- [ ] Verify bucket name matches exactly
- [ ] Check R2 API token has write permissions
- [ ] Verify public URL is accessible

### If Login Fails
- [ ] Verify admin user was created (check terminal output)
- [ ] Try creating a new admin user
- [ ] Check NEXTAUTH_SECRET is at least 32 characters
- [ ] Clear browser cookies and try again
- [ ] Check browser console for errors

### If Build Fails
- [ ] Run: `npm run build`
- [ ] Check for TypeScript errors
- [ ] Verify all environment variables are set
- [ ] Check Node.js version (should be 18+)

## ✅ Completion Checklist

By the end of this setup, you should have:
- [ ] A running Next.js application at http://localhost:3000
- [ ] A Supabase database with 4 tables
- [ ] A Cloudflare R2 bucket for image storage
- [ ] An admin account for uploading artwork
- [ ] Successfully uploaded at least one test artwork
- [ ] Verified the artwork displays on the public gallery

## 🎉 You're Done!

If you checked all the boxes above, your ATQ Hunter artwork gallery is fully operational!

### Next Steps:
1. Delete your test artwork (directly in Supabase if needed)
2. Create real gallery names
3. Start uploading your actual artwork collection
4. (Optional) Deploy to production

### Need Help?
- Check `SETUP_INSTRUCTIONS.md` for detailed guides
- Check `QUICK_START.md` for quick reference
- Check `PROJECT_OVERVIEW.md` for feature documentation
- Check `VISUAL_GUIDE.md` for visual workflows

Happy showcasing! 🎨

