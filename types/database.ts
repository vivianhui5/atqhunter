export interface Gallery {
  id: string;
  name: string;
  created_at: string;
}

export interface ArtworkPost {
  id: string;
  title: string;
  description: string | null;
  price: number | null;
  gallery_id: string | null;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
  gallery?: Gallery;
  images: ArtworkImage[];
}

export interface ArtworkImage {
  id: string;
  artwork_post_id: string;
  image_url: string;
  display_order: number;
  created_at: string;
}

export interface AdminUser {
  id: string;
  email: string;
  password_hash: string;
  created_at: string;
}
