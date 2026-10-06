'use client';

import * as React from "react"
import { useToast } from "./use-toast"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"

export function Toaster() {
  const { toasts, dismissToast } = useToast()

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]">
      {toasts.map(function ({ id, title, description, variant, ...props }) {
        return (
          <div
            key={id}
            {...props}
            className={cn(
              "pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full mt-4",
              {
                "bg-background text-foreground border": !variant || variant === "default",
                "bg-success text-success-foreground border-success": variant === "success",
                "bg-danger text-white border-danger": variant === "error",
                "bg-warning text-warning-foreground border-warning": variant === "warning",
                "bg-info text-info-foreground border-info": variant === "info",
              }
            )}
          >
            <div className="grid gap-1">
              {title && <div className="text-sm font-semibold">{title}</div>}
              {description && (
                <div className="text-sm opacity-90">{description}</div>
              )}
            </div>
            <button
              onClick={() => dismissToast(id)}
              className="absolute right-2 top-2 rounded-md p-1 opacity-50 transition-opacity hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
