import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { QRCodeSVG } from "qrcode.react";
import { Copy, KeyRound, ShieldCheck, ShieldOff } from "lucide-react";
import { toast } from "sonner";

import { api, ValidationError, type MfaEnrollStart } from "@/api";
import { FormField } from "@/components/form-field";
import { Panel } from "@/components/panel";
import { StatusBadge } from "@/components/status-badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/lib/auth";
import { t } from "@/lib/i18n";

/*
 * 2FA self-service (D:auth §6, UI:users-roles §3 "Security"): enroll shows
 * a QR (otpauth URI, drawn client-side) + manual secret, confirms with a code
 * and reveals the 10 recovery codes exactly once. Disable requires a fresh
 * code. The same enroll flow serves the forced-enroll gate (mfa_required_roles).
 */

function codeError(cause: unknown): string {
  return cause instanceof ValidationError && cause.fields.code
    ? t("mfa.invalid_code")
    : t("common.request_failed");
}

function CopyButton({ text, label }: { text: string; label?: string }) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => {
        void navigator.clipboard.writeText(text);
        toast.success(t("mfa.copied"));
      }}
    >
      <Copy className="size-3.5" />
      {label ?? t("mfa.copy")}
    </Button>
  );
}

function RecoveryCodesBlock({ codes }: { codes: string[] }) {
  return (
    <div className="space-y-3">
      <Alert className="border-[var(--status-pending-fg)]/40 bg-[var(--status-pending-bg)] text-[var(--status-pending-fg)]">
        <AlertDescription className="text-[var(--status-pending-fg)]">
          {t("mfa.codes_hint")}
        </AlertDescription>
      </Alert>
      <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 rounded-lg border bg-muted/40 p-3 font-mono text-sm">
        {codes.map((code) => (
          <span key={code}>{code}</span>
        ))}
      </div>
      <CopyButton text={codes.join("\n")} label={t("mfa.copy_codes")} />
    </div>
  );
}

/** Enroll flow: scan QR → confirm with a code → recovery codes (shown once). */
export function MfaEnrollFlow({ onDone }: { onDone: () => void }) {
  const [start, setStart] = useState<MfaEnrollStart | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);

  const enrollMutation = useMutation({
    mutationFn: () => api.mfa.enroll(),
    onSuccess: setStart,
    onError: () => toast.error(t("common.request_failed")),
  });

  const confirmMutation = useMutation({
    mutationFn: () => api.mfa.confirmEnroll(code.trim()),
    onSuccess: (result) => setRecoveryCodes(result.recovery_codes),
    onError: (cause) => setError(codeError(cause)),
  });

  if (recoveryCodes) {
    return (
      <div className="space-y-4">
        <p className="text-sm font-medium">{t("mfa.codes_title")}</p>
        <RecoveryCodesBlock codes={recoveryCodes} />
        <Button onClick={onDone}>{t("mfa.done")}</Button>
      </div>
    );
  }

  if (!start) {
    return (
      <Button
        onClick={() => enrollMutation.mutate()}
        disabled={enrollMutation.isPending}
      >
        {enrollMutation.isPending ? (
          <Spinner />
        ) : (
          <ShieldCheck className="size-4" />
        )}
        {t("mfa.start")}
      </Button>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{t("mfa.scan_hint")}</p>
      <div className="flex flex-wrap items-start gap-4">
        <div className="rounded-xl border bg-white p-3">
          <QRCodeSVG value={start.otpauth_uri} size={148} />
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-xs text-muted-foreground">
            {t("mfa.secret_label")}
          </p>
          <p className="font-mono text-sm break-all">{start.secret}</p>
          <CopyButton text={start.secret} />
        </div>
      </div>
      <FormField name="mfa-code" label={t("mfa.code_label")} error={error}>
        <Input
          id="mfa-code"
          value={code}
          onChange={(event) => {
            setCode(event.target.value);
            setError(undefined);
          }}
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="000000"
          className="max-w-40 font-mono"
        />
      </FormField>
      <Button
        onClick={() => confirmMutation.mutate()}
        disabled={confirmMutation.isPending || code.trim().length === 0}
      >
        {confirmMutation.isPending ? <Spinner /> : null}
        {t("mfa.confirm")}
      </Button>
    </div>
  );
}

