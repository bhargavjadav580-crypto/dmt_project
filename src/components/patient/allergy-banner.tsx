'use client';

import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

interface AllergyBannerProps {
  allergies: string[];
  requireAcknowledge?: boolean;
  onAcknowledge?: (acknowledged: boolean) => void;
  className?: string;
}

export function AllergyBanner({ allergies, requireAcknowledge = false, onAcknowledge, className }: AllergyBannerProps) {
  const [acknowledged, setAcknowledged] = useState(false);

  if (!allergies || allergies.length === 0) return null;

  const handleAcknowledge = (checked: boolean | 'indeterminate') => {
    const isChecked = checked === true;
    setAcknowledged(isChecked);
    onAcknowledge?.(isChecked);
  };

  return (
    <div className={cn("rounded-lg border-2 border-red-200 bg-red-50 p-4 text-red-900 shadow-sm", className)}>
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
        <div className="flex-1">
          <h4 className="font-semibold text-red-800 flex items-center gap-2">
            ALLERGY WARNING
          </h4>
          <div className="mt-1 text-sm text-red-700">
            Patient has known allergies to:{' '}
            <span className="font-bold">{allergies.join(', ')}</span>
          </div>
          
          {requireAcknowledge && (
            <div className="mt-4 flex items-center space-x-2 bg-white/50 p-2 rounded border border-red-200">
              <Checkbox 
                id="allergy-acknowledge" 
                checked={acknowledged} 
                onCheckedChange={handleAcknowledge}
                className="border-red-500 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
              />
              <label
                htmlFor="allergy-acknowledge"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-red-900 cursor-pointer"
              >
                I have checked these allergies before proceeding
              </label>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
