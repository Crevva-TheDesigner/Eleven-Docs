'use client';

import { useState, useEffect } from 'react';
import { useCollectionCount } from '@/firebase/firestore/stats';
import { firestore } from '@/firebase/client';
import { allProducts } from '@/lib/data';
import { formatNumber } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Package } from 'lucide-react';
import type { Product } from '@/lib/types';

export function AboutStats() {
  const { count: userCount, loading: usersLoading } = useCollectionCount(firestore, 'users');
  const [productCount, setProductCount] = useState(0);
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    // This effect runs only on the client side
    const storedAiProducts: Product[] = JSON.parse(localStorage.getItem('elevendocs_ai_products') || '[]');
    setProductCount(allProducts.length + storedAiProducts.length);
    setLoadingProducts(false);
  }, []);

  const stats = [
    {
      icon: <Users className="h-8 w-8 text-primary" />,
      value: usersLoading ? <Skeleton className="h-8 w-20 rounded-md" /> : formatNumber(userCount),
      label: 'Happy Users',
    },
    {
      icon: <Package className="h-8 w-8 text-primary" />,
      value: loadingProducts ? <Skeleton className="h-8 w-20 rounded-md" /> : formatNumber(productCount),
      label: 'Digital Products',
    },
  ];

  return (
    <div className="mt-12 grid grid-cols-2 gap-8 text-center">
      {stats.map((stat, index) => (
        <div key={index} className="bg-card p-6 rounded-xl border flex flex-col items-center justify-center gap-2">
          {stat.icon}
          <div className="text-4xl font-extrabold tracking-tighter">{stat.value}</div>
          <p className="text-muted-foreground mt-1">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}
