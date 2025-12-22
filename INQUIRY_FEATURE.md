# ✉️ Artwork Inquiry Feature

## What Was Added

A professional inquiry form that allows potential buyers to contact you about artworks directly from the website.

## 🎨 User Experience

### On Artwork Pages (`/artwork/[id]`)

1. **"Inquire About This Piece" button** appears below the price and gallery info
2. Clicking opens a beautiful modal form
3. User fills in:
   - Their email address
   - Subject line
   - Message
4. On submit:
   - Email sent to **huikh2r@yahoo.com**
   - CC copy sent to their email
   - Success confirmation shown
   - Modal auto-closes after 2 seconds

## 📧 Email Details

**Subject Format:**
```
ATQHunter - [User's Subject]
```

**Recipients:**
- **To:** huikh2r@yahoo.com
- **CC:** [Sender's email]
- **Reply-To:** [Sender's email] (for easy responses)

**Email Template Includes:**
- Artwork title
- Sender's email
- Subject
- Full message
- Professional formatting
- Instructions to reply directly

## 🔧 Technical Stack

- **Email Service:** Resend (3,000 free emails/month)
- **API Route:** `/app/api/inquire/route.ts`
- **Component:** `/components/InquiryModal.tsx`
- **Validation:** Email format, required fields
- **Error Handling:** User-friendly error messages

## 📋 Files Created/Modified

### New Files:
1. `/components/InquiryModal.tsx` - Inquiry form modal component
2. `/app/api/inquire/route.ts` - API endpoint for sending emails
3. `/RESEND_SETUP.md` - Complete setup instructions

### Modified Files:
1. `/components/ArtworkDetail.tsx` - Added inquiry button and modal
2. `/app/globals.css` - Added inquiry UI styles
3. `/ENV_TEMPLATE.txt` - Added RESEND_API_KEY

## ⚡ Setup Required

You need to add one environment variable to your `.env.local` file:

```bash
RESEND_API_KEY=re_your_actual_api_key_here
```

**Get your API key:**
1. Go to [https://resend.com](https://resend.com)
2. Sign up (free)
3. Create an API key
4. Add it to `.env.local`

See **RESEND_SETUP.md** for detailed instructions.

## 🎯 Features

✅ **Email Validation** - Ensures valid email format  
✅ **Required Fields** - All fields must be filled  
✅ **Loading States** - Shows "Sending..." during submission  
✅ **Success Animation** - Checkmark animation on success  
✅ **Error Handling** - Clear error messages  
✅ **Mobile Responsive** - Works perfectly on all devices  
✅ **Accessible** - Keyboard navigation, ARIA labels  
✅ **Professional Design** - Matches site aesthetic  

## 📱 Mobile-Friendly

- Full-width button on mobile
- Touch-optimized modal
- Easy-to-use form fields
- Smooth animations

## 🛡️ Security

- Server-side email validation
- Rate limiting through Resend
- No spam prevention (Resend's built-in)
- Safe HTML email template

## 🚀 Testing

1. Start your dev server:
   ```bash
   npm run dev
   ```

2. Visit any artwork page

3. Click **"Inquire About This Piece"**

4. Fill out the form with your test email

5. Check both:
   - huikh2r@yahoo.com (primary)
   - Your test email (CC copy)

## 💡 Tips

- **Reply Directly:** When you get an inquiry, just hit "Reply" - it goes directly to the sender
- **Professional Image:** Emails are beautifully formatted
- **Spam Folder:** First email might go to spam, mark as "Not Spam"
- **Custom Domain:** You can use your own domain (e.g., contact@atqhunter.com) - see RESEND_SETUP.md

## 📊 Usage Limits

**Free Tier (Forever):**
- 3,000 emails/month
- ~100 emails/day
- Perfect for most art galleries

## 🎨 Customization

Want to change the button text or email template?

**Button Text:**
- Edit in `/components/ArtworkDetail.tsx`
- Current: "Inquire About This Piece"

**Email Template:**
- Edit in `/app/api/inquire/route.ts`
- Customize HTML, colors, layout

**Modal Title:**
- Edit in `/components/InquiryModal.tsx`
- Current: "Inquire About This Artwork"

## ❓ Troubleshooting

**Button doesn't appear:**
- Check that the component imported correctly
- Clear cache and reload

**Form doesn't submit:**
- Verify RESEND_API_KEY in .env.local
- Restart dev server after adding key
- Check browser console for errors

**Emails not arriving:**
- Check spam/junk folders
- Verify Resend dashboard
- Confirm API key is valid

---

**Need Help?** See RESEND_SETUP.md for detailed setup instructions!

