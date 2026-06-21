import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-10 w-full min-w-0 border-2 border-border bg-card px-3 py-2 text-sm font-normal text-foreground placeholder:text-muted-foreground transition-all outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground focus-visible:border-primary focus-visible:bg-white disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-muted aria-invalid:border-destructive aria-invalid:bg-white hover:border-primary/50",
        className
      )}
      {...props}
    />
  )
}

export { Input }
