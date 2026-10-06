'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export function DemoBanner() {
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <div className={cn(
      "fixed top-0 left-0 right-0 z-40 flex items-center justify-center gap-2 bg-yellow-400 px-4 py-1.5 text-xs font-bold text-yellow-900 shadow-sm",
    )}>
      <AlertTriangle className="h-3.5 w-3.5" />
      <span>DEMO — synthetic data</span>
    </div>
  );
}
