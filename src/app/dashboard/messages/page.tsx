'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase/auth/use-user';
import { firestore } from '@/firebase/client';
import { collection, onSnapshot, query, orderBy, Timestamp } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

interface Message {
  id: string;
  name: string;
  email: string;
  subject?: string;
  message: string;
  createdAt: Timestamp;
}

export default function MessagesPage() {
  const { user } = useUser();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && user.email !== 'the.designer.crevva@gmail.com') {
      router.push('/dashboard');
    }
  }, [user, router]);

  useEffect(() => {
    if (user && user.email === 'the.designer.crevva@gmail.com' && firestore) {
      const messagesQuery = query(collection(firestore, 'contact-messages'), orderBy('createdAt', 'desc'));
      
      const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
        const fetchedMessages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
        setMessages(fetchedMessages);
        setLoading(false);
      }, (error) => {
        const permissionError = new FirestorePermissionError({
          path: collection(firestore, 'contact-messages').path,
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
  
  if (loading) {
    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8">Contact Messages</h1>
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
        <h1 className="text-3xl font-bold mb-8">Contact Messages</h1>
        <Card>
            <CardHeader>
                <CardTitle>Inbox</CardTitle>
                <CardDescription>
                    Here are the messages submitted through your contact form.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>From</TableHead>
                            <TableHead>Subject</TableHead>
                            <TableHead>Received</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {messages.length > 0 ? (
                            messages.map(msg => (
                                <TableRow key={msg.id}>
                                    <TableCell>
                                        <div className="font-medium">{msg.name}</div>
                                        <div className="text-sm text-muted-foreground">{msg.email}</div>
                                    </TableCell>
                                    <TableCell>
                                        <p className="font-medium">{msg.subject || '(No Subject)'}</p>
                                        <p className="text-sm text-muted-foreground truncate max-w-xs">{msg.message}</p>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {msg.createdAt ? formatDistanceToNow(msg.createdAt.toDate(), { addSuffix: true }) : ''}
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={3} className="h-24 text-center">
                                    No messages yet.
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
