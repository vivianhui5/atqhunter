import { supabaseAdmin } from '@/lib/supabase';
import { ArtworkPost, Gallery } from '@/types/database';
import Navbar from '@/components/navbar/Navbar';
import Footer from '@/components/Footer';
import { isAdmin } from '@/lib/auth';
import { getEffectivePassword, getEffectivePasswordForPost } from '@/lib/gallery-utils';
import HomeClient from '@/components/home/HomeClient';
import ContactUsButton from '@/components/ContactUsButton';
import ProtectedGalleryContent from '@/components/galleries/ProtectedGalleryContent';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getArtworks(): Promise<{ rootArtworks: ArtworkPost[] }> {
  try {
    // First, check if supabaseAdmin is properly initialized
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('SUPABASE_SERVICE_ROLE_KEY is not set!');
      return { rootArtworks: [] };
    }

    const { data, error } = await supabaseAdmin
      .from('artwork_posts')
      .select(`
        id,
        title,
        description,
        price,
        gallery_id,
        password,
        display_order,
        created_at,
        updated_at,
        gallery:galleries(id, name, parent_id, cover_image_url, display_order, created_at),
        images:artwork_images(*)
      `)
      .order('display_order', { ascending: true, nullsFirst: false })
      .order('display_order', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false });

    if (error) {
      // Log error details for debugging
      console.error('Error fetching artworks:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        fullError: JSON.stringify(error),
      });
      return { rootArtworks: [] };
    }

    if (!data) {
      console.error('No data returned from Supabase');
      return { rootArtworks: [] };
    }

    if (!Array.isArray(data)) {
      console.error('Data is not an array:', typeof data, data);
      return { rootArtworks: [] };
    }

    // Fetch all galleries with passwords for inheritance calculation
    const { data: allGalleriesRaw } = await supabaseAdmin
      .from('galleries')
      .select('id, name, parent_id, password, cover_image_url, display_order, created_at');

    // Calculate protection flags and add password field as null for client (we don't send actual passwords)
    const artworks = data.map(a => {
      // Handle gallery relationship - Supabase may return it as array or object
      let galleryObj = null;
      if (a.gallery) {
        // If gallery is an array, take the first item, otherwise use the object
        galleryObj = Array.isArray(a.gallery) ? a.gallery[0] : a.gallery;
        galleryObj = { ...galleryObj, password: null };
      }
      
      const hasOwnPassword = a.password !== null && a.password.length > 0;
      // Use fresh galleries data (with passwords) for inheritance calculation
      const effectivePassword = getEffectivePasswordForPost(
        { gallery_id: a.gallery_id, password: a.password },
        allGalleriesRaw || []
      );
      const isPasswordProtected = effectivePassword !== null;
      
      return {
        ...a,
        password: null, // Don't send actual password to client
        password_protected: isPasswordProtected,
        hasOwnPassword,
        gallery: galleryObj,
      };
    }) as ArtworkPost[];
    // Get root artworks (those without a gallery)
    const rootArtworks = artworks.filter(a => !a.gallery_id);

    return { rootArtworks };
  } catch (err) {
    console.error('Exception in getArtworks:', err);
    return { rootArtworks: [] };
  }
}

