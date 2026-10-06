import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helpText?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, helpText, ...props }, ref) => {
    const id = React.useId()
    return (
      <div className="flex w-full flex-col gap-1.5">
        {label && (
          <label htmlFor={id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            {label}
          </label>
        )}
        <input
          id={id}
          type={type}
          className={cn(
            "flex h-12 w-full rounded-lg border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-danger focus-visible:ring-danger",
            className
          )}
          ref={ref}
          {...props}
        />
        {error && <p className="text-sm text-danger">{error}</p>}
        {helpText && !error && <p className="text-sm text-muted-foreground">{helpText}</p>}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
