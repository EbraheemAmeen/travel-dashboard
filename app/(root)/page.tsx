'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    // In future, check for token or auth state here
    router.push('/login');
  }, []);

  return null; // Optionally add a loading spinner
}