/** "Security" panel on /profile (UI:users-roles §3). */
export function SecurityCard() {
  const { me, refresh } = useAuth();
  const [enrollOpen, setEnrollOpen] = useState(false);
  const [disableOpen, setDisableOpen] = useState(false);
  const [regenerated, setRegenerated] = useState<string[] | null>(null);
  const [disableCode, setDisableCode] = useState("");
  const [disableError, setDisableError] = useState<string | undefined>();

  const enabled = me.mfa.enabled;

  const disableMutation = useMutation({
    mutationFn: () => api.mfa.disable(disableCode.trim()),
    onSuccess: async () => {
      toast.success(t("mfa.disabled"));
      setDisableOpen(false);
      setDisableCode("");
      await refresh();
    },
    onError: (cause) => setDisableError(codeError(cause)),
  });

  const regenerateMutation = useMutation({
    mutationFn: () => api.mfa.regenerateRecoveryCodes(),
    onSuccess: (result) => setRegenerated(result.recovery_codes),
    onError: () => toast.error(t("common.request_failed")),
  });

  return (
    <Panel
      icon={ShieldCheck}
      title={t("mfa.title")}
      description={t("mfa.hint")}
    >
      <div className="max-w-2xl space-y-4">
        <div className="flex items-center gap-3">
          <StatusBadge
            status={enabled ? "success" : "archived"}
            label={t(enabled ? "mfa.status_on" : "mfa.status_off")}
          />
        </div>
        {enabled ? (
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => regenerateMutation.mutate()}
              disabled={regenerateMutation.isPending}
            >
              {regenerateMutation.isPending ? (
                <Spinner />
              ) : (
                <KeyRound className="size-4" />
              )}
              {t("mfa.regenerate")}
            </Button>
            <Button variant="outline" onClick={() => setDisableOpen(true)}>
              <ShieldOff className="size-4" />
              {t("mfa.disable")}
            </Button>
          </div>
        ) : (
          <Button onClick={() => setEnrollOpen(true)}>
            <ShieldCheck className="size-4" />
            {t("mfa.enable")}
          </Button>
        )}
      </div>

      {/* Enroll: QR → confirm → one-time recovery codes */}
      <Dialog
        open={enrollOpen}
        onOpenChange={(open) => {
          setEnrollOpen(open);
          if (!open) void refresh();
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("mfa.enable")}</DialogTitle>
            <DialogDescription>{t("mfa.scan_title")}</DialogDescription>
          </DialogHeader>
          <MfaEnrollFlow
            onDone={() => {
              setEnrollOpen(false);
              void refresh();
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Disable: requires a fresh TOTP/recovery code (D:auth §6) */}
      <Dialog open={disableOpen} onOpenChange={setDisableOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("mfa.disable_title")}</DialogTitle>
            <DialogDescription>{t("mfa.disable_hint")}</DialogDescription>
          </DialogHeader>
          <FormField
            name="mfa-disable-code"
            label={t("mfa.code_label")}
            error={disableError}
          >
            <Input
              id="mfa-disable-code"
              value={disableCode}
              onChange={(event) => {
                setDisableCode(event.target.value);
                setDisableError(undefined);
              }}
              inputMode="numeric"
              autoComplete="one-time-code"
              className="max-w-40 font-mono"
            />
          </FormField>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDisableOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={() => disableMutation.mutate()}
              disabled={
                disableMutation.isPending || disableCode.trim().length === 0
              }
            >
              {disableMutation.isPending ? <Spinner /> : null}
              {t("mfa.disable")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Regenerated recovery codes — shown once */}
      <Dialog
        open={regenerated !== null}
        onOpenChange={(open) => !open && setRegenerated(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("mfa.codes_title")}</DialogTitle>
          </DialogHeader>
          {regenerated ? <RecoveryCodesBlock codes={regenerated} /> : null}
          <DialogFooter>
            <Button onClick={() => setRegenerated(null)}>
              {t("mfa.done")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Panel>
  );
}
