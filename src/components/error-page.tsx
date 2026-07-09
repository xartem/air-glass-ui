import type { ComponentType, ReactNode } from "react";
import {
  Ban,
  Home,
  RefreshCw,
  SearchX,
  ServerCrash,
  WifiOff,
} from "lucide-react";
import { Link, useNavigate } from "react-router";

import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/*
 * ErrorPage: the single full-page error archetype — 404 (not found), 500
 * (render/server failure), 403 (no access), offline (lost connection). Screens
 * never build their own error pages. Variants only change the framing:
 *   basic — centered column (default)
 *   cover — split hero panel + message column
 *   alt   — oversized illustration above a centered message
 */

export type ErrorCode = "404" | "500" | "403" | "offline";
export type ErrorVariant = "basic" | "cover" | "alt";

const ERROR_ICON: Record<ErrorCode, ComponentType<{ className?: string }>> = {
  "404": SearchX,
  "500": ServerCrash,
  "403": Ban,
  offline: WifiOff,
};

/** Big gradient code only reads for the numeric archetypes. */
const NUMERIC: Record<ErrorCode, boolean> = {
  "404": true,
  "500": true,
  "403": true,
  offline: false,
};

function ErrorActions({
  code,
  onRetry,
}: {
  code: ErrorCode;
  onRetry?: () => void;
}) {
  const navigate = useNavigate();
  const canRetry = code === "500" || code === "offline";
  return (
    <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
      {code === "404" ? (
        <Button variant="outline" onClick={() => navigate(-1)}>
          {t("common.back")}
        </Button>
      ) : null}
      {canRetry ? (
        <Button onClick={onRetry ?? (() => window.location.reload())}>
          <RefreshCw />
          {t("common.retry")}
        </Button>
      ) : null}
      <Button variant={canRetry ? "outline" : "default"} asChild>
        <Link to="/">
          <Home />
          {t("error.home")}
        </Link>
      </Button>
    </div>
  );
}

export function ErrorPage({
  code = "404",
  variant = "basic",
  illustration,
  onRetry,
  className,
}: {
  code?: ErrorCode;
  variant?: ErrorVariant;
  /** Optional visual replacing the default icon/code hero (cover/alt shine with it). */
  illustration?: ReactNode;
  /** 500/offline only: retry handler; defaults to a full reload. */
  onRetry?: () => void;
  className?: string;
}) {
  const Icon = ERROR_ICON[code];

  const hero = illustration ?? (
    <>
      <div
        className={cn(
          "empty-state-icon flex items-center justify-center rounded-2xl",
          variant === "alt"
            ? "size-24 [&>svg]:size-10"
            : "size-16 [&>svg]:size-7",
        )}
      >
        <Icon />
      </div>
      {NUMERIC[code] ? (
        <p
          aria-hidden
          className={cn(
            "bg-[image:var(--gradient-heading)] bg-clip-text leading-none font-bold tracking-tight text-transparent",
            variant === "alt" ? "text-8xl" : "text-7xl",
          )}
        >
          {code}
        </p>
      ) : null}
    </>
  );

  const message = (
    <div className="space-y-1.5">
      <h1 className="text-xl font-semibold tracking-tight">
        {t(`error.${code}.title`)}
      </h1>
      <p className="mx-auto max-w-96 text-sm text-muted-foreground">
        {t(`error.${code}.description`)}
      </p>
    </div>
  );

  if (variant === "cover") {
    return (
      <div
        data-slot="error-page"
        className={cn(
          "grid min-h-[60vh] items-center gap-8 px-6 py-12 lg:grid-cols-2",
          className,
        )}
      >
        <div className="flex flex-col items-center gap-4 lg:items-end">
          {hero}
        </div>
        <div className="flex flex-col items-center gap-4 text-center lg:items-start lg:text-start">
          {message}
          <ErrorActions code={code} onRetry={onRetry} />
        </div>
      </div>
    );
  }

  return (
    <div
      data-slot="error-page"
      className={cn(
        "flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 py-12 text-center",
        className,
      )}
    >
      {hero}
      {message}
      <ErrorActions code={code} onRetry={onRetry} />
    </div>
  );
}

/**
 * Route-level error element (React Router errorElement): a render/loader crash
 * lands here OUTSIDE the shell, so it paints its own mesh backdrop.
 */
export function RouteErrorPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div aria-hidden className="app-mesh fixed inset-0 -z-10" />
      <div aria-hidden className="app-mesh-noise fixed inset-0 -z-10" />
      <ErrorPage code="500" />
    </div>
  );
}
