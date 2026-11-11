import { clsx, type ClassValue } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

// `text-compact` and `text-headline` are font sizes (primitives.css); without this tailwind-merge
// reads it as a text colour and drops it next to `text-[var(--lume-text)]`.
const twMerge = extendTailwindMerge({
  extend: { classGroups: { "font-size": [{ text: ["compact", "headline"] }] } },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
