import Link from "next/link";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="bg-card border-t">
      <div className="container mx-auto px-4 md:px-8 lg:px-16 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
             <Link href="/" className="flex items-center space-x-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="200" height="30" viewBox="0 0 400 80">
                    <text x="10" y="60" fontFamily="Poppins, sans-serif" fontSize="60" fontWeight="800" fill="url(#logo-gradient-footer)">
                        Eleven Docs
                    </text>
                    <defs>
                        <linearGradient id="logo-gradient-footer" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" style={{stopColor: 'hsl(var(--primary))'}} />
                            <stop offset="100%" style={{stopColor: 'hsl(220 13% 61%)'}} />
                        </linearGradient>
                    </defs>
                </svg>
            </Link>
            <p className="text-muted-foreground text-sm mt-4">
                A curated marketplace for high-quality digital assets for designers and developers.
            </p>
          </div>
           <div className="flex flex-col gap-2">
              <h4 className="font-semibold mb-2">Quick Links</h4>
              <Link href="/" className="text-sm text-muted-foreground hover:text-primary">Home</Link>
              <Link href="/products" className="text-sm text-muted-foreground hover:text-primary">Library</Link>
              <Link href="/#for-you" className="text-sm text-muted-foreground hover:text-primary">For You</Link>
           </div>
           <div className="flex flex-col gap-2">
                <h4 className="font-semibold mb-2">Company</h4>
                <Link href="/#contact" className="text-sm text-muted-foreground hover:text-primary">Contact Us</Link>
                <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-primary">Dashboard</Link>
           </div>
            <div className="flex flex-col gap-2">
                <h4 className="font-semibold mb-2">Legal</h4>
                <Link href="/terms-of-service" className="text-sm text-muted-foreground hover:text-primary">Terms of Service</Link>
                <Link href="/privacy-policy" className="text-sm text-muted-foreground hover:text-primary">Privacy Policy</Link>
            </div>
        </div>
        <div className="mt-8 border-t pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
             <p className="text-center text-sm leading-loose md:text-left text-muted-foreground">
                &copy; {new Date().getFullYear()} Eleven Docs. All Rights Reserved.
            </p>
        </div>
      </div>
    </footer>
  );
}
