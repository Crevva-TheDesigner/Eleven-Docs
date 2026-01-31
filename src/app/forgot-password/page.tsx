'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { sendPasswordReset } from '@/firebase/auth/auth';
import { auth } from '@/firebase/client';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSent, setIsSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await sendPasswordReset(auth, email);
      setIsSent(true);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
      <div className="container mx-auto flex min-h-[calc(100vh-14rem)] items-center justify-center px-4 py-8 md:py-12">
          <Card className="w-full max-w-md">
              <CardHeader>
                  <CardTitle>Forgot Password</CardTitle>
                  <CardDescription>Enter your email address and we'll send you a link to reset your password.</CardDescription>
              </CardHeader>
              <CardContent>
                  {isSent ? (
                      <Alert variant="default">
                          <AlertTitle>Check your email</AlertTitle>
                          <AlertDescription>
                              <p>A password reset link has been sent to your email address. Please check your inbox (and spam folder).</p>
                              <Button asChild variant="link" className="p-0 mt-2">
                                  <Link href="/login">Back to Login</Link>
                              </Button>
                          </AlertDescription>
                      </Alert>
                  ) : (
                      <form onSubmit={handleResetPassword} className="space-y-4">
                          <div className="space-y-2">
                              <Label htmlFor="email">Email</Label>
                              <Input
                                  id="email"
                                  type="email"
                                  placeholder="m@example.com"
                                  required
                                  value={email}
                                  onChange={(e) => setEmail(e.target.value)}
                                  className="rounded-full"
                              />
                          </div>
                          <Button type="submit" className="w-full" disabled={isLoading}>
                              {isLoading ? <Loader2 className="animate-spin" /> : 'Send Reset Email'}
                          </Button>
                      </form>
                  )}
              </CardContent>
          </Card>
      </div>
  );
}
