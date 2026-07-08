import { useEffect } from "react";
import { FolderOpen, Inbox, RefreshCw, SearchX, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { ErrorPage } from "@/components/error-page";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WizardDialog, type WizardStep } from "@/components/wizard-dialog";
import { t } from "@/lib/i18n";

/*
 * /showcase/states (build-demo-screen-catalog): a one-stop demo of the
 * template's state surfaces — error pages (404/403/500), empty states, a
 * loading skeleton sample, and a multi-step onboarding wizard. Purely
 * presentational (no mock endpoints); any authenticated user can open it.
 */

const ERROR_CODES = ["404", "403", "500"] as const;

/** Logs the onboarding step on mount so the wizard's flow is observable in dev. */
function StepBody({
  step,
  title,
  description,
}: {
  step: number;
  title: string;
  description: string;
}) {
  useEffect(() => {
    console.debug("[StatesPage] onboardingStep", step);
  }, [step]);
  return (
    <div className="space-y-1.5">
      <h3 className="text-base font-semibold tracking-tight">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

export function StatesPage() {
  const wizardSteps: WizardStep[] = [
    {
      key: "welcome",
      label: t("states.wizard.step1.label"),
      content: (
        <StepBody
          step={1}
          title={t("states.wizard.step1.title")}
          description={t("states.wizard.step1.desc")}
        />
      ),
    },
    {
      key: "profile",
      label: t("states.wizard.step2.label"),
      content: (
        <StepBody
          step={2}
          title={t("states.wizard.step2.title")}
          description={t("states.wizard.step2.desc")}
        />
      ),
    },
    {
      key: "done",
      label: t("states.wizard.step3.label"),
      content: (
        <StepBody
          step={3}
          title={t("states.wizard.step3.title")}
          description={t("states.wizard.step3.desc")}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title={t("states.title")} icon={Sparkles} />
      <p className="max-w-2xl text-sm text-muted-foreground">
        {t("states.subtitle")}
      </p>

      {/* error pages */}
      <Panel
        icon={Sparkles}
        title={t("states.errors_title")}
        description={t("states.errors_hint")}
      >
        <Tabs defaultValue="404">
          <TabsList>
            {ERROR_CODES.map((code) => (
              <TabsTrigger key={code} value={code}>
                {code}
              </TabsTrigger>
            ))}
          </TabsList>
          {ERROR_CODES.map((code) => (
            <TabsContent key={code} value={code}>
              <div className="overflow-hidden rounded-xl border border-border/50">
                <ErrorPage code={code} className="min-h-0 py-10" />
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </Panel>

      {/* empty states */}
      <Panel
        icon={Sparkles}
        title={t("states.empty_title")}
        description={t("states.empty_hint")}
      >
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-border/50 py-4">
            <EmptyState
              icon={SearchX}
              title={t("states.empty.search.title")}
              description={t("states.empty.search.desc")}
            />
          </div>
          <div className="rounded-xl border border-border/50 py-4">
            <EmptyState
              icon={Inbox}
              title={t("states.empty.inbox.title")}
              description={t("states.empty.inbox.desc")}
            />
          </div>
          <div className="rounded-xl border border-border/50 py-4">
            <EmptyState
              icon={FolderOpen}
              title={t("states.empty.folder.title")}
              description={t("states.empty.folder.desc")}
              action={{
                label: t("states.empty.folder.action"),
                onClick: () => toast.info(t("states.empty.folder.action")),
              }}
            />
          </div>
        </div>
      </Panel>

      {/* loading / skeleton */}
      <Panel
        icon={Sparkles}
        title={t("states.loading_title")}
        description={t("states.loading_hint")}
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <div
              key={index}
              className="space-y-3 rounded-xl border border-border/50 p-4"
            >
              <Skeleton className="h-32 w-full rounded-lg" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-4/5" />
              <div className="flex gap-2 pt-1">
                <Skeleton className="h-8 w-20 rounded-lg" />
                <Skeleton className="h-8 w-20 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </Panel>

      {/* onboarding wizard */}
      <Panel
        icon={Sparkles}
        title={t("states.onboarding_title")}
        description={t("states.onboarding_hint")}
      >
        <WizardDialog
          trigger={
            <Button>
              <RefreshCw />
              {t("states.onboarding_open")}
            </Button>
          }
          title={t("states.wizard.title")}
          steps={wizardSteps}
          onFinish={() => {
            console.debug("[StatesPage] onboardingStep", "finish");
            toast.success(t("states.onboarding_done"));
          }}
        />
      </Panel>
    </div>
  );
}
