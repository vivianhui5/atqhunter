# ATQ Hunter - Artwork Gallery Setup Instructions

## Prerequisites
- Node.js 18+ installed
- A Supabase account
- A Cloudflare account with R2 access

## 1. Supabase Setup

### Create a Supabase Project
1. Go to https://supabase.com and create a new project
2. Wait for the project to be provisioned

### Get Your API Keys
1. Go to Project Settings → API
2. Copy the `Project URL` and `anon public` key
3. Copy the `service_role` key (keep this secret!)

### Create Database Tables
1. Go to the SQL Editor in your Supabase dashboard
2. Run the following SQL:

```sql
-- Create galleries table
CREATE TABLE galleries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create artwork_posts table
CREATE TABLE artwork_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2),
  gallery_id UUID REFERENCES galleries(id) ON DELETE SET NULL,
  is_pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create artwork_images table
CREATE TABLE artwork_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  artwork_post_id UUID REFERENCES artwork_posts(id) ON DELETE CASCADE NOT NULL,
  image_url TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create admin_users table
CREATE TABLE admin_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX idx_artwork_posts_gallery_id ON artwork_posts(gallery_id);
CREATE INDEX idx_artwork_posts_is_pinned ON artwork_posts(is_pinned);
CREATE INDEX idx_artwork_images_post_id ON artwork_images(artwork_post_id);
CREATE INDEX idx_artwork_posts_created_at ON artwork_posts(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE galleries ENABLE ROW LEVEL SECURITY;
ALTER TABLE artwork_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE artwork_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Public galleries read access" ON galleries FOR SELECT USING (true);
CREATE POLICY "Public artwork_posts read access" ON artwork_posts FOR SELECT USING (true);
CREATE POLICY "Public artwork_images read access" ON artwork_images FOR SELECT USING (true);

-- Admin users can only be accessed by service role (no public access)
```

### If you already have the tables, add the pinned column:
```sql
ALTER TABLE artwork_posts ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE;
CREATE INDEX IF NOT EXISTS idx_artwork_posts_is_pinned ON artwork_posts(is_pinned);
```

### Create Your First Admin User
After setting up the project, you'll need to create an admin user. Run this in your terminal:

```bash
npm run create-admin
```

Follow the prompts to create your admin email and password.

## 2. Cloudflare R2 Setup

### Create R2 Bucket
1. Log in to your Cloudflare dashboard
2. Go to R2 Object Storage
3. Click "Create bucket"
4. Name your bucket (e.g., "atqhunter-images")
5. Click "Create bucket"

### Get API Credentials
1. In R2, click "Manage R2 API Tokens"
2. Click "Create API Token"
3. Give it a name (e.g., "ATQHunter Upload")
4. Set permissions to "Object Read & Write"
5. (Optional) Scope it to your specific bucket
6. Click "Create API Token"
7. **IMPORTANT**: Copy your `Access Key ID` and `Secret Access Key` immediately (you won't see them again!)

### Configure Public Access (Required)
1. Go to your bucket settings
2. Click "Settings" → "Public access"
3. Enable public access or set up a custom domain
4. Note your public URL (e.g., `https://pub-xxxxx.r2.dev`)

### Get Your Account ID
1. Your Account ID is visible in the R2 dashboard URL or in your account settings

## 3. Environment Variables Setup

1. Copy `ENV_TEMPLATE.txt` content to a new file named `.env.local`:

2. Fill in all the values in `.env.local`

3. Generate your `NEXTAUTH_SECRET`:
```bash
openssl rand -base64 32
```

## 4. Install Dependencies

```bash
npm install
```

## 5. Run the Development Server

```bash
npm run dev
```

Visit http://localhost:3000

## 6. Access Admin Panel

1. Navigate to http://localhost:3000/admin
2. Log in with the admin credentials you created
3. Start uploading artwork!

## Production Deployment

When deploying to production (e.g., Vercel):

1. Add all environment variables to your hosting platform
2. Update `NEXTAUTH_URL` to your production domain
3. Make sure your Cloudflare R2 bucket has public access enabled

## Troubleshooting

### Images not showing
- Verify Cloudflare R2 public access is enabled
- Check that the public URL is correct in your env
- Make sure images were uploaded successfully

### Database Connection Issues
- Verify your Supabase URL and keys are correct
- Check that RLS policies are set up correctly

### Image Upload Issues
- Verify Cloudflare R2 credentials
- Check bucket name is correct
- Ensure API token has write permissions

### Authentication Issues
- Regenerate NEXTAUTH_SECRET if needed
- Clear browser cookies and try again
- Check that admin user exists in database
