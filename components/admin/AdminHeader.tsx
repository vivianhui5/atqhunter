'use client';

import { signOut } from 'next-auth/react';
import { LogOut, Eye } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AdminHeader() {
  const pathname = usePathname();

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-8 h-20 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
          <nav className="flex gap-4">
            <Link
              href="/admin/posts"
              className={`px-6 py-3 font-semibold rounded-xl border-2 transition ${
                pathname.startsWith('/admin/posts')
                  ? 'bg-white text-slate-900 border-blue-600 hover:bg-blue-50'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              Manage Posts
            </Link>
            <Link
              href="/admin/galleries"
              className={`px-6 py-3 font-semibold rounded-xl border-2 transition ${
                pathname.startsWith('/admin/galleries')
                  ? 'bg-white text-slate-900 border-blue-600 hover:bg-blue-50'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              Manage Galleries
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-6">
          <a
            href="/"
            target="_blank"
            className="text-sm text-slate-600 hover:text-slate-900 flex items-center gap-2 font-medium transition"
          >
            <Eye size={18} /> View Site
          </a>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="text-sm text-red-600 hover:text-red-700 flex items-center gap-2 font-medium transition"
          >
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </div>
    </header>
  );
}

