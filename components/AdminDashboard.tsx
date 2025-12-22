'use client';

import { useState, useEffect, useRef } from 'react';
import { signOut } from 'next-auth/react';
import { 
  Upload, FolderPlus, LogOut, X, Pin, PinOff, Trash2, Eye, 
  Plus, Check, AlertCircle, Image as ImageIcon, Loader2, ArrowLeft
} from 'lucide-react';
import RichTextEditor from './RichTextEditor';
import Image from 'next/image';
import { Gallery, ArtworkPost } from '@/types/database';

interface ImageFile {
  file: File;
  preview: string;
  isConverting?: boolean;
}

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}

export default function AdminDashboard() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [selectedGallery, setSelectedGallery] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [artworks, setArtworks] = useState<ArtworkPost[]>([]);
  const [imageFiles, setImageFiles] = useState<ImageFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [showNewGallery, setShowNewGallery] = useState(false);
  const [newGalleryName, setNewGalleryName] = useState('');
  const [currentView, setCurrentView] = useState<'manage' | 'upload' | 'galleries'>('manage');
  const [creatingGallery, setCreatingGallery] = useState(false);
  const [editingArtworkId, setEditingArtworkId] = useState<string | null>(null);
  const [selectedGalleryView, setSelectedGalleryView] = useState<string | null>(null);
  const [selectedArtworks, setSelectedArtworks] = useState<Set<string>>(new Set());
  const [moveToGallery, setMoveToGallery] = useState('');
  const [editingGalleryId, setEditingGalleryId] = useState<string | null>(null);
  const [editingGalleryName, setEditingGalleryName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper function to strip HTML tags from description
  const stripHtml = (html: string) => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  useEffect(() => {
    fetchGalleries();
    fetchArtworks();
  }, []);

  useEffect(() => {
    return () => {
      imageFiles.forEach(img => URL.revokeObjectURL(img.preview));
    };
  }, [imageFiles]);

  const fetchGalleries = async () => {
    try {
      const res = await fetch('/api/galleries');
      const data = await res.json();
      setGalleries(data.galleries || []);
    } catch {
      console.error('Error fetching galleries');
    }
  };

  const fetchArtworks = async () => {
    try {
      const res = await fetch('/api/artwork');
      const data = await res.json();
      setArtworks(data.artworks || []);
    } catch {
      console.error('Error fetching artworks');
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  };

  const handleCreateGallery = async () => {
    const trimmedName = newGalleryName.trim();
    if (!trimmedName) return;
    
    const duplicate = galleries.find(g => g.name.toLowerCase() === trimmedName.toLowerCase());
    if (duplicate) {
      showToast('A gallery with this name already exists', 'error');
      return;
    }
    
    setCreatingGallery(true);
    try {
      const res = await fetch('/api/galleries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmedName }),
      });
      if (res.ok) {
        const data = await res.json();
        setGalleries([data.gallery, ...galleries]);
        setSelectedGallery(data.gallery.id);
        setNewGalleryName('');
        setShowNewGallery(false);
        showToast('Gallery created', 'success');
      } else {
        showToast('Failed to create gallery', 'error');
      }
    } catch {
      showToast('Failed to create gallery', 'error');
    } finally {
      setCreatingGallery(false);
    }
  };

  const convertHeicToJpeg = async (file: File): Promise<{ blob: Blob; preview: string }> => {
    try {
      const heic2any = (await import('heic2any')).default;
      const result = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.9 });
      const blob = Array.isArray(result) ? result[0] : result;
      return { blob, preview: URL.createObjectURL(blob) };
    } catch {
      return { blob: file, preview: URL.createObjectURL(file) };
    }
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const newFiles = Array.from(e.target.files);
    const remainingSlots = 10 - imageFiles.length;
    const filesToProcess = newFiles.slice(0, remainingSlots);

    for (const file of filesToProcess) {
      const isHeic = file.type === 'image/heic' || file.name.toLowerCase().endsWith('.heic');
      
      if (isHeic) {
        const tempId = URL.createObjectURL(file);
        setImageFiles(prev => [...prev, { file, preview: tempId, isConverting: true }]);
        
        const { blob, preview } = await convertHeicToJpeg(file);
        const convertedFile = new File([blob], file.name.replace(/\.heic$/i, '.jpg'), { type: 'image/jpeg' });
        
        setImageFiles(prev => prev.map(img => 
          img.preview === tempId ? { file: convertedFile, preview, isConverting: false } : img
        ));
      } else {
        const preview = URL.createObjectURL(file);
        setImageFiles(prev => [...prev, { file, preview }]);
      }
    }

    e.target.value = '';
  };

  const removeImage = (index: number) => {
    URL.revokeObjectURL(imageFiles[index].preview);
    setImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  const clearAllImages = () => {
    imageFiles.forEach(img => URL.revokeObjectURL(img.preview));
    setImageFiles([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (imageFiles.length === 0 || !title.trim()) return;
    
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      if (price) formData.append('price', price);
      if (selectedGallery) formData.append('gallery_id', selectedGallery);
      formData.append('is_pinned', isPinned.toString());
      
      imageFiles.forEach((img) => formData.append('images', img.file));

      const res = await fetch('/api/artwork/upload', { method: 'POST', body: formData });

      if (res.ok) {
        showToast(editingArtworkId ? 'Artwork updated successfully!' : 'Artwork uploaded successfully!', 'success');
        // Clear form
        setTitle('');
        setDescription('');
        setPrice('');
        setSelectedGallery('');
        setIsPinned(false);
        clearAllImages();
        setEditingArtworkId(null);
        fetchArtworks();
      } else {
        const data = await res.json();
        showToast(data.error || 'Upload failed', 'error');
      }
    } catch {
      showToast('Failed to upload artwork', 'error');
    } finally {
      setLoading(false);
    }
  };

  const togglePin = async (id: string, currentPinned: boolean) => {
    try {
      const res = await fetch(`/api/artwork/${id}/pin`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_pinned: !currentPinned }),
      });
      if (res.ok) {
        setArtworks(artworks.map(a => a.id === id ? { ...a, is_pinned: !currentPinned } : a));
        showToast(currentPinned ? 'Removed from featured' : 'Added to featured', 'success');
      }
    } catch {
      showToast('Failed to update', 'error');
    }
  };

  const deleteArtwork = async (id: string) => {
    if (!confirm('Delete this artwork? This cannot be undone.')) return;
    try {
      const res = await fetch(`/api/artwork/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setArtworks(artworks.filter(a => a.id !== id));
        showToast('Artwork deleted', 'success');
      }
    } catch {
      showToast('Failed to delete', 'error');
    }
  };

  const openEditForm = (artwork: ArtworkPost) => {
    setEditingArtworkId(artwork.id);
    setTitle(artwork.title);
    setDescription(artwork.description || '');
    setPrice(artwork.price !== null ? artwork.price.toString() : '');
    setSelectedGallery(''); // Will need to map gallery name to ID if editing
    setIsPinned(artwork.is_pinned);
    setImageFiles([]);
    setCurrentView('upload');
  };

  const clearForm = () => {
    setEditingArtworkId(null);
    setTitle('');
    setDescription('');
    setPrice('');
    setSelectedGallery('');
    setIsPinned(false);
    clearAllImages();
  };

  const deleteGallery = async (id: string, name: string) => {
    if (!confirm(`Delete gallery "${name}"? All artworks in this gallery will have their gallery removed.`)) return;
    try {
      const res = await fetch(`/api/galleries/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setGalleries(galleries.filter(g => g.id !== id));
        fetchArtworks(); // Refresh artworks to reflect gallery changes
        showToast('Gallery deleted', 'success');
        if (selectedGalleryView === id) {
          setSelectedGalleryView(null);
        }
      } else {
        showToast('Failed to delete gallery', 'error');
      }
    } catch {
      showToast('Failed to delete gallery', 'error');
    }
  };

  const toggleArtworkSelection = (id: string) => {
    const newSelection = new Set(selectedArtworks);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedArtworks(newSelection);
  };

  const moveSelectedArtworks = async () => {
    if (selectedArtworks.size === 0 || !moveToGallery) {
      showToast('Please select artworks and a destination gallery', 'error');
      return;
    }

    try {
      const promises = Array.from(selectedArtworks).map(artworkId =>
        fetch(`/api/artwork/${artworkId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ gallery_id: moveToGallery === 'none' ? null : moveToGallery }),
        })
      );

      await Promise.all(promises);
      
      showToast(`Moved ${selectedArtworks.size} artwork(s)`, 'success');
      setSelectedArtworks(new Set());
      setMoveToGallery('');
      fetchArtworks();
    } catch {
      showToast('Failed to move artworks', 'error');
    }
  };

  const getGalleryArtworks = (galleryId: string) => {
    return artworks.filter(a => a.gallery?.id === galleryId);
  };

  const renameGallery = async (id: string) => {
    const trimmedName = editingGalleryName.trim();
    if (!trimmedName) return;
    
    const duplicate = galleries.find(g => g.name.toLowerCase() === trimmedName.toLowerCase() && g.id !== id);
    if (duplicate) {
      showToast('A gallery with this name already exists', 'error');
      return;
    }
    
    try {
      const res = await fetch(`/api/galleries/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmedName }),
      });

      if (res.ok) {
        setGalleries(galleries.map(g => g.id === id ? { ...g, name: trimmedName } : g));
        fetchArtworks(); // Refresh to show updated gallery names
        showToast('Gallery renamed', 'success');
        setEditingGalleryId(null);
        setEditingGalleryName('');
      } else {
        showToast('Failed to rename gallery', 'error');
      }
    } catch {
      showToast('Failed to rename gallery', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Toast */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-3">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-center gap-3 px-6 py-4 rounded-xl shadow-lg backdrop-blur-sm ${
              toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
            }`}
          >
            {toast.type === 'success' ? <Check size={20} /> : <AlertCircle size={20} />}
            <span className="font-medium">{toast.message}</span>
          </div>
        ))}
      </div>

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-8 h-20 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
          <div className="flex items-center gap-6">
            <a href="/" target="_blank" className="text-sm text-slate-600 hover:text-slate-900 flex items-center gap-2 font-medium transition">
              <Eye size={18} /> View Site
            </a>
            <button onClick={() => signOut({ callbackUrl: '/' })} className="text-sm text-red-600 hover:text-red-700 flex items-center gap-2 font-medium transition">
              <LogOut size={18} /> Sign Out
            </button>
          </div>
        </div>
      </header>

      {currentView === 'upload' ? (
        // Upload Page
        <main className="max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-16">
          <div className="mb-8">
            <button
              onClick={() => { setCurrentView('manage'); clearForm(); }}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium transition mb-4"
            >
              <ArrowLeft size={20} />
              Back 
            </button>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900">
              {editingArtworkId ? 'Edit Artwork' : 'Upload New Artwork'}
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8 md:space-y-10 lg:space-y-14">
            
            {/* Title */}
            <div>
              <label className="block text-2xl font-bold text-slate-900 mb-6">
                TITLE *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter artwork title"
                className="w-full px-6 py-6 text-xl bg-slate-50 border-2 border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition"
              />
            </div>

            {/* Gallery & Price */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Gallery - 2/3 width */}
              <div className="md:col-span-2">
                <label className="block text-2xl font-bold text-slate-900 mb-6">
                  GALLERY
                </label>
            {showNewGallery ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={newGalleryName}
                  onChange={(e) => setNewGalleryName(e.target.value)}
                  placeholder="Gallery name"
                  autoFocus
                  className="w-full px-6 py-6 text-xl bg-slate-50 border-2 border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition"
                />
                <div className="flex gap-2">
                  <button 
                    type="button" 
                    onClick={handleCreateGallery} 
                    disabled={creatingGallery}
                    className="px-6 py-3 bg-blue-600 text-white text-base font-medium rounded-lg hover:bg-blue-700 transition disabled:bg-slate-400"
                  >
                    {creatingGallery ? 'Creating...' : 'Create'}
                  </button>
                  <button type="button" onClick={() => { setShowNewGallery(false); setNewGalleryName(''); }} className="px-6 py-3 text-slate-600 text-base font-medium hover:bg-slate-100 rounded-lg transition">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <select
                  value={selectedGallery}
                  onChange={(e) => setSelectedGallery(e.target.value)}
                  className="flex-1 px-6 py-6 text-xl bg-slate-50 border-2 border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition"
                  aria-label="Select gallery"
                >
                  <option value="">No gallery</option>
                  {galleries.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
                <button type="button" onClick={() => setShowNewGallery(true)} className="px-6 py-6 text-blue-600 font-medium hover:bg-blue-50 rounded-xl transition flex items-center gap-2" aria-label="Create new gallery">
                  <FolderPlus size={24} />
                </button>
              </div>
            )}
          </div>

              {/* Price - 1/3 width */}
              <div>
                <label className="block text-2xl font-bold text-slate-900 mb-6">
                  PRICE
                </label>
            <div className="relative">
              <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 text-xl font-medium">$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                className="w-full pl-14 pr-6 py-6 text-xl bg-slate-50 border-2 border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition"
              />
            </div>
              </div>
            </div>

                {/* Images */}
                <div>
                  <label className="block text-2xl font-bold text-slate-900 mb-6">
                    IMAGES *
                  </label>
              {imageFiles.length === 0 ? (
                <label className="block border-2 border-dashed border-slate-300 rounded-2xl p-12 md:p-20 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all bg-slate-50">
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Upload size={32} className="text-blue-600 md:w-10 md:h-10" />
                  </div>
                  <p className="text-lg md:text-xl font-semibold text-slate-700 mb-2">Click to upload images</p>
                  <p className="text-base md:text-lg text-slate-500">Up to 10 images • JPG, PNG, HEIC</p>
                  <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageSelect} className="hidden" />
                </label>
              ) : (
                <div className="border-2 border-slate-200 rounded-2xl p-8 bg-slate-50">
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-lg font-semibold text-slate-600">{imageFiles.length} of 10</span>
                    <button type="button" onClick={clearAllImages} className="text-lg text-red-600 hover:text-red-700 font-semibold">
                      Remove all
                    </button>
                  </div>
                  <div className="grid grid-cols-5 gap-4">
                    {imageFiles.map((img, index) => (
                      <div key={index} className="relative aspect-square bg-slate-200 rounded-xl overflow-hidden group">
                        {img.isConverting ? (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Loader2 size={28} className="text-slate-400 animate-spin" />
                          </div>
                        ) : (
                          <Image src={img.preview} alt={`${index + 1}`} fill className="object-cover" />
                        )}
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center shadow-lg transition"
                          aria-label="Remove image"
                        >
                          <X size={18} className="text-white" />
                        </button>
                        <div className="absolute bottom-2 left-2 bg-black/70 text-white text-sm font-bold px-2 py-1 rounded">
                          {index + 1}
                        </div>
                      </div>
                    ))}
                    {imageFiles.length < 10 && (
                      <label className="aspect-square border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center cursor-pointer hover:border-slate-400 hover:bg-white transition">
                        <Plus size={24} className="text-slate-400" />
                        <input type="file" accept="image/*" multiple onChange={handleImageSelect} className="hidden" aria-label="Add more images" />
                      </label>
                    )}
                  </div>
                </div>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-2xl font-bold text-slate-900 mb-6">
                    DESCRIPTION
                  </label>
                  <RichTextEditor content={description} onChange={setDescription} />
                </div>

                {/* Featured */}
                <div>
                  <label className="block text-2xl font-bold text-slate-900 mb-6">
                  Featured Antiques
                  </label>
                  <label className="flex items-center gap-5 cursor-pointer p-6 bg-slate-50 rounded-xl hover:bg-slate-100 transition">
                    <input
                      type="checkbox"
                      checked={isPinned}
                      onChange={(e) => setIsPinned(e.target.checked)}
                      className="w-6 h-6 text-blue-600 border-slate-300 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <div>
                      <p className="text-lg font-medium text-slate-900">Pin to homepage</p>
                      <p className="text-base text-slate-500">Featured items appear first</p>
                    </div>
                  </label>
                </div>

                {/* Submit */}
                <div className="pt-8">
                  <button
                    type="submit"
                    disabled={loading || imageFiles.length === 0 || !title.trim()}
                    className="w-full py-6 bg-blue-600 text-white text-xl font-semibold rounded-xl hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-200 transition-all disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={28} className="animate-spin" />
                        {editingArtworkId ? 'Updating...' : 'Uploading...'}
                      </>
                    ) : (
                      <>
                        {editingArtworkId ? <Check size={28} /> : <Upload size={28} />}
                        {editingArtworkId ? 'Update Artwork' : 'Submit Artwork'}
                      </>
                    )}
                  </button>
                </div>
          </form>
        </main>
      ) : currentView === 'galleries' ? (
        // Manage Galleries Page
        <main className="max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-16">
          {/* Navigation Tabs */}
          <div className="flex gap-4 mb-8">
            <button
              onClick={() => setCurrentView('manage')}
              className="px-6 py-3 bg-white text-slate-600 font-semibold rounded-xl border-2 border-slate-200 hover:bg-slate-50 transition"
            >
              Manage Posts
            </button>
            <button
              onClick={() => setCurrentView('galleries')}
              className="px-6 py-3 bg-white text-slate-900 font-semibold rounded-xl border-2 border-blue-600 hover:bg-blue-50 transition"
            >
              Manage Galleries
            </button>
          </div>

          {/* Header */}
          <div className="flex items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-1 md:mb-2">
                {selectedGalleryView ? galleries.find(g => g.id === selectedGalleryView)?.name : 'Manage Galleries'}
              </h2>
              <p className="text-sm md:text-base text-slate-600">
                {selectedGalleryView ? 'View and move artworks in this gallery' : 'Organize your artwork galleries'}
              </p>
            </div>
            {selectedGalleryView ? (
              <button
                onClick={() => { setSelectedGalleryView(null); setSelectedArtworks(new Set()); }}
                className="px-4 py-2 text-slate-600 hover:text-slate-900 font-medium transition flex items-center gap-2"
              >
                <ArrowLeft size={20} />
                Back to Galleries
              </button>
            ) : (
              <button
                onClick={() => setShowNewGallery(true)}
                className="px-6 py-3 md:px-8 md:py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm md:text-base font-bold rounded-xl hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all flex items-center gap-2 md:gap-3 flex-shrink-0"
              >
                <Plus size={18} className="md:w-5 md:h-5" />
                New Gallery
              </button>
            )}
          </div>

          {!selectedGalleryView ? (
            // Gallery List View - Simple Row List
            <div className="space-y-6">
              {/* New Gallery Form */}
              {showNewGallery && (
                <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-blue-500">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Create New Gallery</h3>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={newGalleryName}
                      onChange={(e) => setNewGalleryName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleCreateGallery();
                        if (e.key === 'Escape') { setShowNewGallery(false); setNewGalleryName(''); }
                      }}
                      placeholder="Enter gallery name"
                      className="flex-1 px-4 py-3 text-base border-2 border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      autoFocus
                    />
                    <button
                      onClick={handleCreateGallery}
                      disabled={creatingGallery || !newGalleryName.trim()}
                      className="px-6 py-3 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition disabled:bg-slate-300"
                    >
                      {creatingGallery ? 'Creating...' : 'Create'}
                    </button>
                    <button
                      onClick={() => { setShowNewGallery(false); setNewGalleryName(''); }}
                      className="px-6 py-3 bg-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-300 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Gallery List */}
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="divide-y divide-slate-200">
                {galleries.map((gallery) => {
                  const galleryArtworks = getGalleryArtworks(gallery.id);
                  const isEditing = editingGalleryId === gallery.id;
                  
                  return (
                    <div key={gallery.id} className="p-6 hover:bg-slate-50 transition">
                      <div className="flex items-center justify-between gap-4">
                        {/* Gallery Name */}
                        <div 
                          onClick={() => !isEditing && setSelectedGalleryView(gallery.id)}
                          className="flex-1 cursor-pointer"
                        >
                          {isEditing ? (
                            <input
                              type="text"
                              value={editingGalleryName}
                              onChange={(e) => setEditingGalleryName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') renameGallery(gallery.id);
                                if (e.key === 'Escape') { setEditingGalleryId(null); setEditingGalleryName(''); }
                              }}
                              className="px-4 py-2 text-lg font-bold border-2 border-blue-500 rounded-lg focus:outline-none w-full max-w-md"
                              placeholder="Gallery name"
                              autoFocus
                              onClick={(e) => e.stopPropagation()}
                              aria-label="Gallery name"
                            />
                          ) : (
                            <>
                              <h3 className="text-xl font-bold text-slate-900 mb-1">{gallery.name}</h3>
                              <p className="text-sm text-slate-500">
                                {galleryArtworks.length} {galleryArtworks.length === 1 ? 'artwork' : 'artworks'}
                              </p>
                            </>
                          )}
                        </div>
                        
                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          {isEditing ? (
                            <>
                              <button
                                onClick={() => renameGallery(gallery.id)}
                                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => { setEditingGalleryId(null); setEditingGalleryName(''); }}
                                className="px-4 py-2 bg-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-300 transition"
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={(e) => { e.stopPropagation(); setSelectedGalleryView(gallery.id); }}
                                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition"
                              >
                                Manage
                              </button>
                              <button
                                onClick={(e) => { 
                                  e.stopPropagation(); 
                                  setEditingGalleryId(gallery.id); 
                                  setEditingGalleryName(gallery.name);
                                }}
                                className="px-4 py-2 bg-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-300 transition"
                              >
                                Rename
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); deleteGallery(gallery.id, gallery.name); }}
                                className="px-4 py-2 bg-red-100 text-red-600 text-sm font-medium rounded-lg hover:bg-red-200 transition"
                              >
                                Delete
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            </div>
          ) : (
            // Gallery Detail View - Artworks in selected gallery
            <div>
              {selectedArtworks.size > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <p className="text-blue-900 font-medium">
                      {selectedArtworks.size} artwork(s) selected
                    </p>
                    <div className="flex items-center gap-3">
                      <select
                        value={moveToGallery}
                        onChange={(e) => setMoveToGallery(e.target.value)}
                        className="px-4 py-2 text-sm border-2 border-blue-300 rounded-lg focus:outline-none focus:border-blue-500"
                        aria-label="Select destination gallery"
                      >
                        <option value="">Move to...</option>
                        <option value="none">No Gallery</option>
                        {galleries.filter(g => g.id !== selectedGalleryView).map((g) => (
                          <option key={g.id} value={g.id}>{g.name}</option>
                        ))}
                      </select>
                      <button
                        onClick={moveSelectedArtworks}
                        disabled={!moveToGallery}
                        className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition disabled:bg-slate-300"
                      >
                        Move
                      </button>
                      <button
                        onClick={() => setSelectedArtworks(new Set())}
                        className="px-4 py-2 text-slate-600 hover:text-slate-900 text-sm font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                {getGalleryArtworks(selectedGalleryView).length === 0 ? (
                  <div className="p-20 text-center">
                    <p className="text-slate-500">No artworks in this gallery</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {getGalleryArtworks(selectedGalleryView).map((artwork) => (
                      <div key={artwork.id} className="p-4 md:p-6 hover:bg-slate-50 transition">
                        <div className="flex flex-wrap items-start gap-3 md:gap-4">
                          {/* Checkbox */}
                          <input
                            type="checkbox"
                            checked={selectedArtworks.has(artwork.id)}
                            onChange={() => toggleArtworkSelection(artwork.id)}
                            className="mt-6 w-5 h-5 text-blue-600 border-slate-300 rounded focus:ring-2 focus:ring-blue-500"
                            aria-label={`Select ${artwork.title}`}
                          />
                          
                          {/* Thumbnail */}
                          <div className="w-16 h-16 md:w-20 md:h-20 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0">
                            {artwork.images?.[0] ? (
                              <Image src={artwork.images[0].image_url} alt={artwork.title} width={80} height={80} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <ImageIcon size={24} className="text-slate-300" />
                              </div>
                            )}
                          </div>
                          
                          {/* Content */}
                          <div className="flex-1 min-w-[200px]">
                            <h3 className="font-semibold text-sm md:text-base text-slate-900 mb-1">{artwork.title}</h3>
                            {artwork.price && (
                              <p className="text-xs md:text-sm text-slate-600">
                                <span className="font-medium">Price:</span> ${artwork.price}
                              </p>
                            )}
                          </div>
                          
                          {/* Edit Button */}
                          <button
                            onClick={() => openEditForm(artwork)}
                            className="px-4 py-2 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition whitespace-nowrap flex-shrink-0"
                          >
                            Edit Post
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      ) : (
        // Manage Posts Page
        <main className="max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-16">
          {/* Tabs */}
          <div className="flex gap-4 mb-8">
            <button
              onClick={() => setCurrentView('manage')}
              className="px-6 py-3 bg-white text-slate-900 font-semibold rounded-xl border-2 border-blue-600 hover:bg-blue-50 transition"
            >
              Manage Posts
            </button>
            <button
              onClick={() => setCurrentView('galleries')}
              className="px-6 py-3 bg-white text-slate-600 font-semibold rounded-xl border-2 border-slate-200 hover:bg-slate-50 transition"
            >
              Manage Galleries
            </button>
          </div>

          {/* Header with Upload Button */}
          <div className="flex items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-1 md:mb-2">Your Artworks</h2>
              <p className="text-sm md:text-base text-slate-600">Manage your collection</p>
            </div>
            <button
              onClick={() => setCurrentView('upload')}
              className="px-6 py-3 md:px-8 md:py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm md:text-base font-bold rounded-xl hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all flex items-center gap-2 md:gap-3 flex-shrink-0"
            >
              <Plus size={18} className="md:w-5 md:h-5" />
              Upload New
            </button>
          </div>

          {/* Manage Posts Section */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {artworks.length === 0 ? (
            <div className="p-20 text-center">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <ImageIcon size={36} className="text-slate-400" />
              </div>
              <p className="text-xl font-semibold text-slate-700 mb-2">No artworks yet</p>
              <p className="text-base text-slate-500 mb-8">Upload your first piece to get started</p>
              <button onClick={() => setCurrentView('upload')} className="px-8 py-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition">
                Upload Artwork
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {artworks.map((artwork) => (
                <div key={artwork.id} className="p-4 md:p-6 hover:bg-slate-50 transition">
                  <div className="flex flex-wrap items-start gap-3 md:gap-4">
                    {/* Thumbnail */}
                    <div 
                      onClick={() => openEditForm(artwork)}
                      className="w-16 h-16 md:w-20 md:h-20 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0 cursor-pointer hover:ring-2 hover:ring-blue-400 transition"
                    >
                      {artwork.images?.[0] ? (
                        <Image src={artwork.images[0].image_url} alt={artwork.title} width={80} height={80} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon size={24} className="text-slate-300" />
                        </div>
                      )}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-[200px]">
                      <h3 className="font-semibold text-sm md:text-base text-slate-900 mb-1">{artwork.title}</h3>
                      <div className="text-xs md:text-sm text-slate-500 space-y-0.5">
                        <p className="truncate">
                          <span className="font-medium text-slate-600">Gallery:</span> {artwork.gallery ? artwork.gallery.name : '--'}
                        </p>
                        {artwork.description && (
                          <p className="line-clamp-1">
                            <span className="font-medium text-slate-600">Description:</span> {stripHtml(artwork.description).substring(0, 100)}{stripHtml(artwork.description).length > 100 ? '...' : ''}
                          </p>
                        )}
                        {artwork.price && (
                          <p>
                            <span className="font-medium text-slate-600">Price:</span> ${artwork.price}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <div className="flex gap-1.5 md:gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); togglePin(artwork.id, artwork.is_pinned); }}
                          className={`p-2 md:p-2.5 rounded-lg transition ${
                            artwork.is_pinned ? 'bg-amber-100 text-amber-600 hover:bg-amber-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                          title={artwork.is_pinned ? 'Unpin' : 'Pin'}
                          aria-label={artwork.is_pinned ? 'Unpin artwork' : 'Pin artwork'}
                        >
                          {artwork.is_pinned ? <PinOff size={16} /> : <Pin size={16} />}
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); window.open(`/artwork/${artwork.id}`, '_blank'); }}
                          className="p-2 md:p-2.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition" 
                          title="View"
                          aria-label="View artwork"
                        >
                          <Eye size={16} />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); deleteArtwork(artwork.id); }} 
                          className="p-2 md:p-2.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-red-100 hover:text-red-600 transition" 
                          title="Delete"
                          aria-label="Delete artwork"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <button
                        onClick={() => openEditForm(artwork)}
                        className="px-4 py-2 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition whitespace-nowrap"
                      >
                        Edit Post
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        </main>
      )}
    </div>
  );
}
