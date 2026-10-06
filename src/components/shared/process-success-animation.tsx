'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Sparkles, Printer, ArrowRight, X, HeartPulse } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export interface ProcessSuccessAnimationProps {
  isOpen?: boolean;
  onClose?: () => void;
  title: string;
  subtitle: string;
  badgeText?: string;
  tokenNumber?: string;
  departmentName?: string;
  patientName?: string;
  uhid?: string;
  primaryActionLabel?: string;
  primaryActionHref?: string;
  onPrimaryAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  showPrint?: boolean;
  isInline?: boolean;
}

export function ProcessSuccessAnimation({
  isOpen = true,
  onClose,
  title,
  subtitle,
  badgeText = 'Step Completed',
  tokenNumber,
  departmentName,
  patientName,
  uhid,
  primaryActionLabel,
  primaryActionHref,
  onPrimaryAction,
  secondaryActionLabel,
  onSecondaryAction,
  showPrint = false,
  isInline = false,
}: ProcessSuccessAnimationProps) {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; color: string; size: number; delay: number }>>([]);

  useEffect(() => {
    // Generate gentle celebratory sparkles/particles
    const colors = ['#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'];
    const newParticles = Array.from({ length: 18 }).map((_, i) => ({
      id: i,
      x: (Math.random() - 0.5) * 260,
      y: (Math.random() - 0.5) * 240,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 8 + 4,
      delay: Math.random() * 0.2,
    }));
    setParticles(newParticles);
  }, [isOpen]);

  const content = (
    <motion.div
      initial={{ scale: 0.9, opacity: 0, y: 15 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.9, opacity: 0, y: 15 }}
      transition={{ type: 'spring', damping: 25, stiffness: 350 }}
      className={`relative overflow-hidden rounded-3xl bg-white border border-emerald-200/80 shadow-2xl p-6 sm:p-8 text-center max-w-xl sm:max-w-2xl w-full mx-auto ${
        isInline ? 'my-4' : ''
      }`}
    >
      {/* Background Soft Glow */}
      <div className="absolute -top-24 -left-24 w-60 h-60 bg-emerald-100/60 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-60 h-60 bg-sky-100/60 rounded-full blur-3xl pointer-events-none" />

      {/* Floating particles animation */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        {particles.map((p) => (
          <motion.div
            key={p.id}
            initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
            animate={{
              scale: [0, 1.2, 0],
              x: p.x,
              y: p.y,
              opacity: [1, 0.8, 0],
            }}
            transition={{ duration: 0.9, ease: 'easeOut', delay: p.delay }}
            style={{
              position: 'absolute',
              width: p.size,
              height: p.size,
              borderRadius: '50%',
              backgroundColor: p.color,
            }}
          />
        ))}
      </div>

      {/* Close button if modal */}
      {!isInline && onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-full transition"
        >
          <X className="h-5 w-5" />
        </button>
      )}

      {/* Animated Checkmark Circle */}
      <div className="relative mb-5 flex justify-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          className="h-20 w-20 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-xl shadow-emerald-500/25 ring-8 ring-emerald-50"
        >
          <motion.div
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 350, damping: 15, delay: 0.15 }}
          >
            <Check className="h-10 w-10 stroke-[3]" />
          </motion.div>
        </motion.div>

        {/* Small floating sparkles */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          className="absolute -top-2 right-1/3 text-amber-400"
        >
          <Sparkles className="h-5 w-5" />
        </motion.div>
      </div>

      {/* Badge & Title */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-1.5"
      >
        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300 font-semibold px-3 py-1 text-xs uppercase tracking-wider">
          <HeartPulse className="h-3.5 w-3.5 mr-1 inline text-emerald-600" />
          {badgeText}
        </Badge>
        <h3 className="text-2xl font-bold text-neutral-900 tracking-tight">{title}</h3>
        <p className="text-sm text-neutral-500 max-w-sm mx-auto">{subtitle}</p>
      </motion.div>

      {/* Patient / Token Info Card */}
      {(tokenNumber || patientName || uhid) && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="my-5 p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80 shadow-inner flex flex-col items-center justify-center"
        >
          {tokenNumber && (
            <div className="mb-2">
              <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest block">
                ASSIGNED TOKEN NUMBER
              </span>
              <span className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-primary-600 block my-1">
                {tokenNumber}
              </span>
              {departmentName && (
                <span className="text-xs font-semibold text-neutral-700 bg-white px-2.5 py-0.5 rounded-full border border-neutral-200">
                  {departmentName}
                </span>
              )}
            </div>
          )}

          {patientName && (
            <div className="text-xs text-neutral-600 font-medium mt-1">
              Patient: <span className="font-bold text-neutral-900">{patientName}</span>
              {uhid && <span className="text-neutral-400 ml-2">({uhid})</span>}
            </div>
          )}
        </motion.div>
      )}

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="flex flex-wrap items-center justify-center gap-3 pt-3 w-full"
      >
        {showPrint && (
          <Button
            variant="outline"
            size="lg"
            onClick={() => window.print()}
            className="h-12 px-5 text-sm font-semibold rounded-xl border-neutral-300 gap-2 hover:bg-neutral-50 shadow-xs"
          >
            <Printer className="h-4 w-4 text-neutral-600" />
            Print Slip
          </Button>
        )}

        {secondaryActionLabel && onSecondaryAction && (
          <Button
            variant="secondary"
            size="lg"
            onClick={onSecondaryAction}
            className="h-12 px-5 text-sm font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 shadow-xs"
          >
            {secondaryActionLabel}
          </Button>
        )}

        {primaryActionHref ? (
          <Link href={primaryActionHref} className="inline-block">
            <Button
              size="lg"
              className="h-12 px-6 text-sm font-semibold rounded-xl bg-sky-600 hover:bg-sky-700 text-white gap-2 shadow-lg shadow-sky-500/20"
            >
              {primaryActionLabel || 'Continue'}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        ) : primaryActionLabel && onPrimaryAction ? (
          <Button
            size="lg"
            onClick={onPrimaryAction}
            className="h-12 px-6 text-sm font-semibold rounded-xl bg-sky-600 hover:bg-sky-700 text-white gap-2 shadow-lg shadow-sky-500/20"
          >
            {primaryActionLabel}
            <ArrowRight className="h-4 w-4" />
          </Button>
        ) : null}
      </motion.div>
    </motion.div>
  );

  if (isInline) {
    return content;
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          {content}
        </div>
      )}
    </AnimatePresence>
  );
}
