
'use client';

import { useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function AuthSetupPage() {
  const { loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      router.replace('/');
    }
  }, [loading, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <div className="text-center">
            <h1 className="text-xl font-semibold">Setting up your account...</h1>
            <p className="text-muted-foreground">Please wait a moment.</p>
        </div>
    </div>
  );
}

    