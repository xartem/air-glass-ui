import { MutationCache, QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { ApiError } from "@/api";
import { t } from "@/lib/i18n";

/*
 * QueryClient defaults (cms-admin-ui rule, decision 2026-07-04):
 * - 4xx ApiErrors are final — retrying a 403/404/422 GET three times only
 *   delays the error state (TanStack's default retry=3 did exactly that);
 * - mutations without their own onError must not fail silently — the
 *   MutationCache surfaces the error as a toast (screens that handle
 *   422/409 themselves declare onError and are left alone).
 */

export function shouldRetryQuery(
  failureCount: number,
  error: unknown,
): boolean {
  if (error instanceof ApiError && error.status < 500) return false;
  return failureCount < 2;
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: shouldRetryQuery },
    },
    mutationCache: new MutationCache({
      onError: (error, _variables, _context, mutation) => {
        if (mutation.options.onError) return;
        if (import.meta.env.DEV)
          console.debug("[FIX] unhandled mutation error", error);
        toast.error(
          error instanceof ApiError
            ? error.message
            : t("common.request_failed"),
        );
      },
    }),
  });
}
