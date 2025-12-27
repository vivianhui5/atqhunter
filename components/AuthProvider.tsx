'use client';

import { SessionProvider } from 'next-auth/react';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider
      refetchInterval={0} // Don't refetch session automatically
      refetchOnWindowFocus={false} // Don't refetch when window regains focus
    >
      {children}
    </SessionProvider>
  );
}

