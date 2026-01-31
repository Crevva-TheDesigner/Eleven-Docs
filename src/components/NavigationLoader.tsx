'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { useGlobalLoading } from '@/hooks/use-global-loading';

export function NavigationLoader() {
    const pathname = usePathname();
    const { showGlobalLoader, hideGlobalLoader } = useGlobalLoading();
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        // Cleanup on new page: hide loader and clear any pending timeout
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        hideGlobalLoader();
    }, [pathname, hideGlobalLoader]);

    useEffect(() => {
        const startLoadingTimeout = () => {
            // Clear any existing timeout
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            timeoutRef.current = setTimeout(() => {
                showGlobalLoader();
            }, 500); // 500ms delay
        };

        const handleLinkClick = (e: MouseEvent) => {
            // If the default action was prevented by another script (e.g. Add to Cart), do nothing.
            if (e.defaultPrevented) {
                return;
            }

            const target = e.target as HTMLElement;
            const link = target.closest('a');

            if (link && link.href) {
                const currentUrl = new URL(window.location.href);
                const targetUrl = new URL(link.href, window.location.origin);

                // Check for internal navigation to a different path
                if (targetUrl.origin === currentUrl.origin && targetUrl.pathname !== currentUrl.pathname) {
                    // Check if it's a download link or opens in a new tab
                    if (link.hasAttribute('download') || link.target === '_blank') {
                        return;
                    }
                    startLoadingTimeout();
                }
            }
        };

        const handlePopState = () => {
            startLoadingTimeout();
        };

        document.addEventListener('click', handleLinkClick);
        window.addEventListener('popstate', handlePopState);

        return () => {
            document.removeEventListener('click', handleLinkClick);
            window.removeEventListener('popstate', handlePopState);
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [showGlobalLoader]);

    return null; // This component does not render anything
}
