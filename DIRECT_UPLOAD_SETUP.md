# Direct Upload to Cloudflare R2 - Setup Guide

## ✅ Implementation Complete

Your application now uses **direct uploads to Cloudflare R2**, bypassing Vercel's 4.5MB body size limit entirely. This allows you to upload **unlimited high-resolution images** (24+ photos) without any size restrictions.

## 🔄 How It Works

### Old Architecture (❌ Limited to 4.5MB):
```
Browser → Vercel API → Cloudflare R2
         (4.5MB limit)
```

### New Architecture (✅ Unlimited):
```
Browser → Cloudflare R2 (direct upload)
Browser → Vercel API (metadata only)
```

## 📋 Changes Made

### 1. **Presigned URL Generation** (`lib/cloudflare.ts`)
   - Added `generatePresignedUploadUrl()` function
   - Generates temporary upload URLs (5-minute expiration)
   - Uses AWS SDK's `getSignedUrl` with S3-compatible R2 API

### 2. **New API Route** (`app/api/upload/presigned/route.ts`)
   - Generates presigned URLs for client-side uploads
   - Rate limited: 100 requests/hour per IP
   - Validates file types before generating URLs

### 3. **Updated Upload Flow** (`components/admin/UploadArtworkClient.tsx`)
   - Images upload directly to R2 using presigned URLs
   - Only metadata (title, description, image URLs) sent to Vercel
   - No file size limits on client or server
   - Progress toasts: "Uploading images..." → "Saving artwork..."

### 4. **Updated Edit Flow** (`components/admin/EditArtworkClient.tsx`)
   - New images also upload directly to R2
   - Same presigned URL approach

### 5. **Updated Artwork Upload API** (`app/api/artwork/upload/route.ts`)
   - Now accepts `imageUrls` array instead of `File` objects
   - Validates URLs are from your Cloudflare R2 domain
   - No file size validation needed

## ⚙️ Required Configuration

### Cloudflare R2 CORS Setup

**IMPORTANT**: You must configure CORS on your R2 bucket to allow direct browser uploads.

1. Go to **Cloudflare Dashboard** → **R2** → Your Bucket
2. Click **Settings** → **CORS Policy**
3. Add the following CORS configuration:

```json
[
  {
    "AllowedOrigins": [
      "http://localhost:3000",
      "atqhunter.vercel.app",
      "https://your-custom-domain.com"
    ],
    "AllowedMethods": [
      "PUT",
      "GET",
      "HEAD"
    ],
    "AllowedHeaders": [
      "*"
    ],
    "ExposeHeaders": [
      "ETag"
    ],
    "MaxAgeSeconds": 3600
  }
]
```

**Replace**:
- `your-vercel-domain.vercel.app` with your actual Vercel deployment URL
- `your-custom-domain.com` with your custom domain (if applicable)

### For Development:
Add `http://localhost:3000` to `AllowedOrigins`

### For Production:
Add your Vercel deployment URL and custom domain

## 🎯 Benefits

1. **No Size Limits**: Upload 24+ high-resolution images without restrictions
2. **Faster Uploads**: Direct to R2, bypassing Vercel's serverless function
3. **Better Scalability**: R2 handles uploads, Vercel only processes metadata
4. **Cost Efficient**: Less bandwidth through Vercel
5. **Better UX**: Progress indicators show upload status

## 🧪 Testing

1. **Test Upload**:
   - Go to `/admin/posts/new`
   - Select multiple high-resolution images (24+ if needed)
   - Upload should work without 413 errors

2. **Test Edit**:
   - Edit an existing artwork
   - Add new images
   - Should upload directly to R2

3. **Check CORS**:
   - If uploads fail with CORS errors, verify R2 bucket CORS settings
   - Check browser console for specific CORS error messages

## 🔍 Troubleshooting

### Error: "CORS policy blocked"
- **Solution**: Configure CORS on R2 bucket (see above)

### Error: "Failed to get upload URL"
- **Solution**: Check `RESEND_API_KEY` is set (this route uses `requireAuth()`)

### Error: "Invalid image URL. Must be from Cloudflare R2"
- **Solution**: Verify `CLOUDFLARE_PUBLIC_URL` in `.env.local` matches your R2 public URL

### Uploads stuck / timeout
- **Solution**: Check R2 bucket permissions and CORS configuration
- Verify presigned URLs are being generated correctly (check Network tab)

## 📝 Notes

- Presigned URLs expire after 5 minutes (configurable in `lib/cloudflare.ts`)
- Rate limiting still applies: 100 presigned URL requests/hour per IP
- HEIC conversion still happens client-side before upload
- All images are uploaded with full resolution (no compression)

---

**Status**: ✅ Ready for production (after CORS configuration)

