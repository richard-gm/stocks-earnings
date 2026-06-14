"use client";

import type { KronosScore } from "@/lib/kronos";
import type { Rating } from "@/types";

const SIGNAL_STYLES: Record<Rating, { badge: string; text: string; border: string }> = {
  BULLISH: {
    badge: "bg-green-500/15 text-green-400 border border-green-500/30",
    text: "text-green-400",
    border: "border-green-500/40",
  },
  BEARISH: {
    badge: "bg-red-500/15 text-red-400 border border-red-500/30",
    text: "text-red-400",
    border: "border-red-500/40",
  },
  NEUTRAL: {
    badge: "bg-amber-500/15 text-amber-400 border border-amber-500/30",
    text: "text-amber-400",
    border: "border-amber-500/40",
  },
};

function Arrow({ signal }: { signal: Rating }) {
  if (signal === "BULLISH") return <>↑</>;
  if (signal === "BEARISH") return <>↓</>;
  return <>→</>;
}

interface KronosSignalProps {
  score: KronosScore | null;
  expanded?: boolean;
}

export default function KronosSignal({ score, expanded = false }: KronosSignalProps) {
  if (!score) return null;

  const styles = SIGNAL_STYLES[score.signal];
  const sign = score.predicted_return > 0 ? "+" : "";
  const formattedReturn = `${sign}${score.predicted_return.toFixed(2)}%`;

  if (!expanded) {
    const showVolSpike = score.volume_spike_ratio != null && score.volume_spike_ratio >= 1.5;
    return (
      <span className="inline-flex items-center gap-1.5">
        <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${styles.badge}`}>
          <Arrow signal={score.signal} />
          Kronos {formattedReturn}
        </span>
        {showVolSpike && (
          <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/30">
            Vol ×{score.volume_spike_ratio!.toFixed(1)}
          </span>
        )}
      </span>
    );
  }

  return (
    <div
      className={`rounded-xl border p-5 ${styles.border}`}
      style={{ backgroundColor: "var(--surface)" }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
          Kronos AI Signal
        </h3>
        <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${styles.badge}`}>
          <Arrow signal={score.signal} />
          {score.signal}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs mb-0.5" style={{ color: "var(--text-muted)" }}>
            Predicted return ({score.pred_days}d)
          </p>
          <p className={`text-2xl font-extrabold ${styles.text}`}>{formattedReturn}</p>
        </div>
        <div>
          <p className="text-xs mb-0.5" style={{ color: "var(--text-muted)" }}>Predicted close</p>
          <p className="text-2xl font-extrabold">${score.predicted_close.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-xs mb-0.5" style={{ color: "var(--text-muted)" }}>Last close (at run)</p>
          <p className="font-semibold">${score.last_close.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-xs mb-0.5" style={{ color: "var(--text-muted)" }}>Last scored</p>
          <p className="font-semibold text-sm">
            {new Date(score.run_at).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </p>
        </div>
      </div>

      {score.volume_spike_ratio != null && (
        <div className="mt-3 pt-3 border-t flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
          <div>
            <p className="text-xs mb-0.5" style={{ color: "var(--text-muted)" }}>Volume signal</p>
            <p className="font-semibold text-sm">
              {score.volume_spike_ratio >= 1.5
                ? `⚡ Spike ×${score.volume_spike_ratio.toFixed(1)} vs 20d avg`
                : score.volume_spike_ratio <= 0.7
                  ? `↓ Low ×${score.volume_spike_ratio.toFixed(1)} vs 20d avg`
                  : `Normal ×${score.volume_spike_ratio.toFixed(1)} vs 20d avg`}
            </p>
          </div>
          {score.volume_spike_ratio >= 1.5 && (
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/30">
              High Vol
            </span>
          )}
        </div>
      )}

      <p className="text-xs mt-3 pt-3 border-t" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>
        AI signal only — not financial advice. {score.pred_days}-day OHLCV forecast via Kronos foundation model.
      </p>
    </div>
  );
}
