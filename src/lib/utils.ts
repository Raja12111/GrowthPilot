import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Connected / disconnected badge styles (green when linked). */
export function connectionBadgeClass(connected: boolean) {
  return connected
    ? "border-0 bg-[#dcfce7] text-[#15803d]"
    : "border-0 bg-[#eef1f6] text-[#5c6578]"
}

/** Solid “Connected” chip / button when an account is linked. */
export const connectedSolidClass =
  "inline-flex h-8 items-center rounded-lg bg-[#16a34a] px-3 text-sm font-medium text-white"

