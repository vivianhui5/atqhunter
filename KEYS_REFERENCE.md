# Environment Variables Reference

Required environment variables for the application.

## Quick Reference

| Variable Name | Where to Get It | Format/Example |
|--------------|-----------------|----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API → Project URL | `https://xxxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API → anon public | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → service_role | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare URL or R2 Dashboard | 32 character alphanumeric string |
| `CLOUDFLARE_ACCESS_KEY_ID` | R2 → Manage API Tokens → Create Token | ~20 characters |
| `CLOUDFLARE_SECRET_ACCESS_KEY` | R2 → Manage API Tokens → Create Token | ~40 characters |
| `CLOUDFLARE_BUCKET_NAME` | R2 → Your bucket name | `atqhunter-images` |
| `CLOUDFLARE_PUBLIC_URL` | R2 → Bucket Settings → Public Access | `https://pub-xxxxx.r2.dev` |
| `NEXTAUTH_SECRET` | Generate: `openssl rand -base64 32` | 44 character random string |
| `NEXTAUTH_URL` | Your app URL | `http://localhost:3000` (dev) / `https://yourdomain.com` (prod) |
| `RESEND_API_KEY` | Resend.com → API Keys | `re_xxxxx` |

## Setup Instructions

1. Copy `ENV_TEMPLATE.txt` to `.env.local`
2. Fill in all values from the table above
3. For `NEXTAUTH_SECRET`, run: `openssl rand -base64 32`
4. Set `NEXTAUTH_URL` to your deployment URL in production

## Security Notes

- Never commit `.env.local` to version control
- Use different secrets for development and production
- Keep service role keys secure
