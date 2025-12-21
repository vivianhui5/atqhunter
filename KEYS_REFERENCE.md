# 🔑 Keys and Credentials Reference

This document lists EXACTLY what you need to set up and where to find each value.

---

## 📋 Quick Reference Table

| Variable Name | Where to Get It | Format/Example |
|--------------|-----------------|----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API → Project URL | `https://xxxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API → anon public | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (long JWT token) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → service_role | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (long JWT token) |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare URL or R2 Dashboard | 32 character alphanumeric string |
| `CLOUDFLARE_ACCESS_KEY_ID` | R2 → Manage API Tokens → Create Token | ~20 characters |
| `CLOUDFLARE_SECRET_ACCESS_KEY` | R2 → Manage API Tokens → Create Token | ~40 characters |
| `CLOUDFLARE_BUCKET_NAME` | R2 → Your bucket name | `atqhunter-images` (or what you named it) |
| `CLOUDFLARE_PUBLIC_URL` | R2 → Bucket Settings → Public Access | `https://pub-xxxxx.r2.dev` |
| `NEXTAUTH_SECRET` | Generate: `openssl rand -base64 32` | 44 character random string |
| `NEXTAUTH_URL` | Your app URL | `http://localhost:3000` (dev) / `https://yourdomain.com` (prod) |

---

## 📖 Detailed Instructions

### 1. NEXT_PUBLIC_SUPABASE_URL

**What it is:** The URL endpoint for your Supabase database.

**How to get it:**
1. Go to https://supabase.com
2. Open your project
3. Click "Settings" (gear icon) in the left sidebar
4. Click "API"
5. Look for "Project URL" under "Config"
6. Copy the URL (it looks like: `https://abcdefghijklmnop.supabase.co`)

**Example:**
```
NEXT_PUBLIC_SUPABASE_URL=https://xyzproject123.supabase.co
```

---

### 2. NEXT_PUBLIC_SUPABASE_ANON_KEY

**What it is:** Public-facing API key for Supabase (safe to expose in browser).

**How to get it:**
1. Same page as above (Settings → API)
2. Look for "Project API keys"
3. Find the key labeled "anon public"
4. Click the copy icon
5. This is a LONG string (JWT token), starts with `eyJ`

**Example:**
```
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp...
```

---

### 3. SUPABASE_SERVICE_ROLE_KEY

**What it is:** Server-side API key with full database access (KEEP SECRET!).

