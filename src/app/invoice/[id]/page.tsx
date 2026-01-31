'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@/firebase/auth/use-user';
import { firestore } from '@/firebase/client';
import { getOrder } from '@/firebase/firestore/orders';
import type { Order } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Loader2, Download } from 'lucide-react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { useUserProfile } from '@/firebase/firestore/use-user-profile';

export default function InvoicePage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, loading: authLoading } = useUser();
    const { userProfile, loading: profileLoading } = useUserProfile(user);
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);

    const orderId = Array.isArray(params.id) ? params.id[0] : params.id;
    const adminRequestedUserId = searchParams.get('userId');

    useEffect(() => {
        if (authLoading || profileLoading) return;
        if (!user) {
            router.push(`/login?redirect=/invoice/${orderId}`);
            return;
        }

        const isAdmin = userProfile?.email === 'the.designer.crevva@gmail.com';
        const targetUserId = isAdmin && adminRequestedUserId ? adminRequestedUserId : user.uid;

        if (orderId && targetUserId && firestore) {
            getOrder(firestore, targetUserId, orderId)
                .then(orderData => {
                    if (orderData) {
                        setOrder(orderData);
                    }
                    setLoading(false);
                })
                .catch(err => {
                    console.error("Error fetching order:", err);
                    setLoading(false);
                });
        }
    }, [orderId, user, authLoading, router, userProfile, profileLoading, adminRequestedUserId]);

    const handlePrint = () => {
        window.print();
    };

    if (loading || authLoading || profileLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }
    
    if (!order) {
        return (
            <div className="flex h-screen flex-col items-center justify-center gap-4 text-center">
                <h1 className="text-2xl font-bold">Invoice Not Found</h1>
                <p className="text-muted-foreground max-w-sm">The invoice you are looking for could not be found or you do not have permission to view it.</p>
                <Button onClick={() => router.push('/dashboard')}>Go to Dashboard</Button>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 md:py-12 printable-area">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-start mb-8 non-printable">
                    <div>
                        <h1 className="text-3xl font-bold">Invoice</h1>
                        <p className="text-muted-foreground">Order #{order.id}</p>
                    </div>
                    <Button onClick={handlePrint}>
                        <Download className="mr-2 h-4 w-4" />
                        Download Invoice
                    </Button>
                </div>

                <Card className="print-card">
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <div>
                                <h1 className="font-bold text-xl">Eleven Docs</h1>
                                <p className="text-muted-foreground">Digital Marketplace</p>
                            </div>
                            <div>
                                <CardTitle>Invoice</CardTitle>
                                <CardDescription>#{order.id}</CardDescription>
                            </div>
                        </div>
                         <div className="flex justify-between items-start pt-4">
                            <div>
                                <p className="font-semibold">Billed to</p>
                                <p>{order.userDisplayName}</p>
                                <p>{order.userEmail}</p>
                                {order.userUpiId && <p className="text-sm text-muted-foreground">UPI: {order.userUpiId}</p>}
                            </div>
                             <div className="text-right">
                                <p className="font-semibold">Invoice Date</p>
                                <p>{order.createdAt ? format(order.createdAt.toDate(), 'PPP') : 'N/A'}</p>
                             </div>
                         </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Product</TableHead>
                                    <TableHead className="text-right">Price</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {order.items.map(item => (
                                    <TableRow key={item.id}>
                                        <TableCell>
                                            <p className="font-medium">{item.name}</p>
                                            <p className="text-sm text-muted-foreground">{item.category}</p>
                                        </TableCell>
                                        <TableCell className="text-right">₹{item.price.toFixed(2)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        <Separator className="my-4" />
                        <div className="flex justify-end">
                            <div className="w-full max-w-xs space-y-2">
                                <div className="flex justify-between">
                                    <p>Subtotal</p>
                                    <p>₹{order.totalAmount.toFixed(2)}</p>
                                </div>
                                 <div className="flex justify-between">
                                    <p>Taxes</p>
                                    <p>₹0.00</p>
                                </div>
                                <Separator />
                                <div className="flex justify-between font-bold text-lg">
                                    <p>Total</p>
                                    <p>₹{order.totalAmount.toFixed(2)}</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter>
                         <p className="text-xs text-muted-foreground">Thank you for your purchase!</p>
                    </CardFooter>
                </Card>
            </div>

            <style jsx global>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    .printable-area, .printable-area * {
                        visibility: visible;
                    }
                    .printable-area {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        height: 100%;
                        margin: 0;
                        padding: 0;
                    }
                    .non-printable {
                        display: none;
                    }
                    .print-card {
                        border: none;
                        box-shadow: none;
                    }
                    @page {
                        size: A4;
                        margin: 0.5in;
                    }
                }
            `}</style>
        </div>
    );
}
