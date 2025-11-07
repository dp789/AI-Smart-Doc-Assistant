import { useEffect, useRef } from 'react';
import { useMsal } from '@azure/msal-react';

/**
 * ProductionRedirectHandler - Handles post-authentication redirects in production
 * FIXED: Removed infinite loop causing emergency fallback and periodic checks
 */
const ProductionRedirectHandler = () => {
  const { accounts, inProgress } = useMsal();
  const hasRedirected = useRef(false); // Prevent multiple redirects

  useEffect(() => {
    // Only handle production environments
    const isProduction = window.location.hostname !== 'localhost';
    if (!isProduction) return;
    
    // If already redirected, don't do it again
    if (hasRedirected.current) {
      console.log("ProductionRedirectHandler: Already redirected, skipping");
      return;
    }

    // Check if we're authenticated but on the wrong page
    const handleProductionRedirect = () => {
      const currentPath = window.location.pathname;
      const isAuthenticated = accounts.length > 0;
      const bypassMode = sessionStorage.getItem('bypass_auth') === 'true';
      
      console.log("ProductionRedirectHandler check:", {
        isAuthenticated,
        bypassMode,
        currentPath,
        inProgress,
        hostname: window.location.hostname,
        hasRedirected: hasRedirected.current
      });

      // Only redirect if:
      // 1. User is authenticated OR in bypass mode
      // 2. MSAL is not busy
      // 3. Currently on login or root page
      // 4. Haven't redirected already
      if ((isAuthenticated || bypassMode) && inProgress === 'none' && !hasRedirected.current) {
        if (currentPath === '/login' || currentPath === '/' || currentPath === '') {
          console.log("Production redirect: Redirecting authenticated user to /documents");
          hasRedirected.current = true; // Mark as redirected
          
          // Single redirect with delay
          setTimeout(() => {
            window.location.href = '/documents';
          }, 500);
        }
      }
    };

    // Single check with a small delay to let MSAL initialize
    const redirectTimer = setTimeout(() => {
      handleProductionRedirect();
    }, 1000);

    return () => {
      clearTimeout(redirectTimer);
    };
  }, [accounts, inProgress]);

  // This component doesn't render anything
  return null;
};

export default ProductionRedirectHandler;
