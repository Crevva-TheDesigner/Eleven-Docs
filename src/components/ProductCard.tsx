'use client';

import Link from 'next/link';
import type { Product, ProductCategory } from '@/lib/types';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from './ui/button';
import { useCart } from '@/hooks/use-cart';
import { useToast } from '@/hooks/use-toast';
import {
    ShoppingCart,
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
    Landmark
} from 'lucide-react';
import { Badge } from './ui/badge';

interface ProductCardProps {
  product: Product;
}

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

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const { toast } = useToast();

  const handleAddToCart = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product);
    toast({
      title: 'Product Added!',
      description: `${product.name} has been added to your cart.`,
    });
  };

  const Icon = categoryIcons[product.category] || Package;

  return (
    <Link href={`/products/${product.id}`} className="h-full">
        <Card className="group relative flex h-full flex-col overflow-hidden rounded-3xl bg-card transition-all duration-300 hover:shadow-2xl hover:border-primary/20 hover:-translate-y-2">
            
            <CardContent className="flex-grow flex flex-col p-6">
                <div className="flex justify-between items-center gap-4">
                    <div className="space-y-2">
                        <Badge variant="secondary" className="border border-foreground/10 bg-secondary/70 text-xs font-semibold rounded-full tracking-wide w-fit">
                            {product.category}
                        </Badge>
                        <h3 className="text-lg font-bold leading-tight text-card-foreground group-hover:text-primary transition-colors">
                            {product.name}
                        </h3>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted shrink-0 transition-colors duration-300 group-hover:bg-primary/10">
                        <Icon className="h-6 w-6 text-muted-foreground transition-colors duration-300 group-hover:text-primary" />
                    </div>
                </div>
                
                <div className="flex-grow mt-4">
                    <p className="text-sm text-muted-foreground line-clamp-3">
                        {product.description}
                    </p>
                </div>
            </CardContent>

            <CardFooter className="flex items-center justify-between p-4 border-t">
                <p className="text-xl font-extrabold text-primary">₹{product.price.toFixed(2)}</p>
                <Button size="icon" className="h-10 w-10 shrink-0" onClick={handleAddToCart}>
                    <ShoppingCart className="h-5 w-5"/>
                    <span className="sr-only">Add to cart</span>
                </Button>
            </CardFooter>
        </Card>
    </Link>
  );
}
