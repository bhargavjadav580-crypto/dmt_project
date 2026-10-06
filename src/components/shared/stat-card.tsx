import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon, ArrowUpRight, ArrowDownRight, Minus, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: number | string;
  trend?: {
    direction: 'up' | 'down' | 'flat';
    label: string;
  };
  actionLabel?: string;
  actionHref?: string;
  variant?: 'default' | 'warning' | 'danger' | 'success' | 'indigo' | 'purple';
  className?: string;
}

export function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  trend, 
  actionLabel, 
  actionHref, 
  variant = 'default',
  className 
}: StatCardProps) {
  
  const variantConfig = {
    default: {
      card: 'bg-gradient-to-br from-white via-sky-50/20 to-sky-50/50 border-sky-100/80 hover:border-sky-300',
      iconBox: 'bg-sky-500 text-white shadow-md shadow-sky-500/25',
      footer: 'bg-sky-50/50 border-sky-100/80 text-sky-700',
      value: 'text-slate-900',
    },
    warning: {
      card: 'bg-gradient-to-br from-white via-amber-50/20 to-amber-50/50 border-amber-100/80 hover:border-amber-300',
      iconBox: 'bg-amber-500 text-white shadow-md shadow-amber-500/25',
      footer: 'bg-amber-50/50 border-amber-100/80 text-amber-700',
      value: 'text-amber-950',
    },
    danger: {
      card: 'bg-gradient-to-br from-white via-red-50/30 to-red-50/60 border-red-200/80 hover:border-red-300',
      iconBox: 'bg-red-500 text-white shadow-md shadow-red-500/25 animate-pulse',
      footer: 'bg-red-50/50 border-red-100/80 text-red-700',
      value: 'text-red-950',
    },
    success: {
      card: 'bg-gradient-to-br from-white via-emerald-50/20 to-emerald-50/50 border-emerald-100/80 hover:border-emerald-300',
      iconBox: 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25',
      footer: 'bg-emerald-50/50 border-emerald-100/80 text-emerald-700',
      value: 'text-emerald-950',
    },
    indigo: {
      card: 'bg-gradient-to-br from-white via-indigo-50/20 to-indigo-50/50 border-indigo-100/80 hover:border-indigo-300',
      iconBox: 'bg-indigo-500 text-white shadow-md shadow-indigo-500/25',
      footer: 'bg-indigo-50/50 border-indigo-100/80 text-indigo-700',
      value: 'text-indigo-950',
    },
    purple: {
      card: 'bg-gradient-to-br from-white via-purple-50/20 to-purple-50/50 border-purple-100/80 hover:border-purple-300',
      iconBox: 'bg-purple-500 text-white shadow-md shadow-purple-500/25',
      footer: 'bg-purple-50/50 border-purple-100/80 text-purple-700',
      value: 'text-purple-950',
    },
  };

  const currentVariant = variantConfig[variant] || variantConfig.default;

  const trendIcon = {
    up: ArrowUpRight,
    down: ArrowDownRight,
    flat: Minus
  };

  const TrendIcon = trend ? trendIcon[trend.direction] : null;

  return (
    <Card className={cn(
      "overflow-hidden flex flex-col card-hover-lift shadow-sm transition-all duration-200 border", 
      currentVariant.card,
      className
    )}>
      <CardContent className="p-5 flex-1">
        <div className="flex items-center justify-between mb-3.5">
          <div className={cn("p-2.5 rounded-xl flex items-center justify-center", currentVariant.iconBox)}>
            <Icon className="w-5 h-5" />
          </div>
          {trend && TrendIcon && (
            <div className={cn(
              "flex items-center text-xs font-semibold px-2 py-0.5 rounded-full border",
              trend.direction === 'up' && variant !== 'success' ? 'bg-amber-50 text-amber-700 border-amber-200' : '',
              trend.direction === 'down' && variant === 'danger' ? 'bg-green-50 text-green-700 border-green-200' : '',
              trend.direction === 'up' && variant === 'success' ? 'bg-green-50 text-green-700 border-green-200' : '',
              trend.direction === 'down' && variant === 'success' ? 'bg-amber-50 text-amber-700 border-amber-200' : '',
              trend.direction === 'flat' ? 'bg-gray-50 text-gray-700 border-gray-200' : '',
            )}>
              <TrendIcon className="w-3 h-3 mr-1" />
              {trend.label}
            </div>
          )}
        </div>
        
        <div className="flex flex-col gap-1">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
          <div className={cn("text-3xl sm:text-4xl font-black tracking-tight", currentVariant.value)}>
            {value}
          </div>
        </div>
      </CardContent>
      
      {actionLabel && actionHref && (
        <div className={cn("border-t px-5 py-2.5 transition-colors", currentVariant.footer)}>
          <Link 
            href={actionHref} 
            className="inline-flex items-center text-xs font-bold hover:underline gap-1"
          >
            <span>{actionLabel}</span>
            <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      )}
    </Card>
  );
}
