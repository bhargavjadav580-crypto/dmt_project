import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { AlertCircle } from 'lucide-react';

interface Patient {
  name: string;
  ageYears: number;
  gender: string;
  uhid: string;
  allergies: string[];
}

interface PatientIdentityBarProps {
  patient: Patient;
  tokenNumber?: string;
  className?: string;
}

export function PatientIdentityBar({ patient, tokenNumber, className }: PatientIdentityBarProps) {
  const hasAllergies = patient.allergies && patient.allergies.length > 0;

  return (
    <div className={cn("sticky top-0 z-20 flex flex-wrap items-center justify-between gap-4 border-b bg-background px-4 py-3 shadow-sm", className)}>
      <div className="flex items-center gap-4 flex-wrap">
        <div>
          <h2 className="text-[18px] font-bold leading-none tracking-tight">{patient.name}</h2>
          <div className="mt-1 flex items-center text-sm text-muted-foreground">
            <span>{patient.ageYears}y • {patient.gender}</span>
          </div>
        </div>
        
        <div className="h-8 w-px bg-border hidden sm:block"></div>
        
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="text-sm px-2 py-0.5 font-mono">
            UHID: {patient.uhid}
          </Badge>
          
          {hasAllergies && (
            <Badge variant="danger" className="flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Allergies
            </Badge>
          )}
        </div>
      </div>

      {tokenNumber && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground uppercase tracking-wider font-medium">Token</span>
          <Badge className="text-lg px-3 py-1 font-bold bg-primary text-primary-foreground">
            {tokenNumber}
          </Badge>
        </div>
      )}
    </div>
  );
}
