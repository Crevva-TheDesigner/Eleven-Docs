'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

// This page is a redirector to the new unified download page.
export default function DownloadStaticProductPage() {
    const params = useParams();
    const router = useRouter();
    const id = Array.isArray(params.id) ? params.id[0] : params.id;

    useEffect(() => {
        if (id) {
            router.replace(`/download-pdf/${id}`);
        } else {
            router.replace('/dashboard');
        }
    }, [id, router]);

    return (
        <div className="flex h-screen flex-col items-center justify-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p>Redirecting to your download...</p>
        </div>
    );
}
