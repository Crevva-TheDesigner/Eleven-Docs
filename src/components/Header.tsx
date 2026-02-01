'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Menu, LayoutDashboard, ShoppingCart, User as UserIcon, LogOut, LogIn, Sparkles } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useUser } from '@/firebase/auth/use-user';
import { auth } from '@/firebase/client';
import { signOutUser } from '@/firebase/auth/auth';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { useCart } from '@/hooks/use-cart';
import { Badge } from './ui/badge';
import { useActiveSection } from '@/hooks/use-active-section';


export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useUser();
  const { cartItems } = useCart();
  const { activeSection } = useActiveSection();
  const [isClient, setIsClient] = React.useState(false);

  const navRef = React.useRef<HTMLDivElement>(null);
  const [underlineStyle, setUnderlineStyle] = React.useState<{ left: number, width: number, opacity: number }>({ left: 0, width: 0, opacity: 0 });

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  const handleSignOut = async () => {
    await signOutUser(auth);
    router.push('/');
  };

  const navLinks = [
    ...(isClient && user ? [{ href: '/dashboard', label: 'Dashboard' }] : []),
    { href: '/#home', label: 'Home' },
    { href: '/#about', label: 'About' },
    { href: '/products', label: 'Library' },
    ...(isClient && user ? [{ href: '/#for-you', label: 'For You' }] : []),
    { href: '/ai-pdf-generator', label: 'AI PDF Creator', icon: Sparkles },
    { href: isClient ? '/#contact' : '/contact', label: 'Contact Us' },
  ];

  // Effect to set the position of the underline to the active link
  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
        if (navRef.current) {
            const activeLink = navRef.current.querySelector('[data-active="true"]') as HTMLElement;
            if (activeLink) {
                setUnderlineStyle({ 
                    left: activeLink.offsetLeft, 
                    width: activeLink.offsetWidth, 
                    opacity: 1 
                });
            } else {
                 setUnderlineStyle(s => ({ ...s, opacity: 0 }));
            }
        }
    }, 50); // small delay for DOM to be ready

    return () => clearTimeout(timeoutId);
  }, [activeSection, pathname, isClient, user, navLinks.length]); // re-run if navLinks change (login/logout)

  const handleMouseEnter = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (navRef.current) {
        setUnderlineStyle({
             left: e.currentTarget.offsetLeft,
             width: e.currentTarget.offsetWidth, 
             opacity: 1 
        });
    }
  };

  const handleMouseLeave = () => {
    if (navRef.current) {
      const activeLink = navRef.current.querySelector('[data-active="true"]') as HTMLElement;
      if (activeLink) {
        setUnderlineStyle({ 
            left: activeLink.offsetLeft, 
            width: activeLink.offsetWidth, 
            opacity: 1 
        });
      } else {
         setUnderlineStyle({ left: 0, width: 0, opacity: 0 });
      }
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center space-x-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="200" height="30" viewBox="0 0 400 80">
                <text x="10" y="60" fontFamily="Poppins, sans-serif" fontSize="60" fontWeight="800" fill="url(#logo-gradient)">
                    Eleven Docs
                </text>
                <defs>
                    <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{stopColor: 'hsl(var(--primary))'}} />
                    <stop offset="100%" style={{stopColor: 'hsl(220 13% 61%)'}} />
                    </linearGradient>
                </defs>
                </svg>
            </Link>
            <nav ref={navRef} onMouseLeave={handleMouseLeave} className="hidden md:flex items-center gap-6 text-sm font-medium relative">
                {navLinks.map((link) => {
                  if (!isClient && link.href.includes('for-you')) return null;

                  const isHashLink = link.href.includes('#');
                  let isActive = false;

                  if (pathname === '/') {
                    const sectionId = link.href.substring(link.href.indexOf('#') + 1);
                    if (activeSection === sectionId) {
                      isActive = true;
                    }
                    if (activeSection === 'featured-products' && link.href === '/products') {
                      isActive = true;
                    }
                    if ((activeSection === 'home' || activeSection === '') && link.href === '/#home') {
                      isActive = true;
                    }
                  } else {
                    if (!isHashLink) {
                      isActive = pathname.startsWith(link.href);
                    }
                  }
                  
                  return (
                    <Link
                        key={link.href}
                        href={isClient && link.href.includes('contact') ? '/#contact' : link.href}
                        scroll={isHashLink}
                        onMouseEnter={handleMouseEnter}
                        data-active={isActive}
                        className={cn(
                          'transition-colors hover:text-primary flex items-center gap-2 py-2',
                          isActive ? 'text-primary' : 'text-foreground/60'
                        )}
                    >
                        {link.icon && <link.icon className="h-4 w-4" />}
                        {link.label}
                    </Link>
                  );
                })}
                <div
                  className="absolute h-[2px] bg-primary transition-all duration-300 ease-in-out"
                  style={{ 
                    bottom: '0.25rem', // 4px distance from bottom of the nav link container
                    left: underlineStyle.left, 
                    width: underlineStyle.width, 
                    opacity: underlineStyle.opacity 
                  }}
                />
            </nav>
        </div>

        <div className="flex items-center gap-2">
            <nav className="hidden md:flex items-center space-x-2">
                <Button variant="ghost" size="icon" className="relative" asChild>
                    <Link href="/cart">
                        <ShoppingCart className="h-5 w-5" />
                        {isClient && cartItems.length > 0 && (
                            <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 justify-center p-0">{cartItems.length}</Badge>
                        )}
                        <span className="sr-only">Shopping Cart</span>
                    </Link>
                </Button>
                
                {loading ? (
                    <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
                ) : isClient && user ? (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                        <Avatar className="h-8 w-8 border border-foreground/40">
                       <AvatarImage src={user.photoURL || ''} alt={user.displayName || ''} />
                       <AvatarFallback>{(user.displayName || user.email || 'U').charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                        <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-medium leading-none">{user.displayName}</p>
                                <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                     <DropdownMenuItem asChild>
                        <Link href="/dashboard"><LayoutDashboard className="mr-2 h-4 w-4" /><span>Dashboard</span></Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <Link href="/profile"><UserIcon className="mr-2 h-4 w-4" /><span>Profile</span></Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}>
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Log out</span>
                    </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                ) : isClient ? (
                    <Button asChild>
                        <Link href="/login">Login</Link>
                    </Button>
                ) : <div className="h-10 w-20 rounded-lg bg-muted animate-pulse" />}
            </nav>

            {/* Mobile Menu */}
            <div className="flex items-center md:hidden">
                <Sheet>
                    <SheetTrigger asChild>
                    <Button variant="ghost" size="icon">
                        <Menu className="h-6 w-6" />
                        <span className="sr-only">Toggle Menu</span>
                    </Button>
                    </SheetTrigger>
                    <SheetContent side="left">
                      <SheetHeader>
                        <SheetTitle>Menu</SheetTitle>
                      </SheetHeader>
                      <Link href="/" className="flex items-center space-x-2 px-2 mb-6">
                          <svg xmlns="http://www.w3.org/2000/svg" width="200" height="30" viewBox="0 0 400 80">
                          <text x="10" y="60" fontFamily="Poppins, sans-serif" fontSize="60" fontWeight="800" fill="url(#logo-gradient-mobile)">
                              Eleven Docs
                          </text>
                          <defs>
                              <linearGradient id="logo-gradient-mobile" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" style={{stopColor: 'hsl(var(--primary))'}} />
                              <stop offset="100%" style={{stopColor: 'hsl(220 13% 61%)'}} />
                              </linearGradient>
                          </defs>
                          </svg>
                      </Link>
                      <div className="flex flex-col space-y-4">
                          <nav className="flex flex-col space-y-2">
                          {navLinks.map((link) => {
                              if (!isClient && link.href.includes('for-you')) return null;
                              
                              const isHashLink = link.href.includes('#');
                              let isActive = false;

                              if (pathname === '/') {
                                  const sectionId = link.href.substring(link.href.indexOf('#') + 1);
                                  if (activeSection === sectionId) {
                                    isActive = true;
                                  }
                                  if (activeSection === 'featured-products' && link.href === '/products') {
                                    isActive = true;
                                  }
                                  if ((activeSection === 'home' || activeSection === '') && link.href === '/#home') {
                                    isActive = true;
                                  }
                              } else {
                                  if (!isHashLink) {
                                      isActive = pathname.startsWith(link.href);
                                  }
                              }

                              return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    scroll={isHashLink}
                                    className={cn(
                                      'transition-colors hover:text-primary hover:bg-accent p-2 rounded-md flex items-center gap-2',
                                      isActive ? 'text-primary bg-accent' : 'text-foreground/60'
                                    )}
                                >
                                    {link.icon && <link.icon className="h-5 w-5" />}
                                    {link.label}
                                </Link>
                              );
                          })}
                          </nav>
                          <div className="flex flex-col space-y-2 pt-4 border-t">
                              <Button variant="ghost" className="w-full justify-start gap-2 relative" asChild>
                                  <Link href="/cart">
                                      <ShoppingCart className="h-5 w-5" />
                                      Shopping Cart
                                      {isClient && cartItems.length > 0 && (
                                          <Badge variant="destructive" className="absolute right-2 h-5 w-5 justify-center p-0">{cartItems.length}</Badge>
                                      )}
                                  </Link>
                              </Button>
                              {isClient && user ? (
                                  <>
                                  <Button variant="ghost" className="w-full justify-start gap-2" asChild>
                                      <Link href="/dashboard">
                                          <LayoutDashboard className="h-5 w-5" />
                                          Dashboard
                                      </Link>
                                  </Button>
                                  <Button variant="ghost" className="w-full justify-start gap-2" asChild>
                                      <Link href="/profile">
                                          <UserIcon className="h-5 w-5" />
                                          User Profile
                                      </Link>
                                  </Button>
                                  <Button variant="ghost" className="w-full justify-start gap-2" onClick={handleSignOut}>
                                      <LogOut className="h-5 w-5" />
                                      Sign Out
                                  </Button>
                                  </>
                              ) : isClient ? (
                                  <Button variant="ghost" className="w-full justify-start gap-2" asChild>
                                      <Link href="/login">
                                          <LogIn className="h-5 w-5" />
                                          Login
                                      </Link>
                                  </Button>
                              ) : null}
                          </div>
                      </div>
                    </SheetContent>
                </Sheet>
            </div>
        </div>
      </div>
    </header>
  );
}