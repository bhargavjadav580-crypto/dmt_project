import React from 'react';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface Step {
  title: string;
  description?: string;
}

interface StepperProps {
  steps: Step[];
  currentStep: number; // 1-indexed (1, 2, 3, ...)
  className?: string;
}

export function Stepper({ steps, currentStep, className }: StepperProps) {
  // Calculate progress percentage based on 1-indexed currentStep
  const progressPct = Math.min(
    100,
    Math.max(0, ((currentStep - 1) / Math.max(1, steps.length - 1)) * 100)
  );

  return (
    <div className={cn("w-full py-3 px-2 sm:px-6 relative", className)}>
      <div className="relative flex items-center justify-between">
        {/* Background track line */}
        <div className="absolute left-6 right-6 top-5 h-1 bg-slate-200 -translate-y-1/2 z-0 rounded-full" />

        {/* Animated active progress bar */}
        <div 
          className="absolute left-6 top-5 h-1 bg-gradient-to-r from-sky-500 to-sky-600 -translate-y-1/2 z-0 rounded-full transition-all duration-500 ease-out"
          style={{ width: `calc(${progressPct}% * (100% - 48px) / 100)` }}
        />

        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;
          const isUpcoming = stepNumber > currentStep;

          return (
            <div key={step.title} className="flex flex-col items-center relative z-10">
              <div 
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 shadow-sm",
                  isCompleted && "bg-emerald-500 text-white shadow-emerald-500/25 ring-4 ring-emerald-50 scale-100",
                  isCurrent && "bg-sky-600 text-white ring-4 ring-sky-100 shadow-sky-600/30 scale-110",
                  isUpcoming && "bg-white text-slate-400 border-2 border-slate-200"
                )}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5 stroke-[2.5]" />
                ) : (
                  <span>{stepNumber}</span>
                )}
              </div>
              
              <div className="mt-2.5 flex flex-col items-center text-center">
                <span className={cn(
                  "text-xs sm:text-sm transition-colors",
                  isCurrent && "font-bold text-sky-700",
                  isCompleted && "font-semibold text-slate-800",
                  isUpcoming && "font-medium text-slate-400"
                )}>
                  {step.title}
                </span>
                {step.description && (
                  <span className="text-[11px] text-slate-400 max-w-[100px] hidden sm:block mt-0.5">
                    {step.description}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
