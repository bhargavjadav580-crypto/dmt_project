import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared/status-badge';
import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';

interface Patient {
  name: string;
  ageYears: number;
  gender: string;
  uhid: string;
}

interface PatientCardProps {
  patient: Patient;
  status: string;
  tokenNumber?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function PatientCard({ patient, status, tokenNumber, actionLabel, onAction, className }: PatientCardProps) {
  return (
    <Card className={cn("overflow-hidden transition-all hover:shadow-md", className)}>
      <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-4">
          {tokenNumber && (
            <div className="flex flex-col items-center justify-center bg-muted rounded-md p-2 min-w-16">
              <span className="text-xs text-muted-foreground uppercase font-semibold">Token</span>
              <span className="text-lg font-bold">{tokenNumber}</span>
            </div>
          )}
          
          <div className="flex flex-col gap-1">
            <h3 className="font-semibold text-base leading-none">{patient.name}</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{patient.ageYears}y • {patient.gender}</span>
              <span className="text-xs">•</span>
              <span className="font-mono text-xs">{patient.uhid}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto mt-2 sm:mt-0">
          <StatusBadge status={status} />
          
          {actionLabel && onAction && (
            <Button size="sm" onClick={onAction} className="shrink-0 gap-1">
              {actionLabel}
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
