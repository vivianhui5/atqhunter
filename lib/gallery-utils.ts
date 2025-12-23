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

