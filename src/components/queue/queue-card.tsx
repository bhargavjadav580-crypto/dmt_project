'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Phone, SkipForward, RotateCcw, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface QueueCardProps {
  tokenNumber: string;
  patientName: string;
  ageYears: number;
  gender: string;
  priority: 'NORMAL' | 'HIGH' | 'EMERGENCY';
  waitTimeMin: number;
  status: 'WAITING' | 'IN_CONSULTATION' | 'SKIPPED';
  onCall?: () => void;
  onSkip?: () => void;
  onRecall?: () => void;
  onComplete?: () => void;
  className?: string;
}

export function QueueCard({
  tokenNumber,
  patientName,
  ageYears,
  gender,
  priority,
  waitTimeMin,
  status,
  onCall,
  onSkip,
  onRecall,
  onComplete,
  className
}: QueueCardProps) {
  
  const priorityColors = {
    NORMAL: 'bg-blue-100 text-blue-800 border-blue-200',
    HIGH: 'bg-amber-100 text-amber-800 border-amber-200',
    EMERGENCY: 'bg-red-100 text-red-800 border-red-200'
  };

  const waitTimeColor = waitTimeMin > 60 ? 'text-red-600' : waitTimeMin > 30 ? 'text-amber-600' : 'text-muted-foreground';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      <Card className={cn(
        "overflow-hidden card-hover-lift transition-all",
        status === 'IN_CONSULTATION' ? 'border-primary ring-1 ring-primary/20 shadow-md' : '',
        status === 'SKIPPED' ? 'opacity-70 bg-muted/50' : '',
        className
      )}>
        <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          
          <div className="flex items-center gap-4 flex-1">
            <div className={cn(
              "flex flex-col items-center justify-center rounded-lg p-2 min-w-20",
              status === 'IN_CONSULTATION' ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            )}>
              <span className="text-[10px] uppercase font-bold tracking-widest opacity-80">Token</span>
              <span className="text-2xl font-bold leading-none mt-1">{tokenNumber}</span>
            </div>
            
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-lg leading-none">{patientName}</h3>
                {priority !== 'NORMAL' && (
                  <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 h-4", priorityColors[priority])}>
                    {priority}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{ageYears}y • {gender}</span>
                <span className="text-xs">•</span>
                <span className={cn("flex items-center gap-1 text-xs font-medium", waitTimeColor)}>
                  <Clock className="h-3 w-3" />
                  {waitTimeMin}m wait
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-0">
            {status === 'WAITING' && (
              <>
                {onCall && (
                  <Button size="sm" onClick={onCall} className="gap-1.5 flex-1 sm:flex-none">
                    <Phone className="h-4 w-4" />
                    Call
                  </Button>
                )}
                {onSkip && (
                  <Button size="sm" variant="outline" onClick={onSkip} className="gap-1.5 text-muted-foreground">
                    <SkipForward className="h-4 w-4" />
                    Skip
                  </Button>
                )}
              </>
            )}

            {status === 'SKIPPED' && onRecall && (
              <Button size="sm" variant="outline" onClick={onRecall} className="gap-1.5 w-full sm:w-auto">
                <RotateCcw className="h-4 w-4" />
                Recall
              </Button>
            )}

            {status === 'IN_CONSULTATION' && onComplete && (
              <Button size="sm" variant="default" onClick={onComplete} className="gap-1.5 bg-green-600 hover:bg-green-700 w-full sm:w-auto">
                <CheckCircle2 className="h-4 w-4" />
                Complete
              </Button>
            )}
          </div>
          
        </CardContent>
      </Card>
    </motion.div>
  );
}
