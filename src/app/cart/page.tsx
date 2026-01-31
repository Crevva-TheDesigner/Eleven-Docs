'use client';

import { useState } from 'react';
import { useCart } from '@/hooks/use-cart';
import { useUser } from '@/firebase/auth/use-user';
import { useUserProfile } from '@/firebase/firestore/use-user-profile';
import { firestore } from '@/firebase/client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Trash2, Loader2, BookText, ClipboardCheck, Code, Library, Trophy, TrendingUp, Calendar, Package, Notebook, BookHeart, Sparkles, Brain, Landmark } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { addProductsToPurchaseHistory } from '@/firebase/firestore/users';
import { useToast } from '@/hooks/use-toast';
import { createRazorpayOrder, verifyRazorpayPayment } from '@/ai/flows/razorpay-flow';
import { createOrder } from '@/firebase/firestore/orders';
import type { ProductCategory } from '@/lib/types';

declare const window: any;

export default function CartPage() {
  const { cartItems, removeFromCart, cartTotal, clearCart } = useCart();
  const { user, loading: authLoading } = useUser();
  const { userProfile, loading: profileLoading } = useUserProfile(user);
  const router = useRouter();
  const { toast } = useToast();
  
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'payment'>('cart');
  const [showLoginWarning, setShowLoginWarning] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const isAdmin = user?.email === 'the.designer.crevva@gmail.com';

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

  const handleCheckout = () => {
    if (!user) {
      setShowLoginWarning(true);
      router.push('/login?redirect=/cart');
    } else {
      setCheckoutStep('payment');
    }
  };

  const handlePaymentSuccess = async (upiId?: string) => {
    setIsProcessingPayment(true);
    if (user && firestore && userProfile) {
      const productIds = cartItems.map(item => item.id);
      try {
        await createOrder(firestore, user.uid, cartItems, cartTotal, userProfile.displayName, userProfile.email, upiId);
        await addProductsToPurchaseHistory(firestore, user.uid, productIds);
        clearCart();
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
      // 1. Create order on server
      const order = await createRazorpayOrder({
        amount: cartTotal * 100, // amount in paise
        currency: 'INR',
      });

      // 2. Load Razorpay script and open checkout
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
          description: 'Your purchase from Eleven Docs',
          order_id: order.id,
          handler: async (response: any) => {
            // 3. Verify payment on server
            setIsProcessingPayment(true); // Show processing indicator during verification
            const verificationData = {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            };

            try {
                const { isValid, vpa } = await verifyRazorpayPayment(verificationData);

                if (isValid) {
                    // 4. Payment successful - update DB and clear cart
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
            color: '#64748b', // Use primary color from theme
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
        // Since the modal is now open, we can set processing to false.
        // The handler will set it back to true during verification.
        setIsProcessingPayment(false);
      };

      document.body.appendChild(script);

    } catch (error: any) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Payment Error', description: error.message || 'Could not create Razorpay order.' });
      setIsProcessingPayment(false);
    }
  };
  
  
  if (checkoutStep === 'cart' && cartItems.length === 0) {
    return (
        <div className="container mx-auto px-4 py-8 md:py-12 min-h-[calc(100vh-14rem)] flex items-center justify-center">
            <div className="text-center">
                <ShoppingCart className="h-24 w-24 mx-auto text-muted-foreground" />
                <h1 className="mt-8 text-4xl font-bold tracking-tight">Your Cart is Empty</h1>
                <p className="mt-4 text-lg text-muted-foreground">Looks like you haven't added anything to your cart yet.</p>
                <Button asChild className="mt-8" size="lg">
                    <Link href="/products">Continue Shopping</Link>
                </Button>
            </div>
        </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 min-h-[calc(100vh-14rem)]">
      <h1 className="text-3xl md:text-4xl font-extrabold tracking-tighter mb-8">
        {checkoutStep === 'cart' ? 'Your Cart' : 'Checkout'}
      </h1>

      {showLoginWarning && (
        <Alert variant="destructive" className="mb-8">
          <AlertTitle>Login Required</AlertTitle>
          <AlertDescription>
            You need to be logged in to proceed to checkout.
          </AlertDescription>
        </Alert>
      )}

      {checkoutStep === 'cart' && (
        <div className="grid lg:grid-cols-3 gap-8 md:gap-12">
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map(item => {
              const Icon = categoryIcons[item.category as ProductCategory] || Package;
              return (
                <Card key={item.id} className="p-4 transition-all hover:shadow-md">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-muted shrink-0">
                            <Icon className="h-10 w-10 text-muted-foreground" />
                        </div>
                        <div className="flex-grow">
                            <h2 className="font-semibold line-clamp-2">{item.name}</h2>
                            <p className="text-muted-foreground text-sm">{item.category}</p>
                        </div>
                        <div className="text-right self-stretch flex flex-col justify-between items-end w-full sm:w-auto">
                            <p className="font-bold text-lg">₹{item.price.toFixed(2)}</p>
                            <Button variant="ghost" size="icon" onClick={() => removeFromCart(item.id)} className="shrink-0 -mr-2">
                                <Trash2 className="h-5 w-5 text-muted-foreground hover:text-destructive" />
                            </Button>
                        </div>
                    </div>
                </Card>
              )
            })}
          </div>
          <div className="lg:col-span-1">
             <Card>
                <CardHeader>
                    <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span>₹{cartTotal.toFixed(2)}</span>
                    </div>
                     <div className="flex justify-between">
                        <span>Taxes & Fees</span>
                        <span>₹0.00</span>
                    </div>
                     <div className="flex justify-between font-bold text-lg">
                        <span>Total</span>
                        <span>₹{cartTotal.toFixed(2)}</span>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button className="w-full btn-wipe-ltr hover:bg-primary" size="lg" onClick={handleCheckout}>Proceed to Checkout</Button>
                </CardFooter>
             </Card>
          </div>
        </div>
      )}

      {checkoutStep === 'payment' && (
        <Card className="max-w-md mx-auto">
            <CardHeader>
                <CardTitle>Complete Your Purchase</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
                <p className="text-muted-foreground">
                    {isAdmin
                        ? "You are an admin. You can complete this purchase for free."
                        : "Click the button below to proceed with Razorpay."
                    }
                </p>
                <Button 
                    size="lg" 
                    className="w-full" 
                    onClick={isAdmin ? () => handlePaymentSuccess() : processPayment}
                    disabled={isProcessingPayment || authLoading || profileLoading}
                >
                    {isProcessingPayment ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
                    ) : (
                        isAdmin ? 'Complete for Free' : `Pay ₹${cartTotal.toFixed(2)} with Razorpay`
                    )}
                </Button>
                <p className="text-xs text-muted-foreground">
                    {isAdmin
                        ? "This will register the purchase in the system without payment."
                        : "You will be redirected to Razorpay's secure checkout."
                    }
                </p>
            </CardContent>
        </Card>
      )}

    </div>
  );
}
