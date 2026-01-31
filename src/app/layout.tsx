import type { Metadata } from 'next'
import { Poppins } from 'next/font/google'
import './globals.css'

import { cn } from '@/lib/utils'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { Toaster } from '@/components/ui/toaster'
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener'
import { CartProvider } from '@/hooks/use-cart'
import { PageTransition } from '@/components/PageTransition'
import { ActiveSectionProvider } from '@/hooks/use-active-section'
import { FloatingBubbles } from '@/components/FloatingBubbles'
import { GlobalLoadingProvider } from '@/hooks/use-global-loading'
import { NavigationLoader } from '@/components/NavigationLoader'
import { CustomCursor } from '@/components/CustomCursor'
import { Analytics } from '@vercel/analytics/next'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-body',
})

export const metadata: Metadata = {
  title: 'Eleven Docs - Premium Digital Assets, Done Right',
  description:
    'Eleven Docs is a premium digital platform offering study material, coding programs, and psychology resources — designed for focused learning and real-world skills.',
  icons: {
    icon: '/icon.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className="dark"
      data-scroll-behavior="smooth"
    >
      <body
        className={cn(
          'min-h-screen bg-background font-body antialiased relative overflow-x-hidden',
          poppins.variable
        )}
      >
        <CartProvider>
          <ActiveSectionProvider>
            <GlobalLoadingProvider>

              {/* Cursor & background effects */}
              <CustomCursor />
              <FloatingBubbles /> {/* stays behind everything */}

              {/* Main App Shell */}
              <div className="relative z-10 flex min-h-screen flex-col">
                <Header /> {/* Header contains Dashboard, etc. */}

                <main className="flex-1">
                  <PageTransition>
                    {children}
                  </PageTransition>
                </main>

                <Footer />
              </div>

              {/* Global utilities */}
              <Toaster />
              <FirebaseErrorListener />
              <NavigationLoader />
              <Analytics />

            </GlobalLoadingProvider>
          </ActiveSectionProvider>
        </CartProvider>
      </body>
    </html>
  )
}
