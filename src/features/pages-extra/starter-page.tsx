import { FileStack, Plus } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";
import { EmptyState } from "@/components/empty-state";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";

/*
 * /starter: the blank "copy me to start a screen" template — a PageHeader with a
 * breadcrumb and action slot over an empty Panel. No data.
 */

export function StarterPage() {
  useLocale();
  return (
    <div className="space-y-5">
      <PageHeader
        title={t("starter.title")}
        icon={FileStack}
        breadcrumbs={[
          { label: t("nav.group.pages"), href: "/starter" },
          { label: t("starter.title") },
        ]}
        primaryAction={{
          label: t("starter.action"),
          icon: <Plus className="size-4" />,
          onClick: () => {},
        }}
      />
      <Panel>
        <EmptyState
          icon={FileStack}
          title={t("starter.empty.title")}
          description={t("starter.empty.description")}
        />
      </Panel>
    </div>
  );
}
