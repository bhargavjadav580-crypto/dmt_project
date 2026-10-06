import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Clock,
  CheckCircle,
  Stethoscope,
  FlaskConical,
  Eye,
  Pill,
  ArrowRight,
  BedDouble,
  CreditCard,
  CheckCircle2,
  XCircle,
  Check,
  User,
  Sparkles,
  Wrench,
  LucideIcon
} from 'lucide-react';

export type StatusType =
  | 'REGISTERED' | 'BOOKED' | 'CHECKED_IN' | 'WAITING'
  | 'IN_CONSULTATION' | 'INVESTIGATIONS_PENDING' | 'REVIEW_PENDING'
  | 'PHARMACY_PENDING' | 'REFERRED' | 'ADMISSION_PENDING'
  | 'ADMITTED' | 'BILLING_PENDING' | 'READY_FOR_DISCHARGE'
  | 'COMPLETED' | 'CANCELLED' | 'AVAILABLE' | 'OCCUPIED'
  | 'CLEANING' | 'MAINTENANCE';

interface StatusBadgeProps {
  status: StatusType | string;
  className?: string;
}

const statusConfig: Record<string, { icon: LucideIcon; label: string; colorClass: string }> = {
  REGISTERED: { icon: Clock, label: 'Registered', colorClass: 'bg-blue-100 text-blue-800 hover:bg-blue-100/80 border-blue-200' },
  BOOKED: { icon: Clock, label: 'Booked', colorClass: 'bg-blue-100 text-blue-800 hover:bg-blue-100/80 border-blue-200' },
  CHECKED_IN: { icon: CheckCircle, label: 'Checked In', colorClass: 'bg-blue-100 text-blue-800 hover:bg-blue-100/80 border-blue-200' },
  WAITING: { icon: Clock, label: 'Waiting', colorClass: 'bg-amber-100 text-amber-800 hover:bg-amber-100/80 border-amber-200' },
  IN_CONSULTATION: { icon: Stethoscope, label: 'In Consultation', colorClass: 'bg-blue-100 text-blue-800 hover:bg-blue-100/80 border-blue-200' },
  INVESTIGATIONS_PENDING: { icon: FlaskConical, label: 'Investigations Pending', colorClass: 'bg-amber-100 text-amber-800 hover:bg-amber-100/80 border-amber-200' },
  REVIEW_PENDING: { icon: Eye, label: 'Review Pending', colorClass: 'bg-amber-100 text-amber-800 hover:bg-amber-100/80 border-amber-200' },
  PHARMACY_PENDING: { icon: Pill, label: 'Pharmacy Pending', colorClass: 'bg-amber-100 text-amber-800 hover:bg-amber-100/80 border-amber-200' },
  REFERRED: { icon: ArrowRight, label: 'Referred', colorClass: 'bg-blue-100 text-blue-800 hover:bg-blue-100/80 border-blue-200' },
  ADMISSION_PENDING: { icon: BedDouble, label: 'Admission Pending', colorClass: 'bg-amber-100 text-amber-800 hover:bg-amber-100/80 border-amber-200' },
  ADMITTED: { icon: BedDouble, label: 'Admitted', colorClass: 'bg-blue-100 text-blue-800 hover:bg-blue-100/80 border-blue-200' },
  BILLING_PENDING: { icon: CreditCard, label: 'Billing Pending', colorClass: 'bg-amber-100 text-amber-800 hover:bg-amber-100/80 border-amber-200' },
  READY_FOR_DISCHARGE: { icon: CheckCircle2, label: 'Ready For Discharge', colorClass: 'bg-green-100 text-green-800 hover:bg-green-100/80 border-green-200' },
  COMPLETED: { icon: CheckCircle, label: 'Completed', colorClass: 'bg-green-100 text-green-800 hover:bg-green-100/80 border-green-200' },
  CANCELLED: { icon: XCircle, label: 'Cancelled', colorClass: 'bg-gray-100 text-gray-800 hover:bg-gray-100/80 border-gray-200' },
  AVAILABLE: { icon: Check, label: 'Available', colorClass: 'bg-green-100 text-green-800 hover:bg-green-100/80 border-green-200' },
  OCCUPIED: { icon: User, label: 'Occupied', colorClass: 'bg-red-100 text-red-800 hover:bg-red-100/80 border-red-200' },
  CLEANING: { icon: Sparkles, label: 'Cleaning', colorClass: 'bg-amber-100 text-amber-800 hover:bg-amber-100/80 border-amber-200' },
  MAINTENANCE: { icon: Wrench, label: 'Maintenance', colorClass: 'bg-gray-100 text-gray-800 hover:bg-gray-100/80 border-gray-200' },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status.toUpperCase()] || {
    icon: Clock,
    label: status,
    colorClass: 'bg-gray-100 text-gray-800 border-gray-200'
  };

  const Icon = config.icon;

  return (
    <Badge variant="outline" className={cn("flex w-fit items-center gap-1.5 px-2 py-0.5", config.colorClass, className)}>
      <Icon className="w-3.5 h-3.5" />
      <span className="font-medium capitalize">{config.label}</span>
    </Badge>
  );
}
