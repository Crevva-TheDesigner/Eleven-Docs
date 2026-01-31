'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useUser } from '@/firebase/auth/use-user';
import { useUserProfile } from '@/firebase/firestore/use-user-profile';
import { Loader2, Download, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { firestore } from '@/firebase/client';
import { doc, getDoc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

type DownloadState = 'loading' | 'checking' | 'ready' | 'not_found' | 'error';

export default function DownloadPdfPage() {
    const params = useParams();
    const router = useRouter();
    const { user, loading: authLoading } = useUser();
    const { userProfile, loading: profileLoading } = useUserProfile(user);
    
    const [content, setContent] = useState<string | null>(null);
    const [title, setTitle] = useState<string>('AI-Generated Document');
    const [downloadState, setDownloadState] = useState<DownloadState>('loading');
    
    const id = Array.isArray(params.id) ? params.id[0] : params.id;

    useEffect(() => {
        if (authLoading || profileLoading) return;

        if (!user) {
            router.push(`/login?redirect=/download-pdf/${id}`);
            return;
        }

        // Check if user has purchased the item
        const isPurchased = userProfile?.purchaseHistory?.includes(id);
        if (!isPurchased) {
            console.warn('Access denied: Product not purchased.');
            setDownloadState('error');
            return;
        }

        setDownloadState('checking');

        const fetchContent = async (): Promise<boolean> => {
            // 1. Check localStorage first
            const storedData = localStorage.getItem(id);
            if (storedData) {
                try {
                    const pdfData = JSON.parse(storedData);
                    setContent(pdfData.content);
                    setTitle(pdfData.title || 'AI-Generated Document');
                    return true;
                } catch (e) {
                    setContent(storedData); // Fallback for old string format
                    setTitle('AI-Generated Document');
                    return true;
                }
            }

            // 2. If not in localStorage, check Firestore
            if (firestore) {
                const contentRef = doc(firestore, 'generated_content', id);
                try {
                    const contentSnap = await getDoc(contentRef);
                    if (contentSnap.exists()) {
                        const firestoreData = contentSnap.data();
                        setContent(firestoreData.content);
                        setTitle(firestoreData.title || 'AI-Generated Document');
                        
                        // Cache in localStorage for future visits
                        localStorage.setItem(id, JSON.stringify({
                            title: firestoreData.title,
                            content: firestoreData.content,
                        }));
                        return true;
                    }
                } catch (e) {
                    const permissionError = new FirestorePermissionError({
                      path: contentRef.path,
                      operation: 'get',
                    });
                    errorEmitter.emit('permission-error', permissionError);
                }
            }
            return false;
        };


        // Poll for a few seconds in case content is being generated/synced
        let attempts = 0;
        const maxAttempts = 15; // Poll for 30 seconds
        const interval = setInterval(async () => {
            attempts++;
            const found = await fetchContent();
            if (found) {
                setDownloadState('ready');
                clearInterval(interval);
            } else if (attempts >= maxAttempts) {
                clearInterval(interval);
                setDownloadState('not_found');
            }
        }, 2000);

        return () => clearInterval(interval);

    }, [id, authLoading, profileLoading, user, userProfile, router]);

    const handlePrint = () => {
        window.print();
    };
    
    if (downloadState === 'loading' || authLoading || profileLoading) {
        return (
            <div className="flex h-screen flex-col items-center justify-center gap-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p>Verifying your purchase...</p>
            </div>
        );
    }

    if (downloadState === 'checking') {
         return (
            <div className="flex h-screen flex-col items-center justify-center gap-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p>Preparing your document. This might take a moment...</p>
            </div>
        );
    }
    
    if (downloadState === 'error') {
        return (
            <div className="flex h-screen flex-col items-center justify-center gap-4 text-center">
                <h1 className="text-2xl font-bold">Access Denied</h1>
                <p className="text-muted-foreground max-w-sm">You have not purchased this product, so you cannot download it.</p>
                <Button onClick={() => router.push('/dashboard')}>Go to Dashboard</Button>
            </div>
        );
    }

    if (downloadState === 'not_found') {
         return (
            <div className="flex h-screen flex-col items-center justify-center gap-4 text-center">
                <h1 className="text-2xl font-bold">Document Failed to Prepare</h1>
                <p className="text-muted-foreground max-w-sm">We were unable to prepare your document at this time. Please try again later or contact support.</p>
                <div className="flex gap-4">
                    <Button onClick={() => window.location.reload()}>
                        <RefreshCw className="mr-2 h-4 w-4"/>
                        Try Again
                    </Button>
                    <Button variant="outline" onClick={() => router.push('/dashboard')}>
                        Go to Dashboard
                    </Button>
                </div>
            </div>
        );
    }
    
    return (
        <div className="relative">
             <Button onClick={handlePrint} variant="secondary" className="non-printable absolute top-4 right-4 z-10">
                <Download className="mr-2 h-4 w-4"/>
                Download PDF
            </Button>
            <div className="printable-area p-8 md:p-12">
                <div className="prose dark:prose-invert max-w-none">
                     <div className="text-center mb-12 not-prose">
                        <h1 className="text-3xl font-bold">{title}</h1>
                        <p className="text-muted-foreground">Created with Eleven Docs</p>
                    </div>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
                </div>
            </div>
        </div>
    );
}
