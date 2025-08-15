// SSR-safe utilities to prevent window/document errors

export const isClient = typeof window !== 'undefined';
export const isServer = typeof window === 'undefined';

// Safe way to access window properties
export const safeWindow = {
  get location() {
    return isClient ? window.location : null;
  },
  get navigator() {
    return isClient ? window.navigator : null;
  },
  get localStorage() {
    return isClient ? window.localStorage : null;
  },
  get sessionStorage() {
    return isClient ? window.sessionStorage : null;
  },
  get document() {
    return isClient ? window.document : null;
  }
};

// Safe way to access document properties
export const safeDocument = {
  get cookie() {
    return isClient ? document.cookie : '';
  },
  get title() {
    return isClient ? document.title : '';
  },
  get referrer() {
    return isClient ? document.referrer : '';
  }
};

// Utility to run code only on client-side
export const runOnClient = (callback: () => void) => {
  if (isClient) {
    callback();
  }
};

// Utility to run code only on server-side
export const runOnServer = (callback: () => void) => {
  if (isServer) {
    callback();
  }
};

// Safe redirect function
export const safeRedirect = (url: string) => {
  if (isClient) {
    window.location.href = url;
  }
};

// Safe reload function
export const safeReload = () => {
  if (isClient) {
    window.location.reload();
  }
};

// Hook for checking if component has mounted (client-side)
import { useEffect, useState } from 'react';

export const useClientMounted = () => {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  return mounted;
};

// Component wrapper for client-only rendering
import React from 'react';

interface ClientOnlyProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const ClientOnly: React.FC<ClientOnlyProps> = ({ 
  children, 
  fallback = null 
}) => {
  const mounted = useClientMounted();
  
  if (!mounted) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
};
