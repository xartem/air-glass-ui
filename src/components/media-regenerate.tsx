import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { api } from "@/api";
import { Panel } from "@/components/panel";
import { Progress } from "@/components/ui/progress";
import { t } from "@/lib/i18n";

/*
 * Regeneration STATUS panel (UI:media §2, D:media §11) — sits next to the media
 * basics form. Regeneration is triggered per preset group from the presets table
 * (each group has its own button + confirm); this panel shows the live progress
 * of the active job and clears when it finishes.
 */
export interface RegenJob {
  group: string;
  jobId: number;
}

export function MediaRegenStatus({
  job,
  onDone,
}: {
  job: RegenJob | null;
  onDone: () => void;
}) {
  const status = useQuery({
    queryKey: ["media-regen", job?.jobId],
    queryFn: () => api.media.regenerate.status(job!.jobId),
    enabled: job !== null,
    refetchInterval: (query) =>
      query.state.data?.state === "done" ? false : 500,
  });

  useEffect(() => {
    if (job && status.data?.state === "done") {
      // Completion also raises a C8 notification on the backend.
      toast.success(t("media.regen.done"));
      onDone();
    }
  }, [job, status.data, onDone]);

  const running =
    job !== null && status.data !== undefined && status.data.state !== "done";

  return (
    <Panel
      icon={RefreshCw}
      title={t("media.regen.title")}
      description={t("media.regen.hint")}
    >
      {running && status.data ? (
        <div className="space-y-2">
          <p className="text-sm font-medium">
            {t("media.regen.running_group", { group: job!.group })}
          </p>
          <Progress value={status.data.percent} />
          <p className="text-sm text-muted-foreground tabular-nums">
            {t("media.regen.progress", {
              processed: status.data.processed,
              total: status.data.total,
              percent: status.data.percent,
            })}
          </p>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">{t("media.regen.idle")}</p>
      )}
    </Panel>
  );
}
