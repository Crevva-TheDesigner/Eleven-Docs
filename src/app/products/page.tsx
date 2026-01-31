'use client';

import { useState, useEffect } from 'react';
import { allProducts } from '@/lib/data';
import { ProductCard } from '@/components/ProductCard';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';
import type { Product, ProductCategory } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

const categories: ProductCategory[] = [
    'Academic Notes',
    'Exam Prep',
    'Coding & Tech',
    'Skill Development',
    'Personal Growth',
    'Planners & Organizers',
    'Bundles',
    'Digital Notebooks',
    'Code Libraries',
    'Digital Journals'
];


export default function ProductsPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [sortOrder, setSortOrder] = useState('price-asc');
    const [allAvailableProducts, setAllAvailableProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // This effect runs only on the client side
        const storedAiProducts: Product[] = JSON.parse(localStorage.getItem('elevendocs_ai_products') || '[]');
        const combinedProducts = [...allProducts, ...storedAiProducts];
        setAllAvailableProducts(combinedProducts);
        setIsLoading(false);
    }, []);

    const filteredProducts = allAvailableProducts
        .filter(product => {
            const categoryMatch = selectedCategory === 'all' || product.category === selectedCategory;

            if (searchTerm.trim() === '') {
                return categoryMatch;
            }

            const searchKeywords = searchTerm.toLowerCase().split(' ').filter(Boolean);
            const productText = `
                ${product.name.toLowerCase()} 
                ${product.description.toLowerCase()} 
                ${product.tags.join(' ').toLowerCase()}
            `;

            const termMatch = searchKeywords.every(keyword => productText.includes(keyword));

            return termMatch && categoryMatch;
        })
        .sort((a, b) => {
            if (sortOrder === 'price-desc') {
                return b.price - a.price;
            }
            if (sortOrder === 'rating') {
                return (b.rating || 0) - (a.rating || 0);
            }
            // default to price-asc
            return a.price - b.price;
        });

    if (isLoading) {
        return (
            <div className="container mx-auto px-4 py-8 md:py-12">
                <div className="text-center max-w-4xl mx-auto mb-8 md:mb-12">
                    <h1 className="text-5xl md:text-6xl font-extrabold tracking-tighter mb-4">
                        All Products
                    </h1>
                    <p className="mt-4 text-lg md:text-xl text-muted-foreground">
                        Browse our extensive collection of digital assets to fuel your creativity and productivity.
                    </p>
                </div>
                <div className="mb-8 md:mb-12 flex flex-col md:flex-row gap-4">
                    <Skeleton className="h-10 flex-1 rounded-xl" />
                    <Skeleton className="h-10 w-full md:w-[200px] rounded-xl" />
                    <Skeleton className="h-10 w-full md:w-[200px] rounded-xl" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <CardSkeleton key={i} />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 md:py-12">
            <div className="text-center max-w-4xl mx-auto mb-8 md:mb-12">
                <h1 className="text-5xl md:text-6xl font-extrabold tracking-tighter mb-4">
                    All Products
                </h1>
                <p className="mt-4 text-lg md:text-xl text-muted-foreground">
                    Browse our extensive collection of digital assets to fuel your creativity and productivity.
                </p>
            </div>

            <div className="mb-8 md:mb-12 flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                        placeholder="Search for products..."
                        className="pl-12 rounded-full"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Select onValueChange={setSelectedCategory} defaultValue="all">
                    <SelectTrigger className="w-full md:w-[200px]">
                        <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {[...new Set(allAvailableProducts.map(p => p.category))].sort().map(category => (
                            <SelectItem key={category} value={category}>{category}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select onValueChange={setSortOrder} defaultValue="price-asc">
                    <SelectTrigger className="w-full md:w-[200px]">
                        <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="price-asc">Price: Low to High</SelectItem>
                        <SelectItem value="price-desc">Price: High to Low</SelectItem>
                        <SelectItem value="rating">Sort by Rating</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <section>
                {filteredProducts.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredProducts.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                ) : (
                    <p className="text-muted-foreground text-center py-12">No products found. Try adjusting your search.</p>
                )}
            </section>
        </div>
    );
}


function CardSkeleton() {
    return (
        <div className="space-y-3">
            <Skeleton className="aspect-[3/2] w-full rounded-xl" />
            <div className="space-y-2">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-5 w-3/4" />
                <div className="flex justify-between">
                    <Skeleton className="h-6 w-1/3" />
                    <Skeleton className="h-4 w-1/4" />
                </div>
            </div>
        </div>
    );
}
