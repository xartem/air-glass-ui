import { useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router";
import {
  Columns2,
  Info,
  Layers,
  LayoutGrid,
  PanelLeftClose,
  PanelTop,
  RotateCcw,
  SlidersHorizontal,
} from "lucide-react";

import { api, type AppearanceLayout, type AppearanceSettings } from "@/api";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";
import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n";
import type { NavIcon } from "@/app/nav";

/*
 * Layouts demo screens (MENU-SPEC §1.3). Each route flips the site-wide `layout` appearance
 * field on mount, so the surrounding app-shell re-chromes into the variant. The layout is a
 * persisted appearance setting (like density / content width): visiting a demo changes it for
 * good, so the note card explains that and offers a one-click reset back to the default.
 */

const VARIANT_ICON: Record<AppearanceLayout, NavIcon> = {
  vertical: LayoutGrid,
  horizontal: PanelTop,
  detached: Layers,
  "two-column": Columns2,
  hovered: PanelLeftClose,
};

/** Persist the shell layout and refresh the appearance query so the shell re-renders. */
function useApplyLayout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (layout: AppearanceLayout) => {
      // Merge over the current config so only `layout` changes (save() expects a full payload).
      const current =
        queryClient.getQueryData<AppearanceSettings>(["appearance"]) ??
        (await api.appearance.get());
      return api.appearance.save({ ...current, layout });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["appearance"] }),
  });
}

function LayoutDemoPage({ variant }: { variant: AppearanceLayout }) {
  const apply = useApplyLayout();
  const name = t(`customizer.layout.${variant}`);
  const Icon = VARIANT_ICON[variant];

  // Flip the shell to this variant on mount. The mutation identity is stable across renders.
  const applyMutate = apply.mutate;
  useEffect(() => {
    console.debug("[layouts] applying shell layout", variant);
    applyMutate(variant);
  }, [variant, applyMutate]);

  return (
    <div className="space-y-4">
      <PageHeader
        title={name}
        subtitle={t("layouts.subtitle")}
        icon={Icon}
      />

      <Panel icon={Info} title={t("layouts.note.title")}>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {t("layouts.note.body", { name })}
          </p>
          <p className="text-sm">{t(`layouts.${variant}.desc`)}</p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => apply.mutate("vertical")}
              disabled={apply.isPending}
            >
              <RotateCcw />
              {t("layouts.note.reset")}
            </Button>
            <Button variant="outline" asChild>
              <Link to="/appearance">
                <SlidersHorizontal />
                {t("layouts.note.settings")}
              </Link>
            </Button>
          </div>
        </div>
      </Panel>
    </div>
  );
}

export function HorizontalLayoutPage() {
  return <LayoutDemoPage variant="horizontal" />;
}

export function DetachedLayoutPage() {
  return <LayoutDemoPage variant="detached" />;
}

export function TwoColumnLayoutPage() {
  return <LayoutDemoPage variant="two-column" />;
}

export function HoveredLayoutPage() {
  return <LayoutDemoPage variant="hovered" />;
}
