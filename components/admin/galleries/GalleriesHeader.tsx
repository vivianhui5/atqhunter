'use client';

import { Plus } from 'lucide-react';

interface GalleriesHeaderProps {
  onCreateClick: () => void;
}

export default function GalleriesHeader({ onCreateClick }: GalleriesHeaderProps) {
  return (
    <div className="admin-page-header">
      <div>
        <h1 className="admin-page-title">Manage Galleries</h1>
        <p className="admin-page-subtitle">Organize and manage your galleries</p>
      </div>
      <button onClick={onCreateClick} className="admin-primary-button">
        <Plus size={20} />
        <span>New Gallery</span>
      </button>
    </div>
  );
}

