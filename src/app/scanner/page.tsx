
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// This page is now the root page. This route is kept for backward compatibility or direct navigation,
// but it will just redirect to the main dashboard.
export default function OldScannerPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard');
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <p>Redirecting...</p>
    </div>
  );
}
