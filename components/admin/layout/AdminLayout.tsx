'use client';

import { ReactNode, useState } from 'react';
import AdminNavbar from './AdminNavbar';
import Toast from './Toast';

interface ToastItem {
  id: number;
  message: string;
  type: 'success' | 'error';
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  return (
    <div className="admin-layout">
      <AdminNavbar />
      
      <main className="admin-content">
        {children}
      </main>

      {/* Toasts */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <Toast key={toast.id} message={toast.message} type={toast.type} />
        ))}
      </div>
    </div>
  );
}

