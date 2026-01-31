'use client';

import { useEffect, useState } from 'react';
import type { Product } from '@/lib/types';
import { ProductCard } from './ProductCard';
import { Skeleton } from './ui/skeleton';
import { useUser } from '@/firebase/auth/use-user';
import { useUserProfile } from '@/firebase/firestore/use-user-profile';
import Link from 'next/link';

interface PersonalizedRecommendationsProps {
  products: Product[];
}

export function PersonalizedRecommendations({ products }: PersonalizedRecommendationsProps) {
  const { user, loading: authLoading } = useUser();
  const { userProfile, loading: profileLoading } = useUserProfile(user);
  
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const isLoading = authLoading || profileLoading;
    setLoading(isLoading);

    if (isLoading || !user || !userProfile) {
      if (!isLoading && !user) {
        setRecommendations([]); // clear recommendations if user logs out
      }
      return;
    }
    
    if (!userProfile.interests || userProfile.interests.length === 0) {
      // If no interests, show some highly rated products as a fallback
      const popularProducts = [...products].sort((a, b) => b.reviewCount - a.reviewCount).slice(0, 4);
      setRecommendations(popularProducts);
      return;
    }

    const lowerCaseInterests = userProfile.interests.map(i => i.toLowerCase());

    const recommendedProducts = products.filter(product => {
        const productInfo = `${product.name} ${product.description} ${product.category} ${product.tags.join(' ')}`.toLowerCase();
        
        return lowerCaseInterests.some(interest => {
            const keywords = interest.replace(/&/g, '').split(/\s+/).filter(Boolean);
            return keywords.some(keyword => keyword.length > 2 && productInfo.includes(keyword));
        });
    });

    const shuffled = recommendedProducts.sort(() => 0.5 - Math.random());
    setRecommendations(shuffled.slice(0, 8));

  }, [user, userProfile, products, authLoading, profileLoading]);

  if (!user) {
    return null; // Don't show this section if user is not logged in
  }

  return (
    <div>
      <h2 className="text-3xl font-bold tracking-tighter mb-8">Specially For You</h2>
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
                <Skeleton className="h-[200px] w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : recommendations.length > 0 ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-8">
          {recommendations.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-card rounded-xl">
          <p className="text-muted-foreground mb-4">Complete our short survey to get personalized recommendations!</p>
          <Link href="/survey" className="text-primary font-semibold hover:underline">
            Take the Survey
          </Link>
        </div>
      )}
    </div>
  );
}
