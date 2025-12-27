# ATQ Hunter

Artwork gallery management system built with Next.js, Supabase, and Cloudflare R2.

## Features

- Artwork and gallery management
- Password protection for galleries and artworks
- Nested gallery structure
- Image upload to Cloudflare R2
- Admin authentication
- Responsive design

## Tech Stack

- Next.js 16
- TypeScript
- Supabase (database)
- Cloudflare R2 (image storage)
- NextAuth (authentication)

## Environment Variables

Required environment variables are listed in `KEYS_REFERENCE.md`. Copy `.env.local` from `ENV_TEMPLATE.txt` and fill in your values.

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables in `.env.local`

3. Run the development server:
```bash
npm run dev
```

4. Create an admin user:
```bash
node scripts/create-admin.js
```

## Project Structure

```
app/
  admin/          - Admin pages
  api/            - API routes
  artwork/        - Artwork detail pages
  page.tsx        - Home page

components/
  admin/          - Admin components
  galleries/      - Gallery components
  home/           - Home page components
  navbar/         - Navigation components
```

## Deployment

Deploy to Vercel or any platform that supports Next.js. Ensure all environment variables are set in your deployment platform.
