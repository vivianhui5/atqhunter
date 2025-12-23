# Vercel Deployment Checklist

## Environment Variables on Vercel

Make sure you've added **ALL** environment variables in Vercel:

1. Go to your Vercel project dashboard
2. Click **Settings** → **Environment Variables**
3. Add all variables from `.env.local`:

### Required Variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_ACCESS_KEY_ID`
- `CLOUDFLARE_SECRET_ACCESS_KEY`
- `CLOUDFLARE_BUCKET_NAME`
- `CLOUDFLARE_PUBLIC_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL` (set to your Vercel URL, e.g., `https://your-app.vercel.app`)
- **`RESEND_API_KEY`** ← Make sure this is set!

### Important Notes:

1. **Redeploy After Adding Variables**
   - After adding/updating environment variables, you MUST redeploy
   - Go to **Deployments** → Click the **"..."** menu → **Redeploy**

2. **Environment Scope**
   - Set variables for: **Production**, **Preview**, and **Development**
   - Or at least **Production** if you only care about the live site

3. **No CC in Code**
   - The code does NOT include CC (removed)
   - If you see CC errors, it's from an old cached deployment
   - **Solution**: Redeploy to clear cache

## Troubleshooting Inquiry Form on Vercel

### Issue: "Email service is not configured"
- **Fix**: Add `RESEND_API_KEY` to Vercel environment variables
- **Then**: Redeploy the project

### Issue: "validation_error" about test domain
- **Fix**: This is expected - test domain only sends to verified email
- **Code**: Already fixed - no CC field in current code
- **If still seeing error**: Redeploy to clear old cached code

### Issue: Form works locally but not on Vercel
1. Check Vercel environment variables are set
2. Check `NEXTAUTH_URL` is set to your Vercel domain
3. Redeploy after adding variables
4. Check Vercel function logs for errors

## How to Redeploy

1. **Via Dashboard:**
   - Go to **Deployments** tab
   - Click **"..."** on latest deployment
   - Click **"Redeploy"**

2. **Via Git:**
   - Make a small commit (add a space to README)
   - Push to trigger new deployment

3. **Via CLI:**
   ```bash
   vercel --prod
   ```

## Verify Deployment

After redeploying:
1. Wait for deployment to complete (2-3 minutes)
2. Test the inquiry form on your live site
3. Check Vercel function logs if it still fails
4. Verify `RESEND_API_KEY` is in environment variables

---

**Quick Fix**: If inquiry form fails on Vercel but works locally:
1. Double-check `RESEND_API_KEY` is in Vercel env vars
2. Redeploy the project
3. Test again

