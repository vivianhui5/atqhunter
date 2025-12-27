import { requireAuth } from '@/lib/auth';
import ManagePostsClient from '@/components/admin/ManagePostsClient';
import { Suspense } from 'react';

function ManagePostsClientWrapper() {
  return <ManagePostsClient />;
}

export default async function AdminPage() {
  await requireAuth();

  return (
    <Suspense fallback={
      <div className="admin-loading-container">
        <p>Loading...</p>
      </div>
    }>
      <ManagePostsClientWrapper />
    </Suspense>
  );
}

