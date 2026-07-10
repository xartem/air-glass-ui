import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Copy,
  QrCode,
  Wallet,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";

import { api, type Holding } from "@/api";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";
import { FormField } from "@/components/form-field";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Donut } from "@/components/charts/donut";
import { Sparkline } from "@/components/charts/sparkline";
import { formatMoney, formatNumber } from "@/lib/money";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";

/*
 * /crypto/wallet — portfolio value, allocation donut and per-coin holdings with
 * deposit, withdraw and receive (QR) actions. Reachable with crypto.view.
 */

type DialogMode = {
  kind: "deposit" | "withdraw" | "receive";
  coin: Holding;
} | null;

export function CryptoWalletPage() {
  const locale = useLocale();
  const [dialog, setDialog] = useState<DialogMode>(null);

  const walletQuery = useQuery({
    queryKey: ["crypto", "wallet"],
    queryFn: api.crypto.wallet,
  });

  const wallet = walletQuery.data;

  return (
    <div className="space-y-4">
      <PageHeader title={t("crypto.wallet.title")} icon={Wallet} />

      <div className="grid gap-4 lg:grid-cols-[20rem_1fr]">
        <div className="glass-card rounded-2xl p-5">
          <div className="text-xs text-muted-foreground">
            {t("crypto.wallet.portfolio")}
          </div>
          {wallet ? (
            <>
              <div className="mt-1 text-3xl font-semibold tabular-nums">
                {formatMoney(wallet.total_value, wallet.currency, locale)}
              </div>
              <span
                className="mt-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium tabular-nums"
                style={{
                  color:
                    wallet.change_24h >= 0
                      ? "var(--status-success-fg)"
                      : "var(--status-error-fg)",
                  background:
                    wallet.change_24h >= 0
                      ? "var(--status-success-bg)"
                      : "var(--status-error-bg)",
                }}
              >
                {wallet.change_24h >= 0 ? "+" : ""}
                {wallet.change_24h.toFixed(2)}%
              </span>
            </>
          ) : (
            <Skeleton className="mt-2 h-10" />
          )}
        </div>

        <Panel title={t("crypto.wallet.allocation")}>
          {wallet ? (
            <Donut
              data={wallet.allocation}
              ariaLabel={t("crypto.wallet.allocation")}
              formatValue={(value) =>
                formatMoney(value, wallet.currency, locale)
              }
            />
          ) : (
            <Skeleton className="h-44" />
          )}
        </Panel>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {walletQuery.isPending
          ? Array.from({ length: 3 }, (_, index) => (
              <Skeleton key={index} className="h-44 rounded-2xl" />
            ))
          : (wallet?.holdings ?? []).map((holding) => (
              <div
                key={holding.symbol}
                className="glass-card flex flex-col gap-3 rounded-2xl p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-medium">{holding.symbol}</div>
                    <div className="text-xs text-muted-foreground">
                      {holding.name}
                    </div>
                  </div>
                  <Sparkline
                    data={holding.spark}
                    color={
                      holding.change24h >= 0
                        ? "var(--status-success-fg)"
                        : "var(--status-error-fg)"
                    }
                    ariaLabel={`${holding.symbol} ${t("crypto.wallet.sparkline")}`}
                  />
                </div>
                <div>
                  <div className="text-lg font-semibold tabular-nums">
                    {formatMoney(holding.value, wallet!.currency, locale)}
                  </div>
                  <div className="text-xs text-muted-foreground tabular-nums">
                    {formatNumber(holding.amount, locale)} {holding.symbol}
                  </div>
                </div>
                <div className="mt-auto flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setDialog({ kind: "deposit", coin: holding })
                    }
                  >
                    <ArrowDownToLine className="size-4" />
                    {t("crypto.wallet.deposit")}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setDialog({ kind: "withdraw", coin: holding })
                    }
                  >
                    <ArrowUpFromLine className="size-4" />
                    {t("crypto.wallet.withdraw")}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      setDialog({ kind: "receive", coin: holding })
                    }
                  >
                    <QrCode className="size-4" />
                    {t("crypto.wallet.receive")}
                  </Button>
                </div>
              </div>
            ))}
      </div>

      {dialog?.kind === "receive" ? (
        <ReceiveDialog holding={dialog.coin} onClose={() => setDialog(null)} />
      ) : dialog ? (
        <TransferDialog
          mode={dialog.kind}
          holding={dialog.coin}
          onClose={() => setDialog(null)}
        />
      ) : null}
    </div>
  );
}

