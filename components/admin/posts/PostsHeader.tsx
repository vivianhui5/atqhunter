'use client';

import { Plus, FolderPlus } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface PostsHeaderProps {
  onCreateGallery?: () => void;
}

export default function PostsHeader({ onCreateGallery }: PostsHeaderProps) {
  const router = useRouter();

  return (
    <div className="admin-page-header">
      <div>
        <h1 className="admin-page-title">Home</h1>
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
          onClick={() => router.push('/admin/posts/new')}
          className="admin-primary-button"
        >
          <Plus size={18} />
          <span>Upload Post</span>
        </button>
      </div>
    </div>
  );
}

