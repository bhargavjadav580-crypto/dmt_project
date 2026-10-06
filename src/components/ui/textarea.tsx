import * as React from "react"

import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, ...props }, ref) => {
    const id = React.useId()
    return (
      <div className="flex w-full flex-col gap-1.5">
        {label && (
          <label htmlFor={id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            {label}
          </label>
        )}
        <textarea
          id={id}
          className={cn(
            "flex min-h-[80px] w-full rounded-lg border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-danger focus-visible:ring-danger",
            className
          )}
          ref={ref}
          {...props}
        />
        {error && <p className="text-sm text-danger">{error}</p>}
      </div>
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
