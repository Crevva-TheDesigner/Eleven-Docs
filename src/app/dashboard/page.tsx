'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useUser } from '@/firebase/auth/use-user';
import { useUserProfile } from '@/firebase/firestore/use-user-profile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Download,
    FileText,
    ShoppingBag,
    MessageSquarePlus,
    Users,
    Mail,
    MessageCircle,
    FileCheck,
    Eye,
    BookText,
    ClipboardCheck,
    Code,
    Library,
    Trophy,
    TrendingUp,
    Calendar,
    Package,
    Notebook,
    BookHeart,
    Sparkles,
    Brain,
    Landmark,
    FilePlus2,
} from 'lucide-react';
import { allProducts } from '@/lib/data';
import { useOrders } from '@/firebase/firestore/orders';
import { firestore } from '@/firebase/client';
import { format } from 'date-fns';
import type { Product, ProductCategory } from '@/lib/types';
import { useCollectionCount } from '@/firebase/firestore/stats';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { doc, getDoc } from 'firebase/firestore';
import { useSearchParams } from 'next/navigation';
import { PaymentSuccessAnimation } from '@/components/PaymentSuccessAnimation';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generateAndCacheProductContent } from '@/lib/ai-content-generator';

function DashboardView() {
    const { user } = useUser();
    const { userProfile, loading: profileLoading } = useUserProfile(user);
    const { orders, loading: ordersLoading } = useOrders(firestore, user?.uid);
    const { count: generatedPdfsCount, loading: pdfsLoading } = useCollectionCount(firestore, 'generated_content');
    const totalStaticProducts = allProducts.filter(p => p.hasStaticContent).length;

    const [allPurchasedItems, setAllPurchasedItems] = useState<(Product | any)[]>([]);

    const categoryIcons: Record<ProductCategory, React.ElementType> = {
        'Academic Notes': BookText,
        'Exam Prep': ClipboardCheck,
        'Coding & Tech': Code,
        'Code Libraries': Library,
        'Skill Development': Trophy,
        'Personal Growth': TrendingUp,
        'Planners & Organizers': Calendar,
        'Bundles': Package,
        'Digital Notebooks': Notebook,
        'Digital Journals': BookHeart,
        'AI Services': Sparkles,
        'Psychology': Brain,
        'Economics': Landmark,
    };

    const searchParams = useSearchParams();
    const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
    const { toast } = useToast();
    const [isGenerating, setIsGenerating] = useState(false);

    const handleManualGenerate = async () => {
        setIsGenerating(true);
        toast({
          title: 'Starting Generation...',
          description: 'Looking for the next product to generate.',
        });
        
        if (!firestore) {
            toast({ variant: 'destructive', title: 'Error', description: 'Database connection is not available.' });
            setIsGenerating(false);
            return;
        }

        let productToGenerate: Product | null = null;
        let generatedIds: string[] = JSON.parse(localStorage.getItem('elevendocs_generated_product_ids') || '[]');

        // Iterate through all products to find one that has not been generated yet.
        // We check Firestore directly to have the most accurate state.
        for (const product of allProducts) {
            if (product.hasStaticContent) {
                const contentRef = doc(firestore, 'generated_content', product.id);
                try {
                    const contentSnap = await getDoc(contentRef);
                    if (!contentSnap.exists()) {
                        // We found a product that does not exist in Firestore. This is our candidate.
                        productToGenerate = product;
                        break; // Exit the loop
                    } else {
                        // This product exists in Firestore. Ensure it's in our local list for future client-side optimizations.
                        if (!generatedIds.includes(product.id)) {
                            generatedIds.push(product.id);
                        }
                    }
                } catch (error) {
                    console.error("Error checking Firestore for product content:", error);
                    toast({
                      variant: 'destructive',
                      title: 'Database Error',
                      description: 'Could not check for existing content. See console for details.',
                    });
                    setIsGenerating(false);
                    return; // Stop the process on DB error
                }
            }
        }
        
        // Sync our updated list of found IDs back to local storage.
        localStorage.setItem('elevendocs_generated_product_ids', JSON.stringify(generatedIds));

        if (productToGenerate) {
          toast({
            title: 'Generating Content',
            description: `Now creating content for: "${productToGenerate.name}"`,
          });
    
          const wasGenerated = await generateAndCacheProductContent(productToGenerate);
    
          if (wasGenerated) {
            // Add the newly generated product to our local list and save it.
            const updatedGeneratedIds = [...generatedIds, productToGenerate.id];
            localStorage.setItem('elevendocs_generated_product_ids', JSON.stringify(updatedGeneratedIds));
            toast({
              title: 'Generation Complete!',
              description: `Successfully generated content for "${productToGenerate.name}".`,
            });
          } else {
            toast({
              variant: 'destructive',
              title: 'Generation Failed',
              description: `Could not generate content for "${productToGenerate.name}". Check console for errors.`,
            });
          }
        } else {
          toast({
            title: 'All Done!',
            description: 'All product content has already been generated.',
          });
        }
    
        setIsGenerating(false);
    };

    useEffect(() => {
        if (searchParams.get('payment') === 'success') {
            setShowSuccessAnimation(true);
            // Optional: remove the query param from URL without reloading
            if (typeof window !== 'undefined') {
                const newUrl = window.location.pathname;
                window.history.replaceState({}, '', newUrl);
            }
        }
    }, [searchParams]);

    useEffect(() => {
        const fetchPurchasedItems = async () => {
            if (!userProfile?.purchaseHistory || typeof window === 'undefined' || !firestore) {
                if (!profileLoading) setAllPurchasedItems([]);
                return;
            }

            const reversedHistory = [...userProfile.purchaseHistory].reverse();
            const aiProductsFromStorage: Product[] = JSON.parse(localStorage.getItem('elevendocs_ai_products') || '[]');

            const itemPromises = reversedHistory.map(async (id): Promise<Product | null> => {
                // Check static products first
                const staticProduct = allProducts.find(p => p.id === id);
                if (staticProduct) return staticProduct;

                // Handle AI-generated products
                if (id.startsWith('ai-pdf-')) {
                    // Helper to create a product object for AI docs
                    const createAiProduct = (title: string): Product => ({
                        id: id,
                        name: title,
                        description: `Generated on ${new Date(parseInt(id.split('-')[2])).toLocaleDateString()}`,
                        category: 'AI Services' as const,
                        price: 49,
                        rating: 5,
                        reviewCount: 0,
                        imageUrl: 'https://images.unsplash.com/photo-1677756119517-756a188d2d94?q=80&w=80&h=80&auto=format&fit=crop',
                        imageHint: 'abstract ai',
                        tags: ['ai', 'pdf', 'generated'],
                        hasStaticContent: true,
                    });

                    // 1. Check full product object from localStorage product list
                    const productFromList = aiProductsFromStorage.find(p => p.id === id);
                    if (productFromList) return productFromList;

                    // 2. Check individual content cache in localStorage
                    const storedData = localStorage.getItem(id);
                    if (storedData) {
                        try {
                            const pdfData = JSON.parse(storedData);
                            if (pdfData.title) return createAiProduct(pdfData.title);
                        } catch (e) { /* ignore parse error for old string format */ }
                    }

                    // 3. Fallback to Firestore to get the title
                    try {
                        const contentRef = doc(firestore, 'generated_content', id);
                        const contentSnap = await getDoc(contentRef);
                        if (contentSnap.exists()) {
                            const firestoreData = contentSnap.data();
                            if (firestoreData.title) {
                                // Cache the content locally for future use
                                localStorage.setItem(id, JSON.stringify({ title: firestoreData.title, content: firestoreData.content }));
                                return createAiProduct(firestoreData.title);
                            }
                        }
                    } catch (error) {
                        console.error(`Error fetching AI doc ${id} from Firestore:`, error);
                    }

                    // 4. If all else fails, use a generic name
                    return createAiProduct(`AI Document #${id.substring(7)}`);
                }

                return null; // Should not happen if purchaseHistory is clean
            });

            const resolvedItems = (await Promise.all(itemPromises)).filter((item): item is Product => !!item);
            setAllPurchasedItems(resolvedItems);
        };

        fetchPurchasedItems();

    }, [userProfile?.purchaseHistory, profileLoading, firestore]);

    if (profileLoading || !userProfile || ordersLoading) {
        return (
            <div className="container mx-auto px-4 py-12">
                <Skeleton className="h-10 w-64 mb-8" />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <Card className="col-span-1 lg:col-span-2">
                        <CardHeader><Skeleton className="h-8 w-48" /></CardHeader>
                        <CardContent><Skeleton className="h-40 w-full" /></CardContent>
                    </Card>
                    <div className="space-y-8">
                        <Card>
                            <CardHeader><Skeleton className="h-8 w-48" /></CardHeader>
                            <CardContent><Skeleton className="h-10 w-full" /></CardContent>
                        </Card>
                         <Card>
                            <CardHeader><Skeleton className="h-8 w-32" /></CardHeader>
                            <CardContent><Skeleton className="h-24 w-full" /></CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        );
    }
    
    const isAdmin = user && user.email === 'the.designer.crevva@gmail.com';


    return (
        <>
            {showSuccessAnimation && <PaymentSuccessAnimation onComplete={() => setShowSuccessAnimation(false)} />}
            <div className="container mx-auto px-4 py-12 min-h-[calc(100vh-14rem)]">
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tighter mb-8">
                    Welcome, {userProfile.displayName}!
                </h1>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <Card className="col-span-1 lg:col-span-2">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3">
                                <ShoppingBag className="h-6 w-6" />
                                My Purchased Products
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {allPurchasedItems.length > 0 ? (
                                <div className="space-y-4">
                                    {allPurchasedItems.map(product => {
                                        const Icon = categoryIcons[product.category as ProductCategory] || Package;
                                        return (
                                        <div key={product.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3 rounded-xl hover:bg-accent transition-colors">
                                            <div className="flex items-center gap-4 w-full">
                                                <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-lg bg-muted shrink-0">
                                                    <Icon className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-lg">{product.name}</p>
                                                    <p className="text-sm text-muted-foreground">{product.category}</p>
                                                </div>
                                            </div>
                                            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                                                <Button asChild variant="outline" className="w-full sm:w-auto justify-center">
                                                    <Link href={`/products/${product.id}/review`}>
                                                        <MessageSquarePlus className="mr-2 h-4 w-4" />
                                                        Write a Review
                                                    </Link>
                                                </Button>
                                                {(product.hasStaticContent || product.id.startsWith('ai-pdf-')) && (
                                                    <Button asChild className="w-full sm:w-auto justify-center">
                                                        <Link href={`/download-pdf/${product.id}`} target="_blank">
                                                            <Download className="mr-2 h-4 w-4" />
                                                            Download
                                                        </Link>
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center text-center py-12">
                                    <ShoppingBag className="h-16 w-16 text-muted-foreground mb-4" />
                                    <p className="text-muted-foreground">You haven't purchased any products yet.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <div className="space-y-8">
                        {isAdmin && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-3">
                                        <Users className="h-6 w-6" />
                                        Admin Panel
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="flex flex-col gap-3">
                                    <Button asChild variant="outline" className="justify-start">
                                        <Link href="/dashboard/users">
                                            <Users className="mr-2 h-4 w-4" />
                                            View All Users
                                        </Link>
                                    </Button>
                                    <Button asChild variant="outline" className="justify-start">
                                        <Link href="/dashboard/buyers">
                                            <ShoppingBag className="mr-2 h-4 w-4" />
                                            View All Buyers
                                        </Link>
                                    </Button>
                                    <Button asChild variant="outline" className="justify-start">
                                        <Link href="/dashboard/subscriptions">
                                            <Mail className="mr-2 h-4 w-4" />
                                            View Subscribers
                                        </Link>
                                    </Button>
                                    <Button asChild variant="outline" className="justify-start">
                                        <Link href="/dashboard/feedbacks">
                                            <MessageCircle className="mr-2 h-4 w-4" />
                                            View Feedbacks
                                        </Link>
                                    </Button>

                                    <Separator className="my-2" />

                                    <div className="p-2">
                                        <Button onClick={handleManualGenerate} disabled={isGenerating} variant="outline" className="justify-start w-full mb-4">
                                            {isGenerating ? (
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            ) : (
                                                <FilePlus2 className="mr-2 h-4 w-4" />
                                            )}
                                            {isGenerating ? 'Generating...' : 'Generate Next PDF Content'}
                                        </Button>
                                        <div className="flex items-center gap-3">
                                            <FileCheck className="h-5 w-5 text-muted-foreground" />
                                            <div className="flex-grow">
                                                <p className="font-semibold text-sm">AI Content Generation</p>
                                                {pdfsLoading ? (
                                                    <Skeleton className="h-4 w-32 mt-1" />
                                                ) : (
                                                    <p className="text-sm text-muted-foreground">
                                                        {generatedPdfsCount} of {totalStaticProducts} documents generated.
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        {!pdfsLoading && totalStaticProducts > 0 && (
                                            <Progress value={(generatedPdfsCount / totalStaticProducts) * 100} className="mt-2 h-2" />
                                        )}
                                        <Button asChild variant="outline" className="justify-start w-full mt-4">
                                            <Link href="/dashboard/generated-pdfs">
                                                <Eye className="mr-2 h-4 w-4" />
                                                View Generated Documents
                                            </Link>
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-3">
                                    <FileText className="h-6 w-6" />
                                    Invoices
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                            {orders.length > 0 ? (
                                    <div className="space-y-2">
                                        {orders.map(order => (
                                            <div key={order.id} className="flex justify-between items-center p-2 rounded-lg hover:bg-accent">
                                                <div>
                                                    <p className="font-medium">Order #{order.id.substring(0, 6)}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {order.createdAt ? format(order.createdAt.toDate(), 'PPP') : 'Date unavailable'}
                                                    </p>
                                                </div>
                                                <Button asChild variant="outline" size="sm">
                                                    <Link href={`/invoice/${order.id}`}>
                                                        <Download className="mr-2 h-4 w-4" />
                                                        Invoice
                                                    </Link>
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-muted-foreground">You have no invoices.</p>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </>
    );
}

export default function DashboardPage() {
    return (
        <Suspense fallback={
            <div className="flex h-[calc(100vh-14rem)] items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        }>
            <DashboardView />
        </Suspense>
    )
}
