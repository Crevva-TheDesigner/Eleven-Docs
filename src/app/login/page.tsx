import { Suspense } from 'react';
import LoginClient from './LoginClient';
import { Loader2 } from 'lucide-react';

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex h-[calc(100vh-14rem)] w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    }>
      <LoginClient />
    </Suspense>
  );
}
