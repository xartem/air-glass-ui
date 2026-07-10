import { useEffect, useRef, useState } from "react";
import {
  CircleAlert,
  Copy,
  Info,
  Link2,
  Wallet as WalletIcon,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Spinner } from "@/components/ui/spinner";
import { devDebug } from "@/lib/debug";
import { formatNumber } from "@/lib/money";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";
import { cn } from "@/lib/utils";

/*
 * /nft/wallet-connect — connect-wallet demo. A provider grid transitions through
 * connecting → connected (address + balance + copy) with a mock rejection path.
 * All state is local (no server call). Reachable with nft.view.
 */

interface Provider {
  id: string;
  /** Tile gradient stops — chart tokens so both themes adapt automatically. */
  gradient: [string, string];
}

const PROVIDERS: Provider[] = [
  { id: "metamask", gradient: ["var(--chart-3)", "var(--chart-4)"] },
  { id: "walletconnect", gradient: ["var(--chart-1)", "var(--chart-2)"] },
  { id: "coinbase", gradient: ["var(--chart-5)", "var(--chart-1)"] },
];

/** Pastel tile fill: chart tokens softened over the card so text keeps contrast in both themes. */
function tileGradient([from, to]: [string, string]): string {
  return `linear-gradient(135deg, color-mix(in srgb, ${from} 45%, transparent), color-mix(in srgb, ${to} 45%, transparent))`;
}

type ConnState =
  | { phase: "idle" }
  | { phase: "connecting"; provider: string }
  | { phase: "connected"; provider: string; address: string; balance: number }
  | { phase: "error"; provider: string };

export function NftWalletConnectPage() {
  const locale = useLocale();
  const [simulateReject, setSimulateReject] = useState(false);
  const [state, setState] = useState<ConnState>({ phase: "idle" });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  function connect(provider: string) {
    devDebug("[NftWalletConnect] connect", { provider, simulateReject });
    setState({ phase: "connecting", provider });
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      if (simulateReject) {
        setState({ phase: "error", provider });
        toast.error(t("nft.walletConnect.rejected"));
        return;
      }
      setState({
        phase: "connected",
        provider,
        address: `0x${provider.slice(0, 4)}7c9a2f18Ee0b3D4c5A6b7C8d9E0f1A2b3C4d5E6`,
        balance: 4.28,
      });
      toast.success(t("nft.walletConnect.connected"));
    }, 1200);
  }

  function disconnect() {
    setState({ phase: "idle" });
  }

  async function copyAddress(address: string) {
    try {
      await navigator.clipboard.writeText(address);
      toast.success(t("nft.walletConnect.address_copied"));
    } catch {
      toast.error(t("common.request_failed"));
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader title={t("nft.walletConnect.title")} icon={Link2} />

      <div className="grid items-start gap-4 lg:grid-cols-[1fr_20rem]">
        <Panel
          icon={WalletIcon}
          title={t("nft.walletConnect.providers")}
          description={t("nft.walletConnect.providers_hint")}
        >
          {state.phase === "connected" ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span
                  className="flex size-12 items-center justify-center rounded-2xl text-sm font-semibold text-foreground/70"
                  style={{
                    background: tileGradient(providerGradient(state.provider)),
                  }}
                >
                  {t(`nft.walletConnect.provider.${state.provider}`).slice(
                    0,
                    2,
                  )}
                </span>
                <div>
                  <div className="font-medium">
                    {t(`nft.walletConnect.provider.${state.provider}`)}
                  </div>
                  <div className="text-xs text-[var(--status-success-fg)]">
                    {t("nft.walletConnect.status_connected")}
                  </div>
                </div>
              </div>
              <dl className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-[var(--glass-border)] p-3">
                  <dt className="text-xs uppercase text-muted-foreground">
                    {t("nft.walletConnect.address")}
                  </dt>
                  <dd className="mt-1 flex items-center gap-1.5">
                    <code className="truncate font-mono text-xs">
                      {state.address.slice(0, 10)}…{state.address.slice(-6)}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={t("nft.walletConnect.copy")}
                      onClick={() => void copyAddress(state.address)}
                    >
                      <Copy className="size-3.5" />
                    </Button>
                  </dd>
                </div>
                <div className="rounded-xl border border-[var(--glass-border)] p-3">
                  <dt className="text-xs uppercase text-muted-foreground">
                    {t("nft.walletConnect.balance")}
                  </dt>
                  <dd className="mt-1 font-semibold tabular-nums">
                    {formatNumber(state.balance, locale)} ETH
                  </dd>
                </div>
              </dl>
              <Button variant="outline" onClick={disconnect}>
                {t("nft.walletConnect.disconnect")}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                {PROVIDERS.map((provider) => {
                  const connecting =
                    state.phase === "connecting" &&
                    state.provider === provider.id;
                  return (
                    <button
                      key={provider.id}
                      type="button"
                      disabled={state.phase === "connecting"}
                      onClick={() => connect(provider.id)}
                      className={cn(
                        "glass-card flex flex-col items-center gap-3 rounded-2xl p-5 text-center transition-shadow hover:shadow-md disabled:opacity-60",
                      )}
                    >
                      <span
                        className="flex size-12 items-center justify-center rounded-2xl text-sm font-semibold text-foreground/70"
                        style={{
                          background: tileGradient(provider.gradient),
                        }}
                      >
                        {connecting ? (
                          <Spinner className="size-5" />
                        ) : (
                          t(`nft.walletConnect.provider.${provider.id}`).slice(
                            0,
                            2,
                          )
                        )}
                      </span>
                      <span className="text-sm font-medium">
                        {t(`nft.walletConnect.provider.${provider.id}`)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {connecting
                          ? t("nft.walletConnect.connecting")
                          : t("nft.walletConnect.connect")}
                      </span>
                    </button>
                  );
                })}
              </div>

              {state.phase === "error" ? (
                <div className="flex items-start gap-2 rounded-xl border border-[var(--status-error-bg)] bg-[var(--status-error-bg)] p-3 text-sm text-[var(--status-error-fg)]">
                  <CircleAlert className="mt-0.5 size-4 shrink-0" />
                  <div>
                    <div className="font-medium">
                      {t("nft.walletConnect.error_title")}
                    </div>
                    <div className="text-xs">
                      {t("nft.walletConnect.error_hint")}
                    </div>
                  </div>
                </div>
              ) : null}

              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <Checkbox
                  checked={simulateReject}
                  onCheckedChange={(value) => setSimulateReject(value === true)}
                />
                {t("nft.walletConnect.simulate_reject")}
              </label>
            </div>
          )}
        </Panel>

        <Panel
          icon={Info}
          title={t("nft.walletConnect.info_title")}
          className="lg:sticky lg:top-4"
        >
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li>{t("nft.walletConnect.info_1")}</li>
            <li>{t("nft.walletConnect.info_2")}</li>
            <li>{t("nft.walletConnect.info_3")}</li>
          </ul>
        </Panel>
      </div>
    </div>
  );
}

function providerGradient(id: string): [string, string] {
  return (
    PROVIDERS.find((provider) => provider.id === id)?.gradient ?? [
      "var(--chart-1)",
      "var(--chart-2)",
    ]
  );
}
