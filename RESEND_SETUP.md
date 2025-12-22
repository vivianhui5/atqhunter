# Resend Email Setup Guide

## Overview
The inquiry form on artwork pages uses **Resend** to send emails. Resend offers **3,000 free emails per month**, making it perfect for this use case.

## Features
- ✅ Users can inquire about artwork
- ✅ Email sent to **huikh2r@yahoo.com**
- ✅ CC copy sent to the sender's email
- ✅ Subject line format: **"ATQHunter - [user's subject]"**
- ✅ Professional email template
- ✅ Reply-to set to sender's email for easy responses

## Setup Instructions

### 1. Create a Resend Account

1. Go to [https://resend.com](https://resend.com)
2. Click **"Sign Up"** (it's free!)
3. Verify your email address

### 2. Get Your API Key

1. Once logged in, go to **[API Keys](https://resend.com/api-keys)**
2. Click **"Create API Key"**
3. Give it a name like "ATQ Hunter Production"
4. Select permissions: **"Sending access"**
5. Click **"Create"**
6. **Copy the API key** (it starts with `re_`)
   - ⚠️ You can only see this once! Save it immediately.

### 3. Add to Your Environment Variables

1. Open your `.env.local` file
2. Add this line:
   ```
   RESEND_API_KEY=re_your_actual_api_key_here
   ```
3. Replace with your actual API key from step 2

### 4. Verify Domain (Optional but Recommended)

By default, Resend uses `onboarding@resend.dev` as the sender address. To use a custom domain:

1. Go to [Domains](https://resend.com/domains)
2. Click **"Add Domain"**
3. Follow the DNS setup instructions
4. Once verified, update the `from` field in `/app/api/inquire/route.ts`:
   ```typescript
   from: 'ATQ Hunter <noreply@yourdomain.com>',
   ```

### 5. Test the Feature

1. Restart your dev server:
   ```bash
   npm run dev
   ```
2. Go to any artwork page
3. Click the **"Inquire About This Piece"** button
4. Fill out the form and send a test inquiry
5. Check **huikh2r@yahoo.com** for the email
6. Check your own email for the CC copy

## Email Format

The email sent will look like this:

```
To: huikh2r@yahoo.com
CC: [sender's email]
Subject: ATQHunter - [user's subject]
Reply-To: [sender's email]

----------------------------------------
New Inquiry from ATQ Hunter
----------------------------------------

Artwork: [artwork title]
From: [sender's email]
Subject: [user's subject]

Message:
[user's message]

----------------------------------------
This inquiry was sent through the ATQ Hunter website.
Reply directly to this email to respond to [sender's email]
```

## Free Tier Limits

- **3,000 emails per month** (free forever)
- Perfect for:
  - Up to 100 inquiries per day
  - Small to medium art galleries
  - Personal art collections

## Troubleshooting

### "Failed to send email"
- Check that `RESEND_API_KEY` is in `.env.local`
- Verify the API key is correct
- Restart your dev server after adding the key

### Emails not arriving
- Check spam/junk folders
- Verify the recipient email (huikh2r@yahoo.com)
- Check Resend dashboard for delivery status

### Rate limit errors
- Free tier: 3,000 emails/month
- If you hit the limit, emails will fail until next month
- Consider upgrading to paid tier if needed

## Alternative: Custom Domain

If you want emails to come from your own domain (e.g., `contact@atqhunter.com`):

1. Add and verify your domain in Resend
2. Update the `from` field in the API route
3. Emails will look more professional!

## Need Help?

- [Resend Documentation](https://resend.com/docs)
- [Resend API Reference](https://resend.com/docs/api-reference)
- [Resend Support](https://resend.com/support)

