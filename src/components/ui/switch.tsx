import { cn } from "@/lib/utils"

interface SwitchProps {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  disabled?: boolean
  id?: string
}

function Switch({ checked, onCheckedChange, disabled, id }: SwitchProps) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors",
        checked ? "bg-green-500" : "bg-zinc-300 dark:bg-zinc-700",
        disabled && "cursor-not-allowed opacity-50"
      )}
    >
      <span
        className={cn(
          "inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform",
          checked ? "translate-x-[22px]" : "translate-x-[2px]"
        )}
      />
    </button>
  )
}

export { Switch }
