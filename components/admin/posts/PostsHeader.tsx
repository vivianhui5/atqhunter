'use client';

import { Plus, FolderPlus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import SearchBar from '@/components/SearchBar';

interface PostsHeaderProps {
  onCreateGallery?: () => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
}

export default function PostsHeader({ onCreateGallery, searchQuery, onSearchChange }: PostsHeaderProps) {
  const router = useRouter();

  return (
    <div className="admin-page-header">
      <div className="admin-header-search">
        <SearchBar
          value={searchQuery}
          onChange={onSearchChange}
          placeholder="Search by name or ID..."
          className="admin-search"
        />
      </div>
      <div className="admin-header-actions">
        {onCreateGallery && (
          <button
            onClick={onCreateGallery}
            className="admin-secondary-button"
          >
            <FolderPlus size={18} />
            <span>New Gallery</span>
          </button>
        )}
        <button
          onClick={() => router.push('/admin/new')}
          className="admin-primary-button"
        >
          <Plus size={18} />
          <span>New Post</span>
        </button>
      </div>
    </div>
  );
}

