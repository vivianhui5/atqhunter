'use client';

import { useState, useEffect, useCallback, Suspense, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import AdminLayout from './layout/AdminLayout';
import PostsHeader from './posts/PostsHeader';
import UnifiedGrid from './posts/UnifiedGrid';
import AdminGalleryBreadcrumbs from './posts/AdminGalleryBreadcrumbs';
import EditableGalleryTitle from './posts/EditableGalleryTitle';
import NewGalleryModal from './galleries/NewGalleryModal';
import DeleteGalleryModal from './galleries/DeleteGalleryModal';
import PasswordModal from './galleries/PasswordModal';
import CoverImageSelector from './galleries/CoverImageSelector';
import SearchBar from '@/components/SearchBar';
import { ArtworkPost, Gallery } from '@/types/database';

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}

export default function ManagePostsClient() {
  const searchParams = useSearchParams();
  const galleryId = searchParams.get('gallery');
  
  const [artworks, setArtworks] = useState<ArtworkPost[]>([]);
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [currentGallery, setCurrentGallery] = useState<Gallery | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [showNewGalleryModal, setShowNewGalleryModal] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [galleryToDelete, setGalleryToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeletingGallery, setIsDeletingGallery] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [galleryForPassword, setGalleryForPassword] = useState<{ id: string; name: string; currentPassword: string | null } | null>(null);
  const [postForPassword, setPostForPassword] = useState<{ id: string; title: string; currentPassword: string | null } | null>(null);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [coverImageModalOpen, setCoverImageModalOpen] = useState(false);
  const [galleryForCoverImage, setGalleryForCoverImage] = useState<{ id: string; name: string; currentCoverImage: string | null; availableImages: string[] } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  };

  const fetchGalleries = useCallback(async () => {
    try {
      const res = await fetch('/api/galleries?includeImages=true');
      const data = await res.json();
      setGalleries(data.galleries || []);
    } catch {
      console.error('Error fetching galleries');
    }
  }, []);

  const fetchArtworks = useCallback(async () => {
    try {
      const res = await fetch('/api/artwork');
      const data = await res.json();
      setArtworks(data.artworks || []);
    } catch {
      console.error('Error fetching artworks');
    }
  }, []);

  useEffect(() => {
    void fetchGalleries();
    void fetchArtworks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Set current gallery when galleryId changes
  useEffect(() => {
    if (galleryId && galleries.length > 0) {
      const gallery = galleries.find((g) => g.id === galleryId);
      setCurrentGallery(gallery || null);
    } else {
      setCurrentGallery(null);
    }
  }, [galleryId, galleries]);

  // Get unified items (galleries + posts) sorted by display_order
  const unifiedItems = useMemo(() => {
    type UnifiedItem = 
      | { type: 'gallery'; data: Gallery & { previewImages?: string[] }; artworkCount: number; subfolderCount?: number; id: string }
      | { type: 'post'; data: ArtworkPost; id: string };

    const items: UnifiedItem[] = [];

    // Get galleries to display
    let displayGalleries: (Gallery & { previewImages?: string[]; allImages?: string[] })[] = [];
    if (!currentGallery) {
      // Show root galleries
      displayGalleries = galleries.filter((g) => !g.parent_id).map((g) => {
        const galleryArtworks = artworks.filter((a) => a.gallery_id === g.id);
        const allImages = galleryArtworks
          .flatMap((a) => a.images?.map((img) => img.image_url) || [])
          .filter(Boolean);
        // Keep previewImages for backward compatibility, but also store allImages
        const previewImages = allImages.slice(0, 4);
        return { ...g, previewImages, allImages };
      });
    } else {
      // Show child galleries of current gallery
      displayGalleries = galleries.filter((g) => g.parent_id === currentGallery.id).map((g) => {
        const galleryArtworks = artworks.filter((a) => a.gallery_id === g.id);
        const allImages = galleryArtworks
          .flatMap((a) => a.images?.map((img) => img.image_url) || [])
          .filter(Boolean);
        // Keep previewImages for backward compatibility, but also store allImages
        const previewImages = allImages.slice(0, 4);
        return { ...g, previewImages, allImages };
      });
    }

    // Filter galleries by search query (name or ID)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      displayGalleries = displayGalleries.filter((gallery) =>
        gallery.name.toLowerCase().includes(query) ||
        gallery.id.toLowerCase().includes(query)
      );
    }

    // Add galleries to items
    displayGalleries.forEach((gallery) => {
      const artworkCount = artworks.filter((a) => a.gallery_id === gallery.id).length;
      const subfolderCount = galleries.filter((g) => g.parent_id === gallery.id).length;
      items.push({
        type: 'gallery',
        data: gallery,
        artworkCount,
        subfolderCount,
        id: gallery.id,
      });
    });

    // Get artworks to display
    let displayArtworks = artworks;
    if (currentGallery) {
      // Show only artworks directly in this gallery (not in sub-galleries)
      displayArtworks = displayArtworks.filter((a) => a.gallery_id === currentGallery.id);
    } else {
      // Show artworks with no gallery (root posts)
      displayArtworks = displayArtworks.filter((a) => !a.gallery_id);
    }

    // Filter artworks by search query (title or ID)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      displayArtworks = displayArtworks.filter((artwork) =>
        artwork.title.toLowerCase().includes(query) ||
        artwork.id.toLowerCase().includes(query)
      );
    }

    // Add posts to items
    displayArtworks.forEach((artwork) => {
      items.push({
        type: 'post',
        data: artwork,
        id: artwork.id,
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

    return items;
  }, [galleries, artworks, currentGallery, searchQuery]);

  const handleReorder = async () => {
    // Refetch to get updated data
    await fetchGalleries();
    await fetchArtworks();
    showToast('Order updated successfully', 'success');
  };

  const togglePin = async (_id: string, _currentPinned: boolean) => {
    // Removed - no longer using featured/pinned functionality
    return;
  };

  const deleteArtwork = async (id: string) => {
    if (!confirm('Are you sure you want to delete this artwork?')) return;

    try {
      const res = await fetch(`/api/artwork/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Artwork deleted successfully', 'success');
        fetchArtworks();
      }
    } catch {
      showToast('Failed to delete artwork', 'error');
    }
  };

  const handleCreateGallery = async (name: string, parentId: string | null, password: string | null) => {
    const duplicate = galleries.find((g) => g.name.toLowerCase() === name.toLowerCase());
    if (duplicate) {
      showToast('A gallery with this name already exists', 'error');
      return;
    }

    try {
      const res = await fetch('/api/galleries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, parent_id: parentId, password }),
      });

      if (res.ok) {
        await fetchGalleries();
        setShowNewGalleryModal(false);
        showToast('Gallery created!', 'success');
      }
    } catch {
      showToast('Failed to create gallery', 'error');
    }
  };

  const handleUpdateGalleryName = async (id: string, newName: string) => {
    const duplicate = galleries.find(
      (g) => g.id !== id && g.name.toLowerCase() === newName.toLowerCase()
    );
    if (duplicate) {
      showToast('A gallery with this name already exists', 'error');
      return;
    }

    try {
      const res = await fetch(`/api/galleries/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName }),
      });

      if (res.ok) {
        await fetchGalleries();
        // Update current gallery if it's the one being edited
        if (currentGallery && currentGallery.id === id) {
          setCurrentGallery({ ...currentGallery, name: newName });
        }
        showToast('Gallery updated!', 'success');
      }
    } catch {
      showToast('Failed to update gallery', 'error');
    }
  };

  // Recursively count artworks in a gallery and all its children
  const getTotalArtworkCount = (galleryId: string): number => {
    const directCount = artworks.filter((a) => a.gallery_id === galleryId).length;
    const children = galleries.filter((g) => g.parent_id === galleryId);
    const childrenCount = children.reduce((sum, child) => sum + getTotalArtworkCount(child.id), 0);
    return directCount + childrenCount;
  };

  // Recursively count sub-galleries (including nested ones)
  const getTotalSubGalleryCount = (galleryId: string): number => {
    const directChildren = galleries.filter((g) => g.parent_id === galleryId);
    let count = directChildren.length;
    for (const child of directChildren) {
      count += getTotalSubGalleryCount(child.id);
    }
    return count;
  };

  const handleDeleteGallery = (id: string, name: string) => {
    setGalleryToDelete({ id, name });
    setDeleteModalOpen(true);
  };

  const handleManagePassword = (id: string, name: string, currentPassword: string | null) => {
    setGalleryForPassword({ id, name, currentPassword });
    setPasswordModalOpen(true);
  };

  const handleEditCoverImage = (id: string, name: string, currentCoverImage: string | null, availableImages: string[]) => {
    setGalleryForCoverImage({ id, name, currentCoverImage, availableImages });
    setCoverImageModalOpen(true);
  };

  const handleSaveCoverImage = async (imageUrl: string | null) => {
    if (!galleryForCoverImage) return;

    try {
      const res = await fetch(`/api/galleries/${galleryForCoverImage.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cover_image_url: imageUrl }),
      });

      if (res.ok) {
        await fetchGalleries();
        // Update current gallery if it's the one being edited
        if (currentGallery && currentGallery.id === galleryForCoverImage.id) {
          setCurrentGallery({ ...currentGallery, cover_image_url: imageUrl });
        }
        setCoverImageModalOpen(false);
        setGalleryForCoverImage(null);
        showToast('Cover image updated!', 'success');
      } else {
        showToast('Failed to update cover image', 'error');
      }
    } catch {
      showToast('Failed to update cover image', 'error');
    }
  };

  const handleSavePassword = async (password: string | null) => {
    if (!galleryForPassword && !postForPassword) return;

    setIsSavingPassword(true);
    try {
      let res;
      if (galleryForPassword) {
        res = await fetch(`/api/galleries/${galleryForPassword.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password }),
        });
      } else if (postForPassword) {
        res = await fetch(`/api/artwork/${postForPassword.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password }),
        });
      } else {
        return;
      }

      if (res.ok) {
        if (galleryForPassword) {
          await fetchGalleries();
        } else {
          await fetchArtworks();
        }
        showToast(password ? 'Password set successfully' : 'Password removed successfully', 'success');
        setPasswordModalOpen(false);
        setGalleryForPassword(null);
        setPostForPassword(null);
      } else {
        const errorData = await res.json().catch(() => ({ error: 'Failed to update password' }));
        console.error('Failed to update password:', errorData);
        showToast(errorData.error || 'Failed to update password', 'error');
      }
    } catch (err) {
      console.error('Error updating password:', err);
      showToast('Failed to update password', 'error');
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleManagePostPassword = (id: string, title: string, currentPassword: string | null) => {
    setPostForPassword({ id, title, currentPassword });
    setGalleryForPassword(null);
    setPasswordModalOpen(true);
  };

  const handleDeleteGalleryConfirm = async () => {
    if (!galleryToDelete) return;

    setIsDeletingGallery(true);
    try {
      const res = await fetch(`/api/galleries/${galleryToDelete.id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchGalleries();
        await fetchArtworks();
        showToast('Gallery deleted', 'success');
        
        // If we deleted the current gallery, navigate to parent or root
        if (currentGallery && currentGallery.id === galleryToDelete.id) {
          const parentGallery = currentGallery.parent_id 
            ? galleries.find(g => g.id === currentGallery.parent_id)
            : null;
          
          if (parentGallery) {
            const params = new URLSearchParams();
            params.set('gallery', parentGallery.id);
            window.location.href = `/admin?${params.toString()}`;
          } else {
            window.location.href = '/admin';
          }
        }
        
        setDeleteModalOpen(false);
        setGalleryToDelete(null);
      } else {
        const error = await res.json().catch(() => ({ error: 'Failed to delete gallery' }));
        showToast(error.error || 'Failed to delete gallery', 'error');
      }
    } catch {
      showToast('Failed to delete gallery', 'error');
    } finally {
      setIsDeletingGallery(false);
    }
  };

  const handleMoveItem = async (itemId: string, itemType: 'gallery' | 'post', targetGalleryId: string | null) => {
    try {
      if (itemType === 'post') {
        // Move post to gallery
        const res = await fetch(`/api/artwork/${itemId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ gallery_id: targetGalleryId }),
        });

        if (res.ok) {
          await fetchArtworks();
          showToast('Post moved successfully', 'success');
        } else {
          showToast('Failed to move post', 'error');
        }
      } else {
        // Move gallery to another gallery (nest it)
        const res = await fetch(`/api/galleries/${itemId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ parent_id: targetGalleryId }),
        });

        if (res.ok) {
          await fetchGalleries();
          showToast('Gallery moved successfully', 'success');
          // If we moved the current gallery, update the URL
          if (currentGallery && currentGallery.id === itemId) {
            if (targetGalleryId) {
              const params = new URLSearchParams();
              params.set('gallery', targetGalleryId);
              window.location.href = `/admin?${params.toString()}`;
            } else {
              window.location.href = '/admin';
            }
          }
        } else {
          showToast('Failed to move gallery', 'error');
        }
      }
    } catch {
      showToast('Failed to move item', 'error');
    }
  };

  return (
    <AdminLayout>
      {/* Toast Container */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`toast ${toast.type === 'success' ? 'toast-success' : 'toast-error'}`}
          >
            {toast.message}
          </div>
        ))}
      </div>

      <div className="admin-page-container">
        <PostsHeader onCreateGallery={() => setShowNewGalleryModal(true)} />
        
        {/* Breadcrumbs */}
        <Suspense fallback={<div className="admin-breadcrumbs">Loading...</div>}>
          <AdminGalleryBreadcrumbs gallery={currentGallery} allGalleries={galleries} />
        </Suspense>

        {/* Gallery Title with Edit */}
        {currentGallery && (() => {
          // Get all images from artworks in this gallery
          const galleryArtworks = artworks.filter((a) => a.gallery_id === currentGallery.id);
          const allImages = galleryArtworks
            .flatMap((a) => a.images?.map((img) => img.image_url) || [])
            .filter(Boolean);
          
          return (
            <EditableGalleryTitle
              name={currentGallery.name}
              galleryId={currentGallery.id}
              onUpdate={handleUpdateGalleryName}
              onEditCoverImage={handleEditCoverImage}
              currentCoverImage={currentGallery.cover_image_url || null}
              availableImages={allImages}
            />
          );
        })()}
        
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search by name or ID..."
          className="admin-search"
        />

        {/* Unified Grid - Galleries and Posts together */}
        {unifiedItems.length > 0 ? (
          <UnifiedGrid
            items={unifiedItems}
            onTogglePin={togglePin}
            onReorder={handleReorder}
            onDelete={deleteArtwork}
            onDeleteGallery={handleDeleteGallery}
            onUpdateGalleryName={handleUpdateGalleryName}
            onManageGalleryPassword={handleManagePassword}
            onManagePostPassword={handleManagePostPassword}
            onEditGalleryCoverImage={handleEditCoverImage}
            onMoveItem={handleMoveItem}
            galleries={galleries}
            currentGalleryId={currentGallery?.id || null}
          />
        ) : (
          <div className="admin-empty-state">
            <p>
              {searchQuery 
                ? `No items found matching "${searchQuery}"`
                : currentGallery 
                  ? 'This gallery is empty. Create posts or sub-galleries.'
                  : 'No galleries or posts yet. Create your first one!'}
            </p>
          </div>
        )}
        </div>

        {/* New Gallery Modal */}
        <NewGalleryModal
          isOpen={showNewGalleryModal}
          onClose={() => setShowNewGalleryModal(false)}
          onCreate={handleCreateGallery}
          parentId={currentGallery?.id || null}
          galleries={galleries}
        />

        {/* Delete Gallery Modal */}
        {galleryToDelete && (
          <DeleteGalleryModal
            isOpen={deleteModalOpen}
            onClose={() => {
              setDeleteModalOpen(false);
              setGalleryToDelete(null);
            }}
            onConfirm={handleDeleteGalleryConfirm}
            galleryName={galleryToDelete.name}
            artworkCount={getTotalArtworkCount(galleryToDelete.id)}
            subGalleryCount={getTotalSubGalleryCount(galleryToDelete.id)}
            isDeleting={isDeletingGallery}
          />
        )}

        {/* Password Modal */}
        {(galleryForPassword || postForPassword) && (
          <PasswordModal
            isOpen={passwordModalOpen}
            onClose={() => {
              setPasswordModalOpen(false);
              setGalleryForPassword(null);
              setPostForPassword(null);
            }}
            onSave={handleSavePassword}
            currentPassword={galleryForPassword?.currentPassword || postForPassword?.currentPassword || null}
            galleryName={galleryForPassword?.name || postForPassword?.title || ''}
            isSaving={isSavingPassword}
          />
        )}

        {/* Cover Image Selector Modal */}
        {galleryForCoverImage && (
          <CoverImageSelector
            isOpen={coverImageModalOpen}
            onClose={() => {
              setCoverImageModalOpen(false);
              setGalleryForCoverImage(null);
            }}
            galleryId={galleryForCoverImage.id}
            currentCoverImage={galleryForCoverImage.currentCoverImage}
            availableImages={galleryForCoverImage.availableImages}
            onSelect={handleSaveCoverImage}
          />
        )}
    </AdminLayout>
  );
}
