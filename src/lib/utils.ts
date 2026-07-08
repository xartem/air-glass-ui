import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Absolute URL inside the SPA basename (/{admin_prefix} in prod). Bare '/login'
 * would escape the SPA — always build full-page navigation through this. */
export function spaUrl(path: string): string {
  return import.meta.env.BASE_URL.replace(/\/$/, '') + path
}
