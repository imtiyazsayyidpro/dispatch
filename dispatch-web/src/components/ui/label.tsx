"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Panel-style micro label: mono, uppercase, tracked wide — reads like the
 * etched legend above an instrument, not a form caption.
 */
function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      data-slot="label"
      className={cn(
        "flex items-center gap-2 font-mono text-[11px] tracking-[0.18em] text-zinc-500 uppercase select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Label }
