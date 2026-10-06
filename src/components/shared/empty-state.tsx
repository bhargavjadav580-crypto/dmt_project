import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  className
}: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center p-8 text-center min-h-[300px] w-full rounded-lg border-2 border-dashed bg-muted/30", className)}>
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4 text-muted-foreground">
        <Icon className="h-8 w-8" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-sm mb-6">{description}</p>
      )}
      
      {actionLabel && (
        actionHref ? (
          <Button asChild variant="outline">
            <Link href={actionHref}>{actionLabel}</Link>
          </Button>
        ) : onAction ? (
          <Button variant="outline" onClick={onAction}>{actionLabel}</Button>
        ) : null
      )}
    </div>
  );
}
