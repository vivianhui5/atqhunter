import { Gallery } from '@/types/database';

/**
 * Build a hierarchical tree structure from a flat list of galleries
 */
export function buildGalleryTree(galleries: Gallery[]): Gallery[] {
  const galleryMap = new Map<string, Gallery & { children: Gallery[] }>();
  const rootGalleries: Gallery[] = [];

  // First pass: create map with all galleries
  galleries.forEach((gallery) => {
    galleryMap.set(gallery.id, { ...gallery, children: [] });
  });

  // Second pass: build tree structure
  galleries.forEach((gallery) => {
    const galleryWithChildren = galleryMap.get(gallery.id)!;
    
    if (gallery.parent_id && galleryMap.has(gallery.parent_id)) {
      // Has parent - add to parent's children
      const parent = galleryMap.get(gallery.parent_id)!;
      parent.children.push(galleryWithChildren);
    } else {
      // No parent or parent not found - it's a root gallery
      rootGalleries.push(galleryWithChildren);
    }
  });

  return rootGalleries;
}

/**
 * Flatten a hierarchical tree into a flat list with indentation
 */
export function flattenGalleryTree(
  galleries: Gallery[],
  level: number = 0,
  parentPath: string = ''
): Array<Gallery & { indent: number; displayName: string; fullPath: string }> {
  const result: Array<Gallery & { indent: number; displayName: string; fullPath: string }> = [];

  galleries.forEach((gallery) => {
    const currentPath = parentPath ? `${parentPath} > ${gallery.name}` : gallery.name;
    const displayName = level > 0 ? '  '.repeat(level) + '└─ ' + gallery.name : gallery.name;

    result.push({
      ...gallery,
      indent: level,
      displayName,
      fullPath: currentPath,
      path: currentPath,
    });

    // Recursively add children
    if (gallery.children && gallery.children.length > 0) {
      result.push(...flattenGalleryTree(gallery.children, level + 1, currentPath));
    }
  });

  return result;
}

/**
 * Get full path string for a gallery (e.g., "Parent > Child > Grandchild")
 */
export function getGalleryPath(gallery: Gallery, allGalleries: Gallery[]): string {
  const path: string[] = [gallery.name];
  let currentParentId = gallery.parent_id;

  while (currentParentId) {
    const parent = allGalleries.find((g) => g.id === currentParentId);
    if (parent) {
      path.unshift(parent.name);
      currentParentId = parent.parent_id;
    } else {
      break;
    }
  }

  return path.join(' > ');
}

/**
 * Get all ancestor IDs for a gallery (for validation - prevents circular references)
 */
export function getAncestorIds(galleryId: string, allGalleries: Gallery[]): string[] {
  const ancestors: string[] = [];
  let currentId: string | null = galleryId;

  while (currentId) {
    const gallery = allGalleries.find((g) => g.id === currentId);
    if (gallery?.parent_id) {
      ancestors.push(gallery.parent_id);
      currentId = gallery.parent_id;
    } else {
      break;
    }
  }

  return ancestors;
}

/**
 * Check if setting a parent would create a circular reference
 */
export function wouldCreateCircularReference(
  galleryId: string,
  newParentId: string | null,
  allGalleries: Gallery[]
): boolean {
  if (!newParentId) return false; // No parent is always safe
  if (galleryId === newParentId) return true; // Can't be its own parent

  // Check if the new parent is a descendant of this gallery
  const ancestors = getAncestorIds(newParentId, allGalleries);
  return ancestors.includes(galleryId);
}

/**
 * Get the effective password for a gallery (checks parent chain for inheritance)
 */
export function getEffectivePassword(gallery: Gallery, allGalleries: Gallery[]): string | null {
  // If gallery has its own password, use it
  if (gallery.password) {
    return gallery.password;
  }

  // Otherwise, check parent chain
  let currentParentId = gallery.parent_id;
  while (currentParentId) {
    const parent = allGalleries.find((g) => g.id === currentParentId);
    if (!parent) break;
    
    if (parent.password) {
      return parent.password;
    }
    
    currentParentId = parent.parent_id;
  }

  return null;
}

/**
 * Check if a gallery is password protected (either directly or through inheritance)
 */
export function isGalleryPasswordProtected(gallery: Gallery, allGalleries: Gallery[]): boolean {
  return getEffectivePassword(gallery, allGalleries) !== null;
}

/**
 * Get the effective password for an artwork post (checks gallery and parent chain)
 */
export function getEffectivePasswordForPost(
  post: { gallery_id: string | null; password: string | null },
  allGalleries: Gallery[]
): string | null {
  // If post has its own password, use it
  if (post.password) {
    return post.password;
  }

  // Otherwise, check gallery and its parent chain
  if (post.gallery_id) {
    const gallery = allGalleries.find((g) => g.id === post.gallery_id);
    if (gallery) {
      return getEffectivePassword(gallery, allGalleries);
    }
  }

  return null;
}

/**
 * Check if an artwork post is password protected
 */
export function isPostPasswordProtected(
  post: { gallery_id: string | null; password: string | null },
  allGalleries: Gallery[]
): boolean {
  return getEffectivePasswordForPost(post, allGalleries) !== null;
}

/**
 * Check if a gallery or any of its ancestors is unlocked in session storage
 * This is used to determine if a child gallery/post should be accessible
 */
export function isAnyAncestorUnlocked(
  galleryId: string | null,
  allGalleries: Gallery[]
): boolean {
  if (!galleryId || typeof window === 'undefined') return false;
  
  // First check the gallery itself
  const gallery = allGalleries.find((g) => g.id === galleryId);
  if (!gallery) return false;
  
  // Check this gallery and all ancestors
  let currentId: string | null = galleryId;
  while (currentId) {
    const sessionKey = `gallery_unlocked_${currentId}`;
    if (sessionStorage.getItem(sessionKey) === 'true') {
      return true;
    }
    
    const currentGallery = allGalleries.find((g) => g.id === currentId);
    if (!currentGallery?.parent_id) break;
    currentId = currentGallery.parent_id;
  }
  
  return false;
}

/**
 * Get all descendant gallery IDs that inherit password from parent (for unlocking when parent is unlocked)
 * Only includes galleries that don't have their own password
 */
export function getInheritingDescendantIds(galleryId: string, allGalleries: Gallery[]): string[] {
  const descendants: string[] = [];
  const children = allGalleries.filter((g) => g.parent_id === galleryId);
  
  for (const child of children) {
    // Only include if child doesn't have its own password (inherits from parent)
    if (!child.password || child.password.length === 0) {
      descendants.push(child.id);
      // Recursively get descendants that also inherit
      descendants.push(...getInheritingDescendantIds(child.id, allGalleries));
    }
  }
  
  return descendants;
}

/**
 * Check if a gallery has its own password (not inherited)
 */
export function hasOwnPassword(gallery: Gallery): boolean {
  return gallery.password !== null && gallery.password.length > 0;
}

