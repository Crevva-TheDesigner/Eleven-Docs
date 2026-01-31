'use client';

import { notFound, useRouter, useParams } from 'next/navigation';
import { useMemo, useState, useEffect } from 'react';
import { allProducts } from '@/lib/data';
import { StarRating } from '@/components/StarRating';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
    ShoppingCart, 
    Check,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/hooks/use-cart';
import { useReviews } from '@/firebase/firestore/reviews';
import { firestore } from '@/firebase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import type { Product, ProductCategory } from '@/lib/types';
import { ProductContentPreview } from '@/components/ProductContentPreview';
import { Card, CardContent } from '@/components/ui/card';
import { ProductIconCollage } from '@/components/ProductIconCollage';


export default function ProductPage() {
  const params = useParams();
  const { toast } = useToast();
  const { addToCart, cartItems } = useCart();
  const router = useRouter();

  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const [product, setProduct] = useState<Product | null>(null);
  const [loadingProduct, setLoadingProduct] = useState(true);

  const { reviews, loading: reviewsLoading } = useReviews(firestore, id);
  
  const isAddedToCart = useMemo(() => cartItems.some(item => item.id === product?.id), [cartItems, product]);

  useEffect(() => {
    if (!id) return;

    let foundProduct: Product | null = allProducts.find((p) => p.id === id) || null;
    
    if (!foundProduct && id.startsWith('ai-pdf-')) {
        const aiProducts: Product[] = JSON.parse(localStorage.getItem('elevendocs_ai_products') || '[]');
        foundProduct = aiProducts.find(p => p.id === id) || null;
    }
    
    setProduct(foundProduct);
    setLoadingProduct(false);

    if (!foundProduct && !loadingProduct) {
        notFound();
    }
  }, [id, loadingProduct]);


  const { averageRating, totalReviews } = useMemo(() => {
    if (!reviews || reviews.length === 0) {
      return { averageRating: product?.rating || 0, totalReviews: product?.reviewCount || 0 };
    }
    const totalRating = reviews.reduce((acc, review) => acc + review.rating, 0);
    return {
      averageRating: totalRating / reviews.length,
      totalReviews: reviews.length,
    };
  }, [reviews, product]);


  if (loadingProduct || !product) {
    return (
        <div className="container mx-auto px-4 py-8 md:py-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-start">
                <Skeleton className="aspect-square w-full rounded-3xl" />
                <div className="space-y-6">
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-12 w-3/4" />
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-12 w-48" />
                     <div className="flex gap-4">
                        <Skeleton className="h-12 flex-1" />
                        <Skeleton className="h-12 flex-1" />
                    </div>
                </div>
            </div>
        </div>
    );
  }

  const handleAddToCart = () => {
    if (isAddedToCart) {
        router.push('/cart');
        return;
    }
    addToCart(product);
    toast({
      title: 'Product Added!',
      description: `${product.name} has been added to your cart.`,
    });
  };
  
  const handleBuyNow = () => {
    router.push(`/checkout/${product.id}`);
  };

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-start">
        {/* Left Column: Decorative Element */}
        <div className="aspect-square w-full lg:sticky top-24 flex items-center justify-center">
            <Card className="w-full h-full flex items-center justify-center overflow-hidden">
                <div className="relative w-full h-full flex items-center justify-center bg-muted/20">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--accent)),transparent_70%)]"></div>
                    <div className="absolute inset-0 opacity-10">
                        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                            <defs>
                                <pattern id="dot-pattern" width="20" height="20" patternUnits="userSpaceOnUse">
                                    <circle cx="10" cy="10" r="1" fill="hsl(var(--foreground))" />
                                </pattern>
                            </defs>
                            <rect width="100%" height="100%" fill="url(#dot-pattern)" />
                        </svg>
                    </div>
                    <ProductIconCollage category={product.category} />
                </div>
            </Card>
        </div>


        {/* Right Column: Details */}
        <div className="flex flex-col">
            <div className="flex-grow text-center lg:text-left">
                <Badge variant="secondary" className="w-fit mb-4">{product.category}</Badge>
                
                <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tighter">{product.name}</h1>
                
                <div className="mt-4 flex items-center justify-center lg:justify-start gap-2">
                    {reviewsLoading ? (
                        <Skeleton className="h-5 w-32" />
                    ) : totalReviews > 0 ? (
                        <>
                            <StarRating rating={averageRating} />
                            <span className="text-muted-foreground text-sm">
                            {averageRating.toFixed(1)} ({totalReviews} {totalReviews === 1 ? 'review' : 'reviews'})
                            </span>
                        </>
                    ) : (
                        <span className="text-muted-foreground text-sm">No reviews yet. Be the first!</span>
                    )}
                </div>

                <p className="text-lg text-muted-foreground mt-6">{product.description}</p>
            </div>
            
            <div className="mt-8 pt-8 border-t">
                 <p className="text-5xl font-bold mb-6 text-center lg:text-left">₹{product.price.toFixed(2)}</p>
            
                <div className="flex flex-col sm:flex-row gap-4">
                    <Button size="lg" className="w-full" onClick={handleAddToCart}>
                        {isAddedToCart ? <Check className="mr-2 h-5 w-5" /> : <ShoppingCart className="mr-2 h-5 w-5" />}
                        {isAddedToCart ? 'Go to Cart' : 'Add to Cart'}
                    </Button>
                    <Button size="lg" variant="outline" className="w-full" onClick={handleBuyNow}>
                        Buy Now
                    </Button>
                </div>

                <div className="mt-6 flex flex-wrap justify-center lg:justify-start gap-2">
                    {product.tags.map(tag => (
                        <Badge key={tag} variant="outline">{tag}</Badge>
                    ))}
                </div>
            </div>
        </div>
      </div>
      
      {/* Full-width sections below */}
      <div className="mt-12 md:mt-16">
        {(product.hasStaticContent || product.id.startsWith('ai-pdf-')) && <ProductContentPreview product={product} />}
      </div>

      <Separator className="my-12 md:my-16" />

      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold mb-8 text-center">Ratings & Reviews</h2>
        {reviewsLoading ? (
            <div className="space-y-8">
                 {Array.from({ length: 2 }).map((_, i) => (
                    <div key={i} className="flex gap-4">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-1/4" />
                            <Skeleton className="h-4 w-1/2" />
                        </div>
                    </div>
                ))}
            </div>
        ) : (
            <div className="space-y-8">
                {reviews.length > 0 ? reviews.map(review => (
                    <Card key={review.id} className="p-6">
                        <div className="flex gap-4">
                            <Avatar>
                                <AvatarImage src={review.avatarUrl || ''} alt={review.displayName} />
                                <AvatarFallback>{review.displayName.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <div className="flex items-center justify-between">
                                    <p className="font-semibold">{review.displayName}</p>
                                    <span className="text-sm text-muted-foreground">
                                        {review.createdAt ? formatDistanceToNow(review.createdAt.toDate(), { addSuffix: true }) : ''}
                                    </span>
                                </div>
                                <StarRating rating={review.rating} className="my-1" />
                                <p className="text-muted-foreground mt-2">{review.comment}</p>
                            </div>
                        </div>
                    </Card>
                )) : 
                <Card className="text-center p-12">
                    <p className="text-muted-foreground">No reviews yet for this product.</p>
                </Card>
                }
            </div>
        )}
      </div>
    </div>
  );
}
