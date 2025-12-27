'use client';

import { signOut } from 'next-auth/react';
import { Eye, LogOut } from 'lucide-react';

export default function AdminNavbar() {
  return (
    <nav className="admin-navbar">
      <div className="admin-navbar-content">
        {/* Brand */}
        <div className="admin-brand">
          <span className="admin-brand-text">ATQ</span>
          <span className="admin-brand-label">Admin</span>
        </div>

        {/* Navigation Links */}
        <div className="admin-nav-links">
        </div>

        {/* Actions */}
        <div className="admin-actions">
          <a
            href="/?public=true"
            target="_blank"
            rel="noopener noreferrer"
            className="admin-action-link"
          >
            <Eye size={18} />
            <span>Public View</span>
          </a>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="admin-sign-out"
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </nav>
  );
}

