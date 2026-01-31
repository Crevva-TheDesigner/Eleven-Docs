'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase/auth/use-user';
import { firestore } from '@/firebase/client';
import { collectionGroup, onSnapshot, query, orderBy } from 'firebase/firestore';
import type { Order } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { format } from 'date-fns';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export default function BuyersPage() {
  const { user } = useUser();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && user.email !== 'the.designer.crevva@gmail.com') {
      router.push('/dashboard');
    }
  }, [user, router]);

  useEffect(() => {
    if (user && user.email === 'the.designer.crevva@gmail.com' && firestore) {
      const ordersQuery = query(collectionGroup(firestore, 'orders'), orderBy('createdAt', 'desc'));
      
      const unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
        const fetchedOrders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
        setOrders(fetchedOrders);
        setLoading(false);
      }, (error) => {
        const permissionError = new FirestorePermissionError({
          path: "(collection group 'orders')",
          operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
        setLoading(false);
      });

      return () => unsubscribe();
    } else if (user) {
      setLoading(false);
    }
  }, [user]);

  const totalRevenue = useMemo(() => {
    return orders.reduce((sum, order) => sum + order.totalAmount, 0);
  }, [orders]);

  if (loading) {
    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8">Buyers</h1>
            <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-80" />
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
  }

  if (user?.email !== 'the.designer.crevva@gmail.com') {
      return (
          <div className="container mx-auto px-4 py-8 text-center">
              <h1 className="text-3xl font-bold mb-4">Access Denied</h1>
              <p>You do not have permission to view this page.</p>
          </div>
      )
  }

  return (
    <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Buyers</h1>
        <Card>
            <CardHeader>
                <CardTitle>All Purchases</CardTitle>
                <CardDescription>
                    Total revenue from all purchases: ₹{totalRevenue.toFixed(2)}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Buyer</TableHead>
                            <TableHead>Product(s)</TableHead>
                            <TableHead>Total Price</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-right">Invoice</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {orders.length > 0 ? (
                            orders.map((order) => (
                                <TableRow key={order.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-9 w-9">
                                                <AvatarFallback>{order.userDisplayName?.charAt(0) || 'U'}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <div className="font-medium">{order.userDisplayName}</div>
                                                <div className="text-sm text-muted-foreground">{order.userEmail}</div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {order.items.length > 1 ? (
                                            <ul className="list-disc list-inside space-y-1">
                                                {order.items.map((item, itemIndex) => (
                                                    <li key={itemIndex} className="text-sm">
                                                        {item.name}
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <div>
                                                <div className="font-medium">{order.items[0].name}</div>
                                                <div className="text-sm text-muted-foreground">{order.items[0].category}</div>
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                       ₹{order.totalAmount.toFixed(2)}
                                    </TableCell>
                                    <TableCell>
                                       {order.createdAt ? format(order.createdAt.toDate(), 'PPP') : 'N/A'}
                                    </TableCell>
                                    <TableCell className="text-right">
                                       <Button asChild variant="outline" size="sm">
                                            <Link href={`/invoice/${order.id}?userId=${order.userId}`} target="_blank">
                                                <Download className="mr-2 h-4 w-4" />
                                                View
                                            </Link>
                                       </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    No purchases yet.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    </div>
  )
}
