import { Toaster as SonnerToaster } from "@/components/ui/sonner";

/*
 * Toast (E6 §3): single toast system for the whole admin — sonner behind a fixed setup.
 * Screens import { toast } and call toast.success()/error(); no custom toast styling.
 */

export { toast } from "sonner";

export function Toaster() {
  return <SonnerToaster position="bottom-right" richColors closeButton />;
}
