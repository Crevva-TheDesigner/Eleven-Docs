'use client';

import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { firestore } from '@/firebase/client';
import { doc, getDoc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import type { Product } from '@/lib/types';
import { cn } from '@/lib/utils';
import { generateAndCacheProductContent } from '@/lib/ai-content-generator';

type LoadingState = 'loading' | 'checking' | 'ready' | 'error';

interface ProductContentPreviewProps {
  product: Product;
}

export function ProductContentPreview({ product }: ProductContentPreviewProps) {
  const [content, setContent] = useState<string | null>(null);
  const [loadingState, setLoadingState] = useState<LoadingState>('loading');

  useEffect(() => {
    if (!product.hasStaticContent && !product.id.startsWith('ai-pdf-')) {
      setLoadingState('ready'); // Set to ready to prevent loader for non-previewable products
      return;
    }
    
    // Kick off generation if needed, but don't wait for it here.
    if (product.hasStaticContent) {
        generateAndCacheProductContent(product);
    }

    setLoadingState('checking');

    const fetchContent = async (): Promise<boolean> => {
      const storedData = localStorage.getItem(product.id);
      if (storedData) {
        try {
          const pdfData = JSON.parse(storedData);
          setContent(pdfData.content);
          return true;
        } catch (e) {
          setContent(storedData);
          return true;
        }
      }

      if (firestore) {
        const contentRef = doc(firestore, 'generated_content', product.id);
        try {
          const contentSnap = await getDoc(contentRef);
          if (contentSnap.exists()) {
            const firestoreData = contentSnap.data();
            setContent(firestoreData.content);
            localStorage.setItem(product.id, JSON.stringify({
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

    let attempts = 0;
    const maxAttempts = 30; // Poll for 1 minute
    const interval = setInterval(async () => {
      attempts++;
      const found = await fetchContent();
      if (found) {
        setLoadingState('ready');
        clearInterval(interval);
      } else if (attempts >= maxAttempts) {
        clearInterval(interval);
        setLoadingState('error');
      }
    }, 2000);

    return () => clearInterval(interval);

  }, [product]);

  // If the product type doesn't support a preview, render nothing.
  if (!product.hasStaticContent && !product.id.startsWith('ai-pdf-')) {
      return null;
  }

  // If content is ready, show it.
  if (loadingState === 'ready' && content) {
    return (
        <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4">Content Preview</h2>
            <Card>
                <CardContent className="p-0">
                    <ScrollArea className="h-[17rem] rounded-xl">
                        <div className={cn(
                            "prose prose-invert max-w-none p-6 preview-blur",
                            "prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground",
                            "prose-li:text-muted-foreground"
                        )}>
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>
            <p className="text-xs text-muted-foreground mt-2 text-center">Purchase to unlock and download the full document.</p>
        </div>
    );
  }

  // Otherwise, show the loading state.
  return (
        <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4">Content Preview</h2>
            <div className="flex flex-col items-center justify-center gap-4 h-40 border rounded-xl bg-muted/30">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground text-center px-4">
                    {loadingState === 'error' 
                        ? "There was an issue generating the preview. Please try refreshing."
                        : "We are preparing your document preview. This can take up to a minute..."
                    }
                </p>
            </div>
        </div>
  );
}
