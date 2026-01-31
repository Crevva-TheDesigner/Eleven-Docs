'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useUser } from '@/firebase/auth/use-user';
import { useUserProfile } from '@/firebase/firestore/use-user-profile';
import { firestore } from '@/firebase/client';
import { allProducts } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { submitReview } from '@/firebase/firestore/reviews';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import type { Product } from '@/lib/types';

function StarRatingInput({ rating, setRating }: { rating: number; setRating: (rating: number) => void }) {
    return (
        <div className="flex items-center gap-2">
            {[...Array(5)].map((_, index) => {
                const ratingValue = index + 1;
                return (
                    <button
                        type="button"
                        key={ratingValue}
                        onClick={() => setRating(ratingValue)}
                        className="focus:outline-none"
                    >
                        <Star
                            className={cn(
                                'h-8 w-8 transition-colors',
                                ratingValue <= rating
                                    ? 'text-yellow-400 fill-yellow-400'
                                    : 'text-gray-300 fill-gray-300 hover:fill-yellow-300'
                            )}
                        />
                    </button>
                );
            })}
        </div>
    );
}

export default function ReviewPage() {
    const router = useRouter();
    const params = useParams();
    const { user, loading: authLoading } = useUser();
    const { userProfile, loading: profileLoading } = useUserProfile(user);
    const { toast } = useToast();

    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const productId = Array.isArray(params.id) ? params.id[0] : params.id;
    const [product, setProduct] = useState<Product | null>(null);
    const [productLoading, setProductLoading] = useState(true);

    useEffect(() => {
        if (!productId) return;
        
        let foundProduct: Product | null = allProducts.find((p) => p.id === productId) || null;
        
        if (!foundProduct && productId.startsWith('ai-pdf-')) {
            const aiProducts: Product[] = JSON.parse(localStorage.getItem('elevendocs_ai_products') || '[]');
            const aiProduct = aiProducts.find(p => p.id === productId);

            if (aiProduct) {
                foundProduct = aiProduct;
            } else {
                 const storedData = localStorage.getItem(productId);
                 if (storedData) {
                    try {
                        const pdfData = JSON.parse(storedData);
                        foundProduct = {
                            id: productId,
                            name: pdfData.title || `AI Document #${productId}`,
                            description: 'An AI-generated document.',
                            price: 49,
                            category: 'AI Services',
                            rating: 0,
                            reviewCount: 0,
                            imageUrl: `https://picsum.photos/seed/${productId}/80/80`,
                            imageHint: 'ai document',
                            tags: ['ai', 'pdf', 'generated'],
                        };
                    } catch (e) {
                        console.error('Error parsing product from local storage:', e);
                    }
                 }
            }
        }
        
        setProduct(foundProduct);
        setProductLoading(false);
        
    }, [productId]);


    useEffect(() => {
        if (!authLoading && !user) {
            router.push(`/login?redirect=/products/${productId}/review`);
        }
    }, [user, authLoading, router, productId]);
    
    useEffect(() => {
        if (!authLoading && !profileLoading && !productLoading && user && userProfile) {
            if (!product) {
                toast({
                    variant: 'destructive',
                    title: 'Product not found',
                    description: 'The product you are trying to review could not be found.',
                });
                router.push('/products');
                return;
            }

            if (!userProfile.purchaseHistory?.includes(productId)) {
                toast({
                    variant: 'destructive',
                    title: 'Access Denied',
                    description: 'You can only review products you have purchased.',
                });
                router.push(`/products/${productId}`);
            }
        }
    }, [user, userProfile, authLoading, profileLoading, productLoading, product, router, productId, toast]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !product || !firestore || !userProfile) return;
        if (rating === 0) {
            toast({ variant: 'destructive', title: 'Please select a rating' });
            return;
        }
        if (comment.trim() === '') {
            toast({ variant: 'destructive', title: 'Please write a comment' });
            return;
        }

        setIsSubmitting(true);
        try {
            await submitReview(firestore, product.id, {
                userId: user.uid,
                displayName: userProfile.displayName,
                avatarUrl: userProfile.photoURL || user.photoURL,
                rating,
                comment,
            });
            toast({
                title: 'Review Submitted!',
                description: 'Thank you for your feedback.',
            });
            router.push(`/products/${product.id}`);
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Submission Failed',
                description: 'There was an error submitting your review. Please try again.',
            });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    if (authLoading || profileLoading || productLoading || !userProfile) {
        return (
            <div className="container mx-auto flex min-h-screen items-center justify-center px-4 py-12">
                <Card className="w-full max-w-2xl">
                    <CardHeader>
                        <Skeleton className="h-8 w-48" />
                        <Skeleton className="h-4 w-64 mt-2" />
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-4 mb-6">
                            <Skeleton className="h-20 w-20 rounded-lg" />
                            <div className="space-y-2">
                                <Skeleton className="h-5 w-40" />
                                <Skeleton className="h-4 w-24" />
                            </div>
                        </div>
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-20" />
                                <div className="flex gap-2">
                                    <Skeleton className="h-8 w-8" />
                                    <Skeleton className="h-8 w-8" />
                                    <Skeleton className="h-8 w-8" />
                                    <Skeleton className="h-8 w-8" />
                                    <Skeleton className="h-8 w-8" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-20" />
                                <Skeleton className="h-24 w-full" />
                            </div>
                            <Skeleton className="h-12 w-full" />
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!product) {
        // This case should be handled by the useEffect redirect, but it's a good fallback.
        return <div className="container mx-auto flex min-h-screen items-center justify-center px-4 py-12"><p>Product not found.</p></div>
    }


    return (
        <div className="container mx-auto flex min-h-screen items-center justify-center px-4 py-12">
            <Card className="w-full max-w-2xl">
                <CardHeader>
                    <CardTitle className="text-2xl">Write a Review</CardTitle>
                    <CardDescription>Share your thoughts on {product.name}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-4 mb-6">
                        <Image src={product.imageUrl} alt={product.name} width={80} height={80} className="rounded-lg object-cover" />
                        <div>
                            <h3 className="font-semibold">{product.name}</h3>
                            <p className="text-sm text-muted-foreground">{product.category}</p>
                        </div>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label>Your Rating</Label>
                            <StarRatingInput rating={rating} setRating={setRating} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="comment">Your Review</Label>
                            <Textarea
                                id="comment"
                                placeholder={`What did you like or dislike about ${product.name}?`}
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                rows={5}
                                className="rounded-xl"
                            />
                        </div>
                        <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
                            {isSubmitting ? 'Submitting...' : 'Submit Review'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
