'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { verifyResetCode, handlePasswordReset } from '@/firebase/auth/auth';
import { auth } from '@/firebase/client';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

type PageState = 'verifying' | 'form' | 'success' | 'error';

export default function ResetPasswordClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [pageState, setPageState] = useState<PageState>('verifying');
  const [oobCode, setOobCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);


  useEffect(() => {
    const code = searchParams.get('oobCode');
    if (!code) {
      setError('No reset code provided. Please request a new password reset link.');
      setPageState('error');
      return;
    }
    
    setOobCode(code);

    verifyResetCode(auth, code)
      .then(() => {
        setPageState('form');
      })
      .catch((err: any) => {
        setError(err.message || 'Invalid or expired link. Please try resetting your password again.');
        setPageState('error');
      });
  }, [searchParams]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ variant: 'destructive', title: 'Passwords do not match' });
      return;
    }
    if (password.length < 6) {
        toast({ variant: 'destructive', title: 'Password is too short', description: 'Password must be at least 6 characters long.' });
        return;
    }
    if (!oobCode) return;

    setIsLoading(true);
    try {
      await handlePasswordReset(auth, oobCode, password);
      setPageState('success');
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const renderContent = () => {
    switch (pageState) {
        case 'verifying':
            return <div className="flex flex-col items-center gap-4"><Loader2 className="h-8 w-8 animate-spin" /><p>Verifying link...</p></div>;
        
        case 'error':
            return (
                <Alert variant="destructive">
                    <AlertTitle>Invalid Link</AlertTitle>
                    <AlertDescription>
                        <p>{error}</p>
                        <Button asChild variant="link" className="p-0 mt-2">
                            <Link href="/forgot-password">Request a new link</Link>
                        </Button>
                    </AlertDescription>
                </Alert>
            );

        case 'success':
            return (
                <Alert>
                    <AlertTitle>Password Reset Successfully!</AlertTitle>
                    <AlertDescription>
                        <p>You can now log in with your new password.</p>
                        <Button asChild variant="link" className="p-0 mt-2">
                            <Link href="/login">Proceed to Login</Link>
                        </Button>
                    </AlertDescription>
                </Alert>
            );

        case 'form':
            return (
                <form onSubmit={handleFormSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="password">New Password</Label>
                        <Input
                            id="password"
                            type="password"
                            required
                            minLength={6}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="rounded-full"
                        />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="confirm-password">Confirm New Password</Label>
                        <Input
                            id="confirm-password"
                            type="password"
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="rounded-full"
                        />
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? <Loader2 className="animate-spin" /> : 'Reset Password'}
                    </Button>
                </form>
            );
    }
  };

  return (
    <div className="container mx-auto flex min-h-[calc(100vh-14rem)] items-center justify-center px-4 py-8 md:py-12">
        <Card className="w-full max-w-md">
            <CardHeader>
                <CardTitle>Reset Your Password</CardTitle>
                {pageState === 'form' && <CardDescription>Enter your new password below.</CardDescription>}
            </CardHeader>
            <CardContent>
                {renderContent()}
            </CardContent>
        </Card>
    </div>
  );
}