async function getRootGalleries(): Promise<(Gallery & { coverImageUrl?: string; previewImages?: string[]; subfolderCount?: number; artworkCount?: number })[]> {
  const { data: galleries, error } = await supabaseAdmin
    .from('galleries')
      .select('id, name, parent_id, password, cover_image_url, display_order, created_at')
      .is('parent_id', null)
    .order('display_order', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false });

  if (error) {
    // Log error for debugging (only in development)
    if (process.env.NODE_ENV === 'development') {
      console.error('Error fetching galleries:', error);
    }
    return [];
  }

  // Fetch all galleries with passwords for inheritance calculation
  const { data: allGalleriesRaw } = await supabaseAdmin
    .from('galleries')
    .select('id, name, parent_id, password, cover_image_url, display_order, created_at');

  if (!galleries || !Array.isArray(galleries)) {
    return [];
  }

  // Fetch cover image, subfolder count, and artwork count for each gallery
  const galleriesWithData = await Promise.all(
    (galleries || []).map(async (gallery) => {
      let coverImageUrl = gallery.cover_image_url;
      
      // If no cover image set, get first artwork's first image
      if (!coverImageUrl) {
        const { data: firstArtwork } = await supabaseAdmin
          .from('artwork_posts')
          .select('images:artwork_images(image_url, display_order)')
          .eq('gallery_id', gallery.id)
          .limit(1)
          .single();
        
        if (firstArtwork?.images && Array.isArray(firstArtwork.images) && firstArtwork.images.length > 0) {
          const sortedImages = firstArtwork.images.sort((a: { display_order: number }, b: { display_order: number }) => a.display_order - b.display_order);
          coverImageUrl = sortedImages[0]?.image_url || null;
        }
      }

      // Keep previewImages for backward compatibility
      const { data: artworks } = await supabaseAdmin
        .from('artwork_posts')
        .select('images:artwork_images(image_url)')
        .eq('gallery_id', gallery.id)
        .limit(4);

      const previewImages = artworks
        ?.flatMap(a => a.images?.map(img => img.image_url) || [])
        .filter(Boolean)
        .slice(0, 4) || [];

      // Get subfolder count
      const { count: subfolderCount } = await supabaseAdmin
        .from('galleries')
        .select('*', { count: 'exact', head: true })
        .eq('parent_id', gallery.id);

      // Get artwork count
      const { count: artworkCount } = await supabaseAdmin
        .from('artwork_posts')
        .select('*', { count: 'exact', head: true })
        .eq('gallery_id', gallery.id);

      const hasOwnPassword = gallery.password !== null && gallery.password.length > 0;
      // Use fresh galleries data (with passwords) for inheritance calculation
      const effectivePassword = getEffectivePassword(gallery, allGalleriesRaw || []);
      const isPasswordProtected = effectivePassword !== null;
      
      // Ensure flags are always boolean (never undefined)
      return { 
        ...gallery,
        display_order: gallery.display_order ?? null,
        password: null, // Don't send password to client
        password_protected: Boolean(isPasswordProtected),
        hasOwnPassword: Boolean(hasOwnPassword),
        coverImageUrl,
        previewImages,
        subfolderCount: subfolderCount || 0,
        artworkCount: artworkCount || 0
      };
    })
  );

  return galleriesWithData;
}

async function getAllGalleries(): Promise<Gallery[]> {
  const { data, error } = await supabaseAdmin
    .from('galleries')
    .select('id, name, parent_id, password, cover_image_url, display_order, created_at');

  if (error) {
    console.error('Error fetching all galleries:', error);
    return [];
  }

  // Calculate protection flags and add password field as null for client (we don't send actual passwords)
  const galleries = data || [];
  return galleries.map(g => {
    const hasOwnPassword = g.password !== null && g.password.length > 0;
    const effectivePassword = getEffectivePassword(g, galleries);
    const isPasswordProtected = effectivePassword !== null;
    
    return {
      ...g,
      display_order: g.display_order ?? null,
      password: null, // Don't send actual password to client
      password_protected: isPasswordProtected,
      hasOwnPassword,
    };
  }) as Gallery[];
}

async function getGalleryById(galleryId: string, allGalleries: Gallery[]): Promise<Gallery | null> {
  const { data, error } = await supabaseAdmin
    .from('galleries')
    .select('id, name, parent_id, password, cover_image_url, display_order, created_at')
    .eq('id', galleryId)
    .single();

  if (error || !data) {
    return null;
  }

  const hasOwnPassword = data.password !== null && data.password.length > 0;
  const effectivePassword = getEffectivePassword(data, allGalleries);
  const isPasswordProtected = effectivePassword !== null;

  return {
    ...data,
    password: null,
    display_order: data.display_order ?? null,
    password_protected: Boolean(isPasswordProtected),
    hasOwnPassword: Boolean(hasOwnPassword),
  } as Gallery;
}

