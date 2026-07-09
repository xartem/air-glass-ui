import { useEffect, useState } from "react";

import { t } from "@/lib/i18n";

/*
 * Compact days/hours/minutes/seconds countdown to a target time. Used by the
 * maintenance and coming-soon splash pages.
 */

function parts(msLeft: number) {
  const clamped = Math.max(0, msLeft);
  const seconds = Math.floor(clamped / 1000);
  return {
    days: Math.floor(seconds / 86400),
    hours: Math.floor((seconds % 86400) / 3600),
    minutes: Math.floor((seconds % 3600) / 60),
    seconds: seconds % 60,
  };
}

export function Countdown({ target }: { target: number }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const { days, hours, minutes, seconds } = parts(target - now);
  const cells: Array<[number, string]> = [
    [days, t("countdown.days")],
    [hours, t("countdown.hours")],
    [minutes, t("countdown.minutes")],
    [seconds, t("countdown.seconds")],
  ];

  return (
    <div className="flex items-center justify-center gap-3">
      {cells.map(([value, label]) => (
        <div
          key={label}
          className="glass-card flex min-w-16 flex-col items-center rounded-xl px-3 py-2"
        >
          <span className="text-2xl font-semibold tabular-nums">
            {String(value).padStart(2, "0")}
          </span>
          <span className="text-xs text-muted-foreground">{label}</span>
        </div>
      ))}
    </div>
  );
}
