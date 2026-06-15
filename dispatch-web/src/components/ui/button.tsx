import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Dispatch buttons. The default variant is amber — the "armed" state of an
 * instrument panel — so the accent color is what you press, not decoration.
 * Corners are tighter than stock shadcn on purpose: precision, not pillows.
 */
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-sm border border-transparent text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-amber-400/60 focus-visible:ring-2 focus-visible:ring-amber-400/25 active:translate-y-px disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-amber-400 text-zinc-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_0_24px_-10px_rgba(251,191,36,0.6)] hover:bg-amber-300",
        outline:
          "border-zinc-700/80 bg-zinc-900/40 text-zinc-300 hover:border-zinc-600 hover:bg-zinc-900 hover:text-zinc-100",
        secondary: "bg-zinc-800/80 text-zinc-200 hover:bg-zinc-700/70",
        ghost: "text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-100",
        destructive:
          "border-red-900/50 bg-red-500/10 text-red-400 hover:bg-red-500/20 focus-visible:border-red-500/50 focus-visible:ring-red-500/20",
        link: "text-amber-400 underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "h-6 gap-1 px-2 text-xs has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 px-2.5 text-[0.8rem] has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-9 gap-1.5 px-3 has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5",
        icon: "size-8",
        "icon-xs": "size-6 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-7",
        "icon-lg": "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