async function getGalleryArtworks(galleryId: string): Promise<ArtworkPost[]> {
  const { data, error } = await supabaseAdmin
    .from('artwork_posts')
    .select(`
      id,
      title,
      description,
      price,
      gallery_id,
      password,
      display_order,
      created_at,
      updated_at,
      gallery:galleries(id, name, parent_id, cover_image_url, display_order, created_at),
      images:artwork_images(*)
    `)
    .eq('gallery_id', galleryId)
    .order('display_order', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false });

  if (error || !data) {
    return [];
  }

  const allGalleriesRaw = await supabaseAdmin
    .from('galleries')
    .select('id, name, parent_id, password, cover_image_url, display_order, created_at');

  return data.map(a => {
    let galleryObj = null;
    if (a.gallery) {
      galleryObj = Array.isArray(a.gallery) ? a.gallery[0] : a.gallery;
      galleryObj = { ...galleryObj, password: null };
    }
    
    const hasOwnPassword = a.password !== null && a.password.length > 0;
    const effectivePassword = getEffectivePasswordForPost(
      { gallery_id: a.gallery_id, password: a.password },
      allGalleriesRaw.data || []
    );
    const isPasswordProtected = effectivePassword !== null;
    
    return {
      ...a,
      password: null,
      password_protected: isPasswordProtected,
      hasOwnPassword,
      gallery: galleryObj,
    };
  }) as ArtworkPost[];
}

async function getChildGalleries(parentId: string): Promise<(Gallery & { coverImageUrl?: string; previewImages?: string[]; subfolderCount?: number; artworkCount?: number })[]> {
  const { data: galleries, error } = await supabaseAdmin
    .from('galleries')
    .select('id, name, parent_id, password, cover_image_url, display_order, created_at')
    .eq('parent_id', parentId)
    .order('display_order', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false });

  if (error || !galleries || !Array.isArray(galleries)) {
    return [];
  }

  const allGalleriesRaw = await supabaseAdmin
    .from('galleries')
    .select('id, name, parent_id, password, cover_image_url, display_order, created_at');

  const galleriesWithData = await Promise.all(
    galleries.map(async (gallery) => {
      let coverImageUrl = gallery.cover_image_url;
      
      if (!coverImageUrl) {
        const { data: firstArtwork } = await supabaseAdmin
          .from('artwork_posts')
          .select('images:artwork_images(image_url, display_order)')
          .eq('gallery_id', gallery.id)
          .limit(1)
          .single();
        
        if (firstArtwork?.images && Array.isArray(firstArtwork.images) && firstArtwork.images.length > 0) {
          const sortedImages = firstArtwork.images.sort((a: { display_order: number }, b: { display_order: number }) => a.display_order - b.display_order);
          coverImageUrl = sortedImages[0]?.image_url || null;
        }
      }

      const { data: artworks } = await supabaseAdmin
        .from('artwork_posts')
        .select('images:artwork_images(image_url)')
        .eq('gallery_id', gallery.id)
        .limit(4);

      const previewImages = artworks
        ?.flatMap(a => a.images?.map(img => img.image_url) || [])
        .filter(Boolean)
        .slice(0, 4) || [];

      const { count: subfolderCount } = await supabaseAdmin
        .from('galleries')
        .select('*', { count: 'exact', head: true })
        .eq('parent_id', gallery.id);

      const { count: artworkCount } = await supabaseAdmin
        .from('artwork_posts')
        .select('*', { count: 'exact', head: true })
        .eq('gallery_id', gallery.id);

      const hasOwnPassword = gallery.password !== null && gallery.password.length > 0;
      const effectivePassword = getEffectivePassword(gallery, allGalleriesRaw.data || []);
      const isPasswordProtected = effectivePassword !== null;
      
      return { 
        ...gallery,
        display_order: gallery.display_order ?? null,
        password: null,
        password_protected: Boolean(isPasswordProtected),
        hasOwnPassword: Boolean(hasOwnPassword),
        coverImageUrl,
        previewImages,
        subfolderCount: subfolderCount || 0,
        artworkCount: artworkCount || 0
      };
    })
  );

  return galleriesWithData;
}

