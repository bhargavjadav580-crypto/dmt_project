'use client';

import React, { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ConnectionBanner() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Initial state
    setIsOnline(typeof navigator !== 'undefined' ? navigator.onLine : true);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className={cn(
      "fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-2 bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-md transition-all",
    )}>
      <WifiOff className="h-4 w-4" />
      <span>Connection lost. Changes are not saved yet.</span>
    </div>
  );
}
