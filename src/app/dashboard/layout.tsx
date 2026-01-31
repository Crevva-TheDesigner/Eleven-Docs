'use client';

import { useUser } from '@/firebase/auth/use-user';
import { useUserProfile } from '@/firebase/firestore/use-user-profile';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading: authLoading } = useUser();
  const { userProfile, loading: profileLoading } = useUserProfile(user);
  const router = useRouter();

  useEffect(() => {
    const loading = authLoading || (user && profileLoading);

    if (!loading && !user) {
      router.push('/login?redirect=/dashboard');
      return;
    }

    if (!loading && user && userProfile && !userProfile.surveyCompleted) {
      router.push('/survey');
      return;
    }
  }, [user, userProfile, authLoading, profileLoading, router]);

  const loading = authLoading || (user && profileLoading);

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-14rem)] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
        <div className="flex h-[calc(100vh-14rem)] items-center justify-center">
            <p>Redirecting to login...</p>
        </div>
    );
  }

  return <>{children}</>;
}
