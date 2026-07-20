import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

export function Checkbox({ className, ...props }: CheckboxPrimitive.Root.Props) {
  return (
    <CheckboxPrimitive.Root
      className={cn(
        "group peer inline-flex size-4 shrink-0 items-center justify-center rounded border border-zinc-300 bg-white outline-none transition-colors focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[checked]:border-blue-600 data-[checked]:bg-blue-600 dark:border-zinc-600 dark:bg-zinc-800 dark:data-[checked]:border-blue-500 dark:data-[checked]:bg-blue-500",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="flex items-center justify-center text-white">
        <Check className="size-3" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}
