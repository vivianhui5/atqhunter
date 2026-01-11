import { MetadataRoute } from 'next';
import { supabaseAdmin } from '@/lib/supabase';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://atqhunter.com';

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
  ];

  // Fetch all public galleries (without password protection)
  const { data: galleries } = await supabaseAdmin
    .from('galleries')
    .select('id, created_at, parent_id, password')
    .is('password', null);

  const galleryPages: MetadataRoute.Sitemap = (galleries || []).map((gallery) => ({
    url: `${baseUrl}/?gallery=${gallery.id}`,
    lastModified: new Date(gallery.created_at),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  // Fetch all public artworks (without password protection)
  const { data: artworks } = await supabaseAdmin
    .from('artwork_posts')
    .select('id, created_at, updated_at, password')
    .is('password', null);

  const artworkPages: MetadataRoute.Sitemap = (artworks || []).map((artwork) => ({
    url: `${baseUrl}/artwork/${artwork.id}`,
    lastModified: new Date(artwork.updated_at || artwork.created_at),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  return [...staticPages, ...galleryPages, ...artworkPages];
}

