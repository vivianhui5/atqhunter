'use client';

import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function PostsHeader() {
  const router = useRouter();

  return (
    <div className="admin-page-header">
      <div>
        <h1 className="admin-page-title">Manage Posts</h1>
        <p className="admin-page-subtitle">View and manage all antique postings</p>
      </div>
      <button
        onClick={() => router.push('/admin/posts/new')}
        className="admin-primary-button"
      >
        <Plus size={20} />
        <span>Upload</span>
      </button>
    </div>
  );
}

