import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

/**
 * Terminal-grade field: dark well, hairline border that arms amber on
 * focus, amber caret (set globally). Tuned for the app's dark scope only.
 */
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-10 w-full min-w-0 rounded-sm border border-zinc-800 bg-zinc-900/50 px-3 py-1 text-base text-zinc-100 transition-colors outline-none",
        "placeholder:text-zinc-600 md:text-sm",
        "focus-visible:border-amber-400/60 focus-visible:bg-zinc-900/80 focus-visible:ring-2 focus-visible:ring-amber-400/15",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-red-900/70 aria-invalid:focus-visible:border-red-500/50 aria-invalid:focus-visible:ring-red-500/15",
        "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-zinc-200",
        className
      )}
      {...props}
    />
  )
}

export { Input }
