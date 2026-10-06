'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface TokenDisplayProps {
  department: string;
  tokenNumber: string;
  patientName: string;
  roomNumber?: string;
  className?: string;
}

export function TokenDisplay({
  department,
  tokenNumber,
  patientName,
  roomNumber,
  className
}: TokenDisplayProps) {
  return (
    <Card className={cn("overflow-hidden border-2 border-primary/20 bg-primary/5", className)}>
      <CardContent className="p-6 sm:p-8 flex flex-col items-center justify-center text-center">
        <h2 className="text-sm sm:text-base font-semibold text-primary uppercase tracking-widest mb-4">
          Now Serving • {department}
        </h2>
        
        <motion.div
          key={tokenNumber}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="bg-background px-8 py-4 rounded-2xl shadow-sm border mb-6 w-full max-w-sm"
        >
          <span className="text-6xl sm:text-7xl md:text-8xl font-black text-foreground tracking-tighter">
            {tokenNumber}
          </span>
        </motion.div>
        
        <h3 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
          {patientName}
        </h3>
        
        {roomNumber && (
          <p className="text-lg text-muted-foreground font-medium flex items-center gap-2">
            Please proceed to <span className="text-foreground font-bold px-2 py-1 bg-muted rounded-md border">Room {roomNumber}</span>
          </p>
        )}
      </CardContent>
    </Card>
  );
}