export default async function HomePage({ searchParams }: { searchParams: Promise<{ public?: string; gallery?: string }> }) {
  const params = await searchParams;
  // If public=true query param exists, treat as normal user even if admin
  const isPublicView = params?.public === 'true';
  const adminView = isPublicView ? false : await isAdmin();
  const allGalleries = await getAllGalleries();
  
  // Check if we're viewing a specific gallery
  const galleryId = params?.gallery;
  
  if (galleryId) {
    // Fetch gallery and its contents
    const gallery = await getGalleryById(galleryId, allGalleries);
    if (!gallery) {
      // Gallery not found, show home page
      return redirect('/');
    }
    
    const childGalleries = await getChildGalleries(galleryId);
    const artworks = await getGalleryArtworks(galleryId);
    
    // Get preview images for the gallery
    const { data: previewArtworks } = await supabaseAdmin
      .from('artwork_posts')
      .select('images:artwork_images(image_url)')
      .eq('gallery_id', galleryId)
      .limit(4);
    
    const previewImages = previewArtworks
      ?.flatMap(a => a.images?.map(img => img.image_url) || [])
      .filter(Boolean)
      .slice(0, 4) || [];
    
    return (
      <div className="home-page">
        <Navbar />
        <main className="main-content">
          <ProtectedGalleryContent
            gallery={gallery}
            allGalleries={allGalleries}
            childGalleries={childGalleries}
            artworks={artworks}
            previewImages={previewImages}
            adminView={adminView}
          />
        </main>
        <Footer />
      </div>
    );
  }
  
  // Show home page with all galleries and artworks
  const { rootArtworks } = await getArtworks();
  const rootGalleries = await getRootGalleries();

  // Create unified items: galleries first (alphabetically), then posts (alphabetically)
  type UnifiedItem = 
    | { type: 'gallery'; data: Gallery & { coverImageUrl?: string; previewImages?: string[] }; sortKey: string }
    | { type: 'post'; data: ArtworkPost; sortKey: string };

  const items: UnifiedItem[] = [];

  // Add galleries
  rootGalleries.forEach((gallery) => {
    items.push({
      type: 'gallery',
      data: gallery,
      sortKey: gallery.name.toLowerCase(),
    });
  });

  // Add posts
  rootArtworks.forEach((artwork) => {
    items.push({
      type: 'post',
      data: artwork,
      sortKey: artwork.title.toLowerCase(),
    });
  });

  // Sort by display_order (null values go to end, then by created_at as fallback)
  items.sort((a, b) => {
    const aOrder = a.type === 'gallery' 
      ? (a.data.display_order ?? null)
      : (a.data.display_order ?? null);
    const bOrder = b.type === 'gallery'
      ? (b.data.display_order ?? null)
      : (b.data.display_order ?? null);
    
    // If both have order, sort by order
    if (aOrder !== null && bOrder !== null) {
      return aOrder - bOrder;
    }
    // If only one has order, it comes first
    if (aOrder !== null) return -1;
    if (bOrder !== null) return 1;
    // If neither has order, sort by created_at (newest first)
    const aDate = a.type === 'gallery' ? a.data.created_at : a.data.created_at;
    const bDate = b.type === 'gallery' ? b.data.created_at : b.data.created_at;
    return new Date(bDate).getTime() - new Date(aDate).getTime();
  });

  return (
    <div className="home-page">
      <Navbar />
      
      <main className="main-content">
        {/* Welcome Section */}
        <section className="welcome-section">
          <h1 className="welcome-title">Welcome</h1>
          <p className="welcome-description">
          This gallery showcases some of my Asian artwork collections over 20 years. Please click on each category gallery to see collections. Most artwork are marked with prices, but if you are interested in any collection, please contact me.
          </p>
          <p className="welcome-description">
          这是本人多年下来的部分藏品. 我尽力描述准确. 对于藏品的年代和作者, 我都从各方面考虑, 力求精确. 每一件藏品, 都有我大量的考椐工作. 请点击小面小图以浏览各个藏品. 藏品介绍用中英文标出. 多数藏品有标价, 但如果你对任何一件艺术品感兴趣， 请联系我们          </p>
          <ContactUsButton />
        </section>

        {/* Full Collection Section */}
        <section className="collection-section">
          <HomeClient 
            items={items} 
            allGalleries={allGalleries}
            adminView={adminView}
          />
        </section>
      </main>

      <Footer />
    </div>
  );
}
