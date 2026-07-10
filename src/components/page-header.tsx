import type { ComponentType, ReactNode } from "react";
import { Link } from "react-router";

import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { HelpSheetButton } from "@/components/help-sheet";
import { Can } from "@/lib/permissions";
import { cn } from "@/lib/utils";

/*
 * PageHeader (E6 §3.1):
 * <PageHeader title icon? primaryAction={{label, onClick|href, permission?}} secondaryActions? breadcrumbs? />
 * Placement is law (E6 §2): title left, PRIMARY action top-right — no exceptions.
 */

export type HeaderAction = {
  label: string;
  onClick?: () => void;
  href?: string;
  icon?: ReactNode;
  permission?: string;
  disabled?: boolean;
};

function ActionButton({
  action,
  variant,
}: {
  action: HeaderAction;
  variant: "default" | "outline";
}) {
  const inner = (
    <>
      {action.icon}
      {action.label}
    </>
  );
  return (
    <Can perm={action.permission}>
      {action.href ? (
        <Button variant={variant} asChild disabled={action.disabled}>
          <Link to={action.href}>{inner}</Link>
        </Button>
      ) : (
        <Button
          variant={variant}
          onClick={action.onClick}
          disabled={action.disabled}
        >
          {inner}
        </Button>
      )}
    </Can>
  );
}

export function PageHeader({
  title,
  subtitle,
  icon: Icon,
  actions,
  primaryAction,
  secondaryActions = [],
  breadcrumbs,
  helpKey,
  className,
}: {
  title: string;
  /** Secondary line under the title (e.g. role, context hint). */
  subtitle?: ReactNode;
  icon?: ComponentType<{ className?: string }>;
  /** Free-form action nodes (toggles, pickers) rendered before the structured actions. */
  actions?: ReactNode;
  primaryAction?: HeaderAction;
  secondaryActions?: HeaderAction[];
  breadcrumbs?: { label: string; href?: string }[];
  /** Screen key of a contextual help article (C11); renders the "?" button when the doc exists. */
  helpKey?: string;
  className?: string;
}) {
  return (
    <header
      data-slot="page-header"
      className={cn("flex flex-col gap-2", className)}
    >
      {breadcrumbs && breadcrumbs.length > 0 ? (
        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumbs.map((crumb, index) => (
              <BreadcrumbItem key={`${crumb.label}-${index}`}>
                {index > 0 ? <BreadcrumbSeparator /> : null}
                {crumb.href ? (
                  <BreadcrumbLink asChild>
                    <Link to={crumb.href}>{crumb.label}</Link>
                  </BreadcrumbLink>
                ) : (
                  <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                )}
              </BreadcrumbItem>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      ) : null}
      <div
        className={cn(
          "flex flex-wrap justify-between gap-x-4 gap-y-2",
          subtitle ? "items-start" : "items-center",
        )}
      >
        <div className="min-w-0">
          <h1 className="flex min-w-0 items-center gap-2.5 text-xl font-semibold tracking-tight sm:text-2xl">
            {Icon ? <Icon className="size-6 shrink-0 text-primary" /> : null}
            <span className="truncate">{title}</span>
          </h1>
          {subtitle ? (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {helpKey ? <HelpSheetButton screenKey={helpKey} /> : null}
          {actions}
          {secondaryActions.map((action) => (
            <ActionButton
              key={action.label}
              action={action}
              variant="outline"
            />
          ))}
          {primaryAction ? (
            <ActionButton action={primaryAction} variant="default" />
          ) : null}
        </div>
      </div>
    </header>
  );
}
