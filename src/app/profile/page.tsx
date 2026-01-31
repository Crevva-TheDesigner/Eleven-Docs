'use client';

import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase/auth/use-user';
import { useUserProfile } from '@/firebase/firestore/use-user-profile';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User as UserIcon, Sparkles, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { signOutUser } from '@/firebase/auth/auth';
import { auth } from '@/firebase/client';

export default function ProfilePage() {
    const { user, loading: authLoading } = useUser();
    const { userProfile, loading: profileLoading } = useUserProfile(user);
    const router = useRouter();

    useEffect(() => {
        // This effect handles redirects once data is loaded.
        if (authLoading || profileLoading) {
            return; // Wait for data to load
        }

        if (!user) {
            router.push('/login?redirect=/profile');
            return;
        }

        if (user && userProfile && !userProfile.surveyCompleted) {
            router.push('/survey');
            return;
        }
    }, [user, authLoading, userProfile, profileLoading, router]);

    if (authLoading || profileLoading) {
        return (
            <div className="container mx-auto px-4 py-8 md:py-12">
                <div className="flex flex-col items-center gap-4">
                    <Skeleton className="h-32 w-32 rounded-full" />
                    <Skeleton className="h-10 w-64" />
                    <Skeleton className="h-6 w-80" />
                </div>
                <Separator className="my-12" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    <Card><CardHeader><Skeleton className="h-8 w-48" /></CardHeader><CardContent><Skeleton className="h-20 w-full" /></CardContent></Card>
                    <Card><CardHeader><Skeleton className="h-8 w-48" /></CardHeader><CardContent><Skeleton className="h-20 w-full" /></CardContent></Card>
                </div>
            </div>
        );
    }
    
    if (!user) {
        // This is a fallback while the redirect in useEffect is processed.
        return (
            <div className="flex h-[calc(100vh-14rem)] flex-col items-center justify-center gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p>Redirecting to login...</p>
            </div>
        );
    }

    if (user && !userProfile) {
        // This is the error state where the user is logged in but their profile document is missing.
        return (
            <div className="container mx-auto flex min-h-[calc(100vh-14rem)] flex-col items-center justify-center gap-6 text-center">
                <h1 className="text-2xl font-bold">Could Not Load Your Profile</h1>
                <p className="text-muted-foreground max-w-md">There seems to be an issue retrieving your profile data. This can sometimes happen due to a network interruption during sign-up.</p>
                <p className="text-muted-foreground max-w-md">Signing in again will resolve this issue by recreating your profile.</p>
                <Button onClick={async () => {
                    await signOutUser(auth);
                    router.push('/login?redirect=/profile');
                }}>
                    Sign In Again
                </Button>
            </div>
        );
    }
    
    if (userProfile) {
        return (
            <div className="container mx-auto px-4 py-8 md:py-12 min-h-[calc(100vh-14rem)]">
                <div className="flex flex-col items-center gap-4">
                     <Avatar className="h-32 w-32 border-4 border-primary">
                        <AvatarImage src={userProfile.photoURL || user.photoURL || ''} alt={userProfile.displayName} />
                        <AvatarFallback>{(userProfile.displayName || 'U').charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <h1 className="text-4xl font-bold">{userProfile.displayName}</h1>
                    <p className="text-muted-foreground">{userProfile.email}</p>
                </div>

                <Separator className="my-12" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                     <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3">
                                <UserIcon className="h-6 w-6" />
                                Account Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Display Name</span>
                                <span className="font-semibold">{userProfile.displayName}</span>
                            </div>
                             <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Email</span>
                                <span className="font-semibold">{userProfile.email}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Member Since</span>
                                <span className="font-semibold">
                                    {userProfile.createdAt ? format(userProfile.createdAt.toDate(), 'PPP') : 'N/A'}
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3">
                               <Sparkles className="h-6 w-6" />
                               Your Interests
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {userProfile.interests && userProfile.interests.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {userProfile.interests.map(interest => (
                                        <Badge key={interest} variant="secondary">{interest}</Badge>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-muted-foreground">You haven't specified any interests yet.</p>
                            )}
                            <Button asChild variant="outline" className="w-full mt-6">
                                <Link href="/survey">
                                    Update Interests
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    // Default fallback in case of an unexpected state.
    return (
        <div className="flex h-[calc(100vh-14rem)] items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
}
