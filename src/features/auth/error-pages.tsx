import { ErrorPage } from "@/components/error-page";
import { devDebug } from "@/lib/debug";
import { useLocale } from "@/lib/use-locale";

/*
 * Standalone public error routes (404 basic/cover/alt, 500, offline). Thin
 * wrappers over the shared ErrorPage — the wildcard 404 inside the shell keeps
 * using ErrorPage directly.
 */

export function NotFoundPage() {
  useLocale();
  devDebug("[ErrorPage] mount", { code: "404", variant: "basic" });
  return <ErrorPage code="404" />;
}

export function NotFoundCoverPage() {
  useLocale();
  devDebug("[ErrorPage] mount", { code: "404", variant: "cover" });
  return <ErrorPage code="404" variant="cover" />;
}

export function NotFoundAltPage() {
  useLocale();
  devDebug("[ErrorPage] mount", { code: "404", variant: "alt" });
  return <ErrorPage code="404" variant="alt" />;
}

export function ServerErrorPage() {
  useLocale();
  devDebug("[ErrorPage] mount", { code: "500", variant: "basic" });
  return <ErrorPage code="500" />;
}

export function OfflinePage() {
  useLocale();
  devDebug("[ErrorPage] mount", { code: "offline", variant: "basic" });
  return <ErrorPage code="offline" />;
}
