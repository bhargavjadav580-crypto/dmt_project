'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle2, Circle, Clock, Check, Calendar, ArrowRight, User } from 'lucide-react';
import { format } from 'date-fns';

interface FlowEvent {
  type: string;
  stage?: string;
  actorName: string;
  metadata: string; // JSON string
  createdAt: string;
}

interface PatientJourneyProps {
  events: FlowEvent[];
  currentStage: string;
  className?: string;
}

// Canonical hospital stages in chronological order
const JOURNEY_STAGES = [
  { id: 'REGISTERED', label: 'Patient Registration', desc: 'Token generated & added to department queue' },
  { id: 'WAITING', label: 'Queue & Nurse Triage', desc: 'Vitals recorded & waiting to be called' },
  { id: 'IN_CONSULTATION', label: 'Doctor Consultation', desc: 'Clinical evaluation, diagnosis & orders' },
  { id: 'INVESTIGATIONS_PENDING', label: 'Laboratory Diagnostics', desc: 'Sample collection & test processing' },
  { id: 'PHARMACY_PENDING', label: 'Pharmacy Dispensing', desc: 'Prescription review & medicine dispensing' },
  { id: 'BILLING_PENDING', label: 'Billing & Cashier', desc: 'Invoice generated & payment collection' },
  { id: 'READY_FOR_DISCHARGE', label: 'Discharge Clearance', desc: '5-point safety checklist verification' },
  { id: 'COMPLETED', label: 'Visit Completed', desc: 'Patient safely discharged from hospital' },
];

export function PatientJourney({ events, currentStage, className }: PatientJourneyProps) {
  // Map of events by stage
  const eventsByStage: Record<string, FlowEvent> = {};
  events.forEach((e) => {
    if (e.stage && (!eventsByStage[e.stage] || new Date(e.createdAt) > new Date(eventsByStage[e.stage].createdAt))) {
      eventsByStage[e.stage] = e;
    }
  });

  // Determine stage progress
  const currentStageIndex = JOURNEY_STAGES.findIndex((s) => s.id === currentStage);
  const effectiveCurrentIndex = currentStageIndex >= 0 ? currentStageIndex : 2; // Default to consultation if unknown

  // Filter to stages up to current + next logical stage (don't show unnecessary future stages)
  const displayStages = JOURNEY_STAGES.filter((s, idx) => {
    // Always include stages that have happened or current stage
    if (idx <= effectiveCurrentIndex || eventsByStage[s.id]) return true;
    // Show one next upcoming stage for context
    return idx === effectiveCurrentIndex + 1;
  });

  return (
    <div className={cn("w-full space-y-4", className)}>
      <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
        {displayStages.map((stageItem, index) => {
          const event = eventsByStage[stageItem.id];
          const isCurrent = stageItem.id === currentStage;
          const isDone = JOURNEY_STAGES.findIndex((s) => s.id === stageItem.id) < effectiveCurrentIndex || (!isCurrent && !!event);
          const isUpcoming = !isDone && !isCurrent;

          return (
            <div key={stageItem.id} className="relative group">
              {/* Step Icon on connecting vertical line */}
              <div 
                className={cn(
                  "absolute -left-6 sm:-left-8 top-1.5 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all shadow-xs z-10",
                  isDone && "bg-emerald-500 text-white ring-4 ring-emerald-50",
                  isCurrent && "bg-sky-600 text-white ring-4 ring-sky-100 animate-pulse shadow-sky-500/25",
                  isUpcoming && "bg-white text-slate-300 border-2 border-slate-200"
                )}
              >
                {isDone ? (
                  <Check className="w-4 h-4 stroke-[3]" />
                ) : isCurrent ? (
                  <Clock className="w-4 h-4 stroke-[2.5]" />
                ) : (
                  <Circle className="w-3.5 h-3.5" />
                )}
              </div>

              {/* Full-width step card */}
              <div 
                className={cn(
                  "w-full rounded-2xl p-4 sm:p-5 border transition-all duration-200",
                  isCurrent && "bg-gradient-to-r from-sky-50/70 via-white to-sky-50/30 border-sky-300 shadow-sm ring-1 ring-sky-200",
                  isDone && "bg-white border-slate-200/90 shadow-xs hover:border-slate-300",
                  isUpcoming && "bg-slate-50/50 border-dashed border-slate-200 opacity-60"
                )}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-1">
                  <div className="flex items-center gap-2">
                    <h4 className={cn(
                      "font-bold text-sm sm:text-base",
                      isCurrent ? "text-sky-900" : isDone ? "text-slate-900" : "text-slate-500"
                    )}>
                      {stageItem.label}
                    </h4>

                    {isCurrent && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-sky-100 text-sky-700 border border-sky-200">
                        In Progress Now
                      </span>
                    )}

                    {isDone && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Completed
                      </span>
                    )}
                  </div>

                  {event && (
                    <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {format(new Date(event.createdAt), 'hh:mm a')}
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-500 leading-relaxed">
                  {stageItem.desc}
                </p>

                {event && (
                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1.5 font-medium text-slate-600">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      Handled by: <strong className="text-slate-800">{event.actorName}</strong>
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {format(new Date(event.createdAt), 'dd MMM yyyy')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
