'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@/firebase/auth/use-user';
import { useUserProfile } from '@/firebase/firestore/use-user-profile';
import { firestore } from '@/firebase/client';
import { Button } from '@/components/ui/button';
import { Loader2, BookText, ClipboardCheck, Code, Library, Trophy, TrendingUp, Calendar, Package, Notebook, BookHeart, Sparkles, Brain, Landmark } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { addProductsToPurchaseHistory } from '@/firebase/firestore/users';
import { useToast } from '@/hooks/use-toast';
import { createRazorpayOrder, verifyRazorpayPayment } from '@/ai/flows/razorpay-flow';
import { createOrder } from '@/firebase/firestore/orders';
import type { Product, ProductCategory } from '@/lib/types';
import { allProducts } from '@/lib/data';
import { Skeleton } from '@/components/ui/skeleton';

declare const window: any;

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useUser();
  const { userProfile, loading: profileLoading } = useUserProfile(user);
  const { toast } = useToast();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loadingProduct, setLoadingProduct] = useState(true);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const productId = Array.isArray(params.id) ? params.id[0] : params.id;
  const isAdmin = user?.email === 'the.designer.crevva@gmail.com';

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
                        imageUrl: `https://picsum.photos/seed/${productId}/600/400`,
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
    setLoadingProduct(false);

    if (!foundProduct && !loadingProduct) {
      toast({
        variant: 'destructive',
        title: 'Product not found',
        description: 'The product you are trying to purchase could not be found.',
      });
      router.push('/products');
    }
  }, [productId, router, toast, loadingProduct]);

  useEffect(() => {
    if (!authLoading && !user) {
        router.push(`/login?redirect=/checkout/${productId}`);
    }
  }, [user, authLoading, router, productId]);


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

  const handlePaymentSuccess = async (upiId?: string) => {
    setIsProcessingPayment(true);
    if (user && firestore && userProfile && product) {
      try {
        // Here we create an order with a single item
        await createOrder(firestore, user.uid, [product], product.price, userProfile.displayName, userProfile.email, upiId);
        await addProductsToPurchaseHistory(firestore, user.uid, [product.id]);
        toast({
            title: 'Purchase Successful!',
            description: 'Your purchase has been completed. Redirecting to your dashboard.',
        });
        router.push('/dashboard?payment=success');
      } catch(e) {
        toast({
            variant: 'destructive',
            title: 'Purchase Failed',
            description: 'There was an error completing your purchase.'
        });
        setIsProcessingPayment(false);
      }
    } else {
      setIsProcessingPayment(false);
    }
  };
  
  const processPayment = async () => {
    if (!product) return;
    setIsProcessingPayment(true);

    if (!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID) {
      toast({
        variant: 'destructive',
        title: 'Configuration Error',
        description: 'Razorpay is not configured. Please fill in NEXT_PUBLIC_RAZORPAY_KEY_ID in the .env file.',
      });
      setIsProcessingPayment(false);
      return;
    }

    try {
      const order = await createRazorpayOrder({
        amount: product.price * 100, // amount in paise
        currency: 'INR',
      });

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onerror = () => {
        toast({ variant: 'destructive', title: 'Payment Error', description: 'Razorpay script failed to load.' });
        setIsProcessingPayment(false);
      };
      script.onload = () => {
        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: order.amount,
          currency: order.currency,
          name: 'Eleven Docs',
          description: `Purchase of ${product.name}`,
          order_id: order.id,
          handler: async (response: any) => {
            setIsProcessingPayment(true);
            const verificationData = {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            };

            try {
                const { isValid, vpa } = await verifyRazorpayPayment(verificationData);

                if (isValid) {
                    handlePaymentSuccess(vpa || undefined);
                } else {
                    toast({ variant: 'destructive', title: 'Payment Failed', description: 'Payment verification failed. Please contact support.' });
                    setIsProcessingPayment(false);
                }
            } catch (error: any) {
                console.error('Payment verification error:', error);
                toast({ variant: 'destructive', title: 'Payment Error', description: 'An error occurred during payment verification.' });
                setIsProcessingPayment(false);
            }
          },
          prefill: {
            name: userProfile?.displayName || user?.displayName || '',
            email: userProfile?.email || user?.email || '',
          },
          theme: {
            color: '#64748b',
          },
          modal: {
            ondismiss: () => {
              setIsProcessingPayment(false);
            },
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (response: any) {
            toast({
                variant: 'destructive',
                title: 'Payment Failed',
                description: response.error.description || 'Something went wrong.',
            });
            setIsProcessingPayment(false);
        });
        rzp.open();
        setIsProcessingPayment(false);
      };

      document.body.appendChild(script);

    } catch (error: any) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Payment Error', description: error.message || 'Could not create Razorpay order.' });
      setIsProcessingPayment(false);
    }
  };
  
  if (authLoading || profileLoading || loadingProduct) {
    return (
      <div className="container mx-auto flex min-h-[calc(100vh-14rem)] items-center justify-center px-4 py-8 md:py-12">
        <Loader2 className="h-12 w-12 animate-spin" />
      </div>
    );
  }

  if (!user) {
     return (
        <div className="container mx-auto flex min-h-[calc(100vh-14rem)] items-center justify-center px-4 py-8 md:py-12">
          <Alert variant="destructive" className="max-w-md w-full">
            <AlertTitle>Login Required</AlertTitle>
            <AlertDescription className="flex flex-col gap-4">
                <p>You need to be logged in to complete this purchase.</p>
                <Button asChild>
                    <Link href={`/login?redirect=/checkout/${productId}`}>Login or Create Account</Link>
                </Button>
            </AlertDescription>
          </Alert>
        </div>
     );
  }

  if (!product) {
      return (
        <div className="container mx-auto flex min-h-[calc(100vh-14rem)] items-center justify-center px-4 py-8 md:py-12">
            <Alert>
                <AlertTitle>Product Not Found</AlertTitle>
                <AlertDescription>
                    The product you are trying to purchase could not be found.
                </AlertDescription>
            </Alert>
        </div>
      );
  }
  
  const Icon = categoryIcons[product.category] || Package;

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 min-h-[calc(100vh-14rem)] flex items-center justify-center">
        <Card className="w-full max-w-lg">
            <CardHeader>
                <CardTitle>Complete Your Purchase</CardTitle>
                <CardDescription>You are purchasing a single item.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
                 <div className="p-4 transition-all rounded-xl border">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-muted shrink-0">
                            <Icon className="h-10 w-10 text-muted-foreground" />
                        </div>
                        <div className="flex-grow">
                            <h2 className="font-semibold text-lg line-clamp-2">{product.name}</h2>
                            <p className="text-muted-foreground text-sm">{product.category}</p>
                            <p className="text-muted-foreground mt-2 text-sm line-clamp-2">{product.description}</p>
                        </div>
                        <div className="text-right self-stretch flex flex-col justify-between items-end w-full sm:w-auto mt-4 sm:mt-0">
                            <p className="font-bold text-xl">₹{product.price.toFixed(2)}</p>
                        </div>
                    </div>
                </div>

                 <div>
                    <p className="text-muted-foreground mb-4 text-center">
                        {isAdmin
                            ? "You are an admin. You can complete this purchase for free."
                            : "Click the button below to proceed with Razorpay."
                        }
                    </p>
                    <Button 
                        size="lg" 
                        className="w-full" 
                        onClick={isAdmin ? () => handlePaymentSuccess() : processPayment}
                        disabled={isProcessingPayment}
                    >
                        {isProcessingPayment ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
                        ) : (
                            isAdmin ? 'Complete for Free' : `Pay ₹${product.price.toFixed(2)} with Razorpay`
                        )}
                    </Button>
                     <p className="text-xs text-muted-foreground mt-2 text-center">
                        {isAdmin
                            ? "This will register the purchase in the system without payment."
                            : "You will be redirected to Razorpay's secure checkout."
                        }
                    </p>
                </div>
            </CardContent>
            <CardFooter>
                <Button variant="link" className="w-full" asChild>
                    <Link href="/products">Continue Shopping</Link>
                </Button>
            </CardFooter>
        </Card>
    </div>
  );
}
