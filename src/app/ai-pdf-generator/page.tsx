'use client';

import { useState } from 'react';
import { useUser } from '@/firebase/auth/use-user';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, FileText, ShoppingCart } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { generatePdfContent } from '@/ai/flows/generate-pdf-content-flow';
import type { GeneratePdfContentOutput } from '@/ai/flows/generate-pdf-content-flow';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useCart } from '@/hooks/use-cart';
import type { Product } from '@/lib/types';
import { firestore } from '@/firebase/client';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

type PageState = 'idle' | 'loading' | 'contentReady';

export default function AiPdfGeneratorPage() {
  const { user, loading: authLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const { addToCart } = useCart();

  const [prompt, setPrompt] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [generatedTitle, setGeneratedTitle] = useState('');
  const [pageState, setPageState] = useState<PageState>('idle');
  const [isAddedToCart, setIsAddedToCart] = useState(false);
  const [generatedProduct, setGeneratedProduct] = useState<Product | null>(null);
  const pdfCost = 29;

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        variant: 'destructive',
        title: 'Prompt is empty',
        description: 'Please describe the PDF you want to create.',
      });
      return;
    }

    setPageState('loading');
    setIsAddedToCart(false);
    setGeneratedProduct(null);

    try {
      const result: GeneratePdfContentOutput = await generatePdfContent({ prompt });

      if (result.error) {
        toast({
          variant: 'destructive',
          title: 'Generation Failed',
          description: result.error,
        });
        setPageState('idle');
        return;
      }

      if (result.content && result.title) {
        setGeneratedContent(result.content);
        setGeneratedTitle(result.title);

        const uniqueId = `ai-pdf-${Date.now()}`;
        const newProduct: Product = {
          id: uniqueId,
          name: result.title,
          description: `AI-generated document based on your prompt: "${prompt.substring(0, 50)}..."`,
          price: pdfCost,
          category: 'AI Services',
          rating: 5,
          reviewCount: 0,
          imageUrl: `https://images.unsplash.com/photo-1677756119517-756a188d2d94?q=80&w=600&h=400&auto=format&fit=crop`,
          imageHint: 'abstract ai',
          tags: ['ai', 'pdf', 'generated'],
        };

        const pdfData = { title: result.title, content: result.content };
        localStorage.setItem(uniqueId, JSON.stringify(pdfData));

        if (firestore) {
            try {
                const contentRef = doc(firestore, 'generated_content', uniqueId);
                const firestorePdfData = {
                    title: result.title,
                    content: result.content,
                    createdAt: serverTimestamp()
                };
                await setDoc(contentRef, firestorePdfData).catch((serverError) => {
                    const permissionError = new FirestorePermissionError({
                      path: contentRef.path,
                      operation: 'create',
                      requestResourceData: firestorePdfData,
                    });
                    errorEmitter.emit('permission-error', permissionError);
                    console.error("Firestore permission error on saving generated content", serverError);
                });
            } catch (e) {
                console.error("Error saving generated content to Firestore", e);
            }
        }

        const existingAiProducts = JSON.parse(localStorage.getItem('elevendocs_ai_products') || '[]');
        localStorage.setItem('elevendocs_ai_products', JSON.stringify([...existingAiProducts, newProduct]));

        setGeneratedProduct(newProduct);

        toast({
          title: 'Content Generated & Added!',
          description: `"${result.title}" has been added to the products library.`,
        });

        setPageState('contentReady');
      } else {
        toast({
            variant: 'destructive',
            title: 'Generation Failed',
            description: 'The AI model did not return any content. Please try again.',
        });
        setPageState('idle');
      }
    } catch (error: any) {
      console.error('Unexpected error generating PDF content:', error);
      toast({
        variant: 'destructive',
        title: 'An Unexpected Error Occurred',
        description: 'Something went wrong while creating your content. Please check the server logs and try again.',
      });
      setPageState('idle');
    }
  };
  
  const handleAddToCart = () => {
    if (!generatedProduct) return;

    addToCart(generatedProduct);
    toast({
      title: 'Added to Cart!',
      description: `The AI Generated PDF has been added to your cart.`,
    });
    setIsAddedToCart(true);
  };

  if (authLoading) {
    return <div className="flex h-[calc(100vh-14rem)] items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="container mx-auto flex min-h-[calc(100vh-14rem)] items-center justify-center px-4 py-8 md:py-12">
        <Alert variant="destructive" className="max-w-md w-full">
            <AlertTitle>Login Required</AlertTitle>
            <AlertDescription className="flex flex-col gap-4">
                <p>You need to be logged in to use the AI PDF Creator.</p>
                <Button asChild>
                    <Link href="/login?redirect=/ai-pdf-generator">Login or Create Account</Link>
                </Button>
            </AlertDescription>
          </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 page-transition">
        <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tighter mb-4 bg-gradient-to-r from-slate-200 via-slate-400 to-slate-500 bg-clip-text text-transparent">
              AI-Powered PDF Creator
            </h1>
            <p className="mt-4 text-lg md:text-xl text-muted-foreground">
              Describe the document you want to create, and our AI will generate a professional-quality PDF for you in seconds.
            </p>
        </div>

        <Card className="max-w-4xl mx-auto mt-12">
            <CardHeader>
                <CardTitle>Create Your PDF</CardTitle>
                <CardDescription>Enter a detailed prompt below. Be as specific as possible for the best results.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {pageState === 'idle' && (
                    <div className="space-y-4">
                        <Textarea
                            placeholder="e.g., 'Create a 5-page report on the future of renewable energy, with an introduction, sections on solar, wind, and hydro power, and a conclusion.' or 'Generate a weekly meal planner with columns for breakfast, lunch, dinner, and snacks for each day of the week.'"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            rows={6}
                        />
                        <Button size="lg" className="w-full" onClick={handleGenerate} disabled={pageState === 'loading'}>
                            <FileText className="mr-2 h-5 w-5"/>
                            Generate Content (Cost: ₹{pdfCost})
                        </Button>
                    </div>
                )}

                {pageState === 'loading' && (
                    <div className="flex flex-col items-center justify-center gap-4 h-48">
                        <Loader2 className="h-12 w-12 animate-spin text-primary" />
                        <p className="text-muted-foreground">AI is crafting your document... Please wait.</p>
                    </div>
                )}
                
                {pageState === 'contentReady' && (
                    <div>
                        <h3 className="text-xl font-bold mb-4">Generated Content Preview:</h3>
                        <div id="pdf-content" className={cn(
                            "prose prose-invert max-w-none p-6 border rounded-3xl bg-muted/20 min-h-[200px] printable-area preview-blur"
                        )}>
                           <ReactMarkdown remarkPlugins={[remarkGfm]}>{generatedContent}</ReactMarkdown>
                        </div>
                    </div>
                )}

                {pageState === 'contentReady' && (
                    <div className='text-center space-y-4'>
                         <p className="text-sm text-muted-foreground">Your content is ready. Add to cart to proceed with checkout and download.</p>
                        <Button size="lg" className="w-full" onClick={handleAddToCart} disabled={isAddedToCart}>
                           <ShoppingCart className="mr-2 h-5 w-5"/>
                           {isAddedToCart ? 'Added to Cart' : `Add to Cart (₹${pdfCost})`}
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    </div>
  );
}
