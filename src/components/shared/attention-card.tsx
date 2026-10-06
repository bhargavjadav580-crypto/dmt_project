import React from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LucideIcon, AlertTriangle, AlertCircle, Info, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface AttentionCardProps {
  patientName: string;
  uhid: string;
  tokenNumber: string;
  message: string;
  actionLabel: string;
  actionHref: string;
  variant: 'warning' | 'danger' | 'info';
  icon?: LucideIcon;
  className?: string;
}

export function AttentionCard({
  patientName,
  uhid,
  tokenNumber,
  message,
  actionLabel,
  actionHref,
  variant,
  icon,
  className
}: AttentionCardProps) {
  const variantConfig = {
    warning: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      iconColor: 'text-amber-600',
      defaultIcon: AlertTriangle,
      btnVariant: 'default' as const
    },
    danger: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      iconColor: 'text-red-600',
      defaultIcon: AlertCircle,
      btnVariant: 'destructive' as const
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      iconColor: 'text-blue-600',
      defaultIcon: Info,
      btnVariant: 'default' as const
    }
  };

  const config = variantConfig[variant];
  const Icon = icon || config.defaultIcon;

  return (
    <Card className={cn("overflow-hidden border card-hover-lift shadow-xs", config.bg, config.border, className)}>
      <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row gap-4 sm:items-center">
        <div className={cn("p-2.5 rounded-full shrink-0 self-start sm:self-center bg-white shadow-sm", config.iconColor)}>
          <Icon className="w-5 h-5" />
        </div>
        
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-semibold text-foreground">{patientName}</h4>
            <span className="text-xs font-mono text-muted-foreground bg-white/60 px-1.5 py-0.5 rounded border border-black/5">
              {uhid}
            </span>
            <span className="text-xs font-bold text-foreground bg-white px-2 py-0.5 rounded-full border shadow-sm">
              T-{tokenNumber}
            </span>
          </div>
          <p className="text-sm text-foreground/80 leading-snug">{message}</p>
        </div>

        <div className="shrink-0 mt-2 sm:mt-0">
          <Button asChild size="sm" variant={config.btnVariant === 'destructive' ? 'danger' : 'default'} className="w-full sm:w-auto">
            <Link href={actionHref}>
              {actionLabel}
              <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
