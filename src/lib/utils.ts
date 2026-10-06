import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind classes safely.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Convert paise to formatted Indian Rupee string (₹).
 */
export function formatCurrency(paise: number): string {
  const rupees = paise / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(rupees);
}

/**
 * Alias for formatCurrency. Convert paise to formatted Indian Rupee string (₹).
 */
export function formatPaise(paise: number): string {
  return formatCurrency(paise);
}

/**
 * Parse rupees (number or string) to paise (integer).
 */
export function parsePaise(rupees: number | string): number {
  const num = typeof rupees === 'string' ? parseFloat(rupees) : rupees;
  if (isNaN(num)) return 0;
  return Math.round(num * 100);
}

/**
 * Format a Date for display in Asia/Kolkata timezone (Date only).
 */
export function formatDate(date: Date | string | number): string {
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
}

/**
 * Format a Date for display in Asia/Kolkata timezone (Date and Time).
 */
export function formatDateTime(date: Date | string | number): string {
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

/**
 * Format relative time (e.g. '5 min ago', 'just now').
 */
export function formatRelativeTime(date: Date | string | number): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  
  return formatDate(then);
}

/**
 * Generate a sequential Unique Health ID (UHID).
 * @param prefix e.g., 'P'
 * @param seq the sequential number
 */
export function generateUHID(prefix: string, seq: number): string {
  return `${prefix}${String(seq).padStart(5, '0')}`;
}

/**
 * Generate a unique Visit Number based on timestamp.
 */
export function generateVisitNo(): string {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  
  // Use milliseconds and a small random string to ensure uniqueness
  const ms = String(now.getMilliseconds()).padStart(3, '0');
  const randomStr = Math.random().toString(36).substring(2, 4).toUpperCase();
  
  return `VN${yy}${mm}${dd}${ms}${randomStr}`;
}

/**
 * Utility for pausing execution.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