**How to get it:**
1. Same page as above (Settings → API)
2. Look for "Project API keys"
3. Find the key labeled "service_role"
4. Click "Reveal" (it's hidden by default)
5. Click the copy icon
6. This is also a LONG JWT token, starts with `eyJ`

⚠️ **IMPORTANT:** Never commit this to Git or expose it in browser code!

**Example:**
```
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp...
```

---

### 4. CLOUDFLARE_ACCOUNT_ID

**What it is:** Your Cloudflare account identifier.

**How to get it:**
1. Log in to Cloudflare Dashboard
2. Look at the URL in your browser
3. The URL looks like: `https://dash.cloudflare.com/1234567890abcdef1234567890abcdef/r2/`
4. Copy the long string between `cloudflare.com/` and `/r2/`

**Alternative method:**
1. Go to R2 Object Storage
2. Click on your bucket
3. Click "Settings"
4. Account ID is shown at the top

**Example:**
```
CLOUDFLARE_ACCOUNT_ID=1234567890abcdef1234567890abcdef
```

---

### 5. CLOUDFLARE_ACCESS_KEY_ID

**What it is:** Access key for R2 API (like AWS S3 access key).

**How to get it:**
1. In Cloudflare Dashboard, go to R2 Object Storage
2. Click "Manage R2 API Tokens" (button at top right)
3. Click "Create API Token"
4. Enter a token name (e.g., "ATQHunter")
5. Set permissions: "Object Read & Write"
6. (Optional) Scope to your specific bucket
7. Click "Create API Token"
8. ⚠️ **Copy the Access Key ID IMMEDIATELY** (shown only once!)

**Example:**
```
CLOUDFLARE_ACCESS_KEY_ID=a1b2c3d4e5f6g7h8i9j0
```

---

### 6. CLOUDFLARE_SECRET_ACCESS_KEY

**What it is:** Secret key for R2 API (like AWS S3 secret key).

**How to get it:**
1. Same screen as above (when creating API token)
2. Copy the "Secret Access Key" shown alongside the Access Key ID
3. ⚠️ **This is shown ONLY ONCE** - copy it immediately!

**Example:**
```
CLOUDFLARE_SECRET_ACCESS_KEY=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0
```

⚠️ **IMPORTANT:** If you lose this key, you'll need to create a new API token!

---

### 7. CLOUDFLARE_BUCKET_NAME

**What it is:** The name of your R2 storage bucket.

**How to get it:**
1. Go to R2 Object Storage in Cloudflare
2. Look at the list of buckets
3. Copy the exact name of the bucket you created

**Example:**
```
CLOUDFLARE_BUCKET_NAME=atqhunter-images
```

⚠️ **IMPORTANT:** Name must match EXACTLY (case-sensitive, no spaces)

---

### 8. CLOUDFLARE_PUBLIC_URL

**What it is:** The public URL where your images will be accessible.

**How to get it:**
1. In R2, click on your bucket
2. Click "Settings"
3. Scroll to "Public access"
4. If not enabled, click "Allow public access"
5. Copy the public URL shown (looks like `https://pub-xxxxx.r2.dev`)

**Alternative (Custom Domain):**
If you set up a custom domain:
1. Use that domain instead (e.g., `https://cdn.yourdomain.com`)

**Example:**
```
CLOUDFLARE_PUBLIC_URL=https://pub-a1b2c3d4e5f6.r2.dev
```

---

### 9. NEXTAUTH_SECRET

**What it is:** Random secret string for encrypting authentication sessions.

**How to generate it:**
Run this command in your terminal:
```bash
openssl rand -base64 32
```

Copy the output (44 random characters).

**Alternative methods:**
- Use an online password generator (32+ characters)
- Visit: https://generate-secret.vercel.app/32

**Example:**
```
NEXTAUTH_SECRET=Xz9k3L5mN8qR2tV6wY0aB4dF7hJ1nP5s
```

⚠️ **IMPORTANT:** 
- Use a DIFFERENT secret for development and production
- Never share this value
- Minimum 32 characters

---

### 10. NEXTAUTH_URL

**What it is:** The base URL where your app is running.

**For development:**
```
NEXTAUTH_URL=http://localhost:3000
```

**For production:**
```
NEXTAUTH_URL=https://yourdomain.com
```

⚠️ **IMPORTANT:** Must match your actual domain (no trailing slash)

---

## 📝 Complete .env.local Template

Here's what your `.env.local` file should look like when filled in:

```env
# Supabase (from https://supabase.com → Settings → API)
NEXT_PUBLIC_SUPABASE_URL=https://xyzproject123.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOi...

# Cloudflare R2 (from Cloudflare Dashboard → R2)
CLOUDFLARE_ACCOUNT_ID=1234567890abcdef1234567890abcdef
CLOUDFLARE_ACCESS_KEY_ID=a1b2c3d4e5f6g7h8i9j0
CLOUDFLARE_SECRET_ACCESS_KEY=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0
CLOUDFLARE_BUCKET_NAME=atqhunter-images
CLOUDFLARE_PUBLIC_URL=https://pub-a1b2c3d4e5f6.r2.dev

# NextAuth (generate secret, set URL)
NEXTAUTH_SECRET=Xz9k3L5mN8qR2tV6wY0aB4dF7hJ1nP5s
NEXTAUTH_URL=http://localhost:3000
```

---

## ✅ Verification Checklist

Before running the app, verify:

- [ ] All 10 variables are filled in
- [ ] No placeholder text remains (no "your_", "placeholder_", etc.)
- [ ] Supabase keys start with `eyJ`
- [ ] URLs include `https://` or `http://`
- [ ] No extra spaces or quotes around values
- [ ] Bucket name matches exactly (case-sensitive)
- [ ] File is named `.env.local` (with the dot at the start)
- [ ] File is in the project root (same folder as `package.json`)

---

## 🔒 Security Reminders

**NEVER share or commit these values:**
- ❌ Don't commit `.env.local` to Git
- ❌ Don't share screenshots with keys visible
- ❌ Don't post keys in support forums
- ❌ Don't store keys in cloud notes

**Good practices:**
- ✅ `.env.local` is already in `.gitignore`
- ✅ Use different secrets for dev and production
- ✅ Rotate keys if accidentally exposed
- ✅ Keep backups in a password manager

---

## 🆘 Lost Your Keys?

**Supabase keys:**
- Can be found anytime in Settings → API
- service_role key can be revealed again

**Cloudflare R2 keys:**
- ⚠️ Cannot be retrieved if lost!
- Must create a new API token
- Old token can be deleted

**NextAuth secret:**
- Just generate a new one
- ⚠️ Will log out all users when changed

---

## 📞 Support

If you're stuck:
1. Double-check you're in the right section of each dashboard
2. Verify key formats match the examples above
3. Check `CHECKLIST.md` for step-by-step verification
4. Check `SETUP_INSTRUCTIONS.md` for detailed guides

---

**Ready?** Copy this file and fill in your actual values to create your `.env.local` file!