function ReceiveDialog({
  holding,
  onClose,
}: {
  holding: Holding;
  onClose: () => void;
}) {
  async function copy() {
    try {
      await navigator.clipboard.writeText(holding.address);
      toast.success(t("crypto.wallet.address_copied"));
    } catch {
      toast.error(t("common.request_failed"));
    }
  }
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {t("crypto.wallet.receive_title", { coin: holding.symbol })}
          </DialogTitle>
          <DialogDescription>
            {t("crypto.wallet.receive_hint")}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-2">
          <div className="rounded-xl border border-[var(--glass-border)] bg-background p-4">
            <QRCodeSVG
              value={holding.address}
              size={160}
              bgColor="transparent"
              fgColor="var(--foreground)"
            />
          </div>
          <code className="break-all rounded-lg bg-muted px-3 py-2 text-center font-mono text-xs">
            {holding.address}
          </code>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => void copy()}>
            <Copy className="size-4" />
            {t("crypto.wallet.copy_address")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type TransferValues = { amount: number; address: string };

function TransferDialog({
  mode,
  holding,
  onClose,
}: {
  mode: "deposit" | "withdraw";
  holding: Holding;
  onClose: () => void;
}) {
  const locale = useLocale();
  const queryClient = useQueryClient();
  const isWithdraw = mode === "withdraw";
  const schema = useMemo(
    () =>
      z.object({
        amount: z.number().positive("invalid"),
        address: isWithdraw ? z.string().min(1, "required") : z.string(),
      }),
    [isWithdraw],
  );
  const form = useForm<TransferValues>({
    defaultValues: { amount: 0, address: "" },
  });

  const mutation = useMutation({
    mutationFn: (values: TransferValues) => {
      console.debug("[CryptoWallet] transfer", { mode, coin: holding.symbol });
      return isWithdraw
        ? api.crypto.withdraw({
            coin: holding.symbol,
            amount: values.amount,
            address: values.address,
          })
        : api.crypto.deposit({ coin: holding.symbol, amount: values.amount });
    },
    onSuccess: () => {
      toast.success(
        isWithdraw
          ? t("crypto.wallet.withdrawn")
          : t("crypto.wallet.deposited"),
      );
      void queryClient.invalidateQueries({ queryKey: ["crypto", "wallet"] });
      onClose();
    },
    onError: () => toast.error(t("crypto.wallet.transfer_failed")),
  });

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isWithdraw
              ? t("crypto.wallet.withdraw_title", { coin: holding.symbol })
              : t("crypto.wallet.deposit_title", { coin: holding.symbol })}
          </DialogTitle>
          <DialogDescription>
            {t("crypto.wallet.available")}:{" "}
            {formatNumber(holding.amount, locale)} {holding.symbol}
          </DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-4"
          onSubmit={form.handleSubmit((values) => {
            const result = schema.safeParse(values);
            if (!result.success) {
              for (const issue of result.error.issues) {
                form.setError(issue.path[0] as "amount" | "address", {
                  message: String(issue.message),
                });
              }
              return;
            }
            mutation.mutate(values);
          })}
        >
          <FormField
            name="amount"
            label={t("crypto.wallet.amount")}
            required
            error={
              form.formState.errors.amount && t("crypto.wallet.error.amount")
            }
          >
            <Input
              id="amount"
              type="number"
              step="any"
              min={0}
              {...form.register("amount", { valueAsNumber: true })}
            />
          </FormField>
          {isWithdraw ? (
            <FormField
              name="address"
              label={t("crypto.wallet.address")}
              required
              error={
                form.formState.errors.address &&
                t("crypto.wallet.error.address")
              }
            >
              <Input id="address" {...form.register("address")} />
            </FormField>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {isWithdraw
                ? t("crypto.wallet.withdraw")
                : t("crypto.wallet.deposit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
