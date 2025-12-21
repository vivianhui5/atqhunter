# ATQ Hunter - Artwork Gallery

A professional, modern web application for displaying and managing artwork collections. Built with Next.js, Supabase, and Cloudflare R2.

## Features

✨ **Admin Dashboard**
- Secure authentication for admin users
- Rich text editor for artwork descriptions (bold, italic, underline, font sizes)
- Bulk upload up to 10 images per artwork
- Create and manage galleries (folders)
- Set prices and descriptions for each artwork

🎨 **Public Gallery**
- Browse all artwork listings
- Filter by gallery/collection
- Beautiful image viewer with lightbox
- Responsive, mobile-friendly design
- Professional and clean UI

🔒 **Security**
- Protected admin routes with NextAuth
- Row-level security in Supabase
- Secure image storage with Cloudflare R2

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Image Storage**: Cloudflare R2
- **Authentication**: NextAuth.js
- **Styling**: Tailwind CSS
- **Rich Text Editor**: Tiptap
- **TypeScript**: Full type safety

## Getting Started

### Prerequisites

- Node.js 18+
- A Supabase account
- A Cloudflare account with R2 access

### Setup

1. **Clone and Install**
   ```bash
   npm install
   ```

2. **Configure Environment Variables**
   
   See `SETUP_INSTRUCTIONS.md` for detailed setup steps for:
   - Supabase database and API keys
   - Cloudflare R2 bucket and credentials
   - NextAuth configuration

3. **Run Database Migrations**
   
   Execute the SQL schema provided in `SETUP_INSTRUCTIONS.md` in your Supabase SQL editor.

4. **Start Development Server**
   ```bash
   npm run dev
   ```

5. **Create Admin User**
   
   In a separate terminal:
   ```bash
   npm run create-admin
   ```

6. **Access the Application**
   - Public Gallery: http://localhost:3000
   - Admin Dashboard: http://localhost:3000/admin

## Project Structure

```
atqhunter/
├── app/
│   ├── api/              # API routes
│   ├── admin/            # Admin dashboard
│   ├── artwork/          # Artwork detail pages
│   ├── galleries/        # Gallery pages
│   └── page.tsx          # Home page
├── components/           # React components
├── lib/                  # Utility functions
├── types/                # TypeScript types
└── scripts/              # Helper scripts
```

## Usage

### Admin Dashboard

1. Navigate to `/admin` and sign in
2. Create galleries (optional) to organize artwork
3. Upload artwork with:
   - Title (required)
   - Rich text description
   - Price (optional)
   - Up to 10 images
   - Gallery assignment (optional)

### Public Gallery

- **All Listings**: View all uploaded artwork
- **Galleries**: Browse organized collections
- **Artwork Detail**: Click any artwork to see all images and full details

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy!

### Other Platforms

Works with any platform supporting Next.js (Railway, Render, etc.)

## Environment Variables

See `.env.example` for required variables:

- Supabase: URL, anon key, service role key
- Cloudflare R2: Account ID, access keys, bucket name
- NextAuth: Secret, URL

## License

MIT

## Support

For issues or questions, please refer to `SETUP_INSTRUCTIONS.md` for detailed configuration help.
