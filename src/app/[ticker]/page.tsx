import Link from "next/link";
import { notFound } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";
import RunAnalysisButton from "@/components/RunAnalysisButton";
import KronosSignal from "@/components/KronosSignal";
import { EarningsSection } from "@/components/EarningsSection";
import { getStock, getAllStocks } from "@/lib/stocks";
import { getKronosScore } from "@/lib/kronos";
import { calculateUpside } from "@/lib/utils";
import type { DilutionInfo, ExpiryComparison, InsiderFlow, TechnicalSetup, WheelStrategy } from "@/types";

export async function generateStaticParams() {
  return (await getAllStocks()).map((s) => ({ ticker: s.ticker }));
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border rounded-xl overflow-hidden" style={{ borderColor: "var(--border)" }}>
      <div
        className="px-5 py-3 border-b font-semibold text-sm uppercase tracking-wider"
        style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)", color: "var(--text-muted)" }}
      >
        {title}
      </div>
      <div className="px-5 py-4" style={{ backgroundColor: "var(--bg)" }}>
        {children}
      </div>
    </section>
  );
}

export default async function TickerPage({
  params,
}: {
  params: Promise<{ ticker: string }>;
}) {
  const { ticker } = await params;

  const [stock, kronosScore] = await Promise.all([
    getStock(ticker),
    getKronosScore(ticker),
  ]);

  if (!stock) notFound();

  const rec = stock.recommendation;
  const upside = calculateUpside(stock.priceAtAnalysis, stock.analystTarget);

  const insiderFlow = stock.insiderFlow as InsiderFlow | undefined;
  const wheel = stock.wheelStrategy as WheelStrategy | undefined;
  const expiry = stock.expiryComparison as ExpiryComparison | undefined;
  const isDilutionObject = typeof stock.dilution === "object";
  const dilutionInfo = isDilutionObject ? (stock.dilution as DilutionInfo) : null;
  const dilutionString = !isDilutionObject ? (stock.dilution as string) : null;
  const technicalSetup = stock.technicalSetup as TechnicalSetup | undefined;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}>
      <header
        className="border-b px-6 py-4 flex items-center justify-between sticky top-0 z-10 backdrop-blur-sm"
        style={{ borderColor: "var(--border)", backgroundColor: "var(--bg)" }}
      >
        <div className="flex items-center gap-3">
          <Link href="/" className="text-sm hover:underline" style={{ color: "var(--text-muted)" }}>
            ← Dashboard
          </Link>
          <span style={{ color: "var(--border)" }}>|</span>
          <div>
            <span className="text-xl font-extrabold" style={{ color: "var(--accent)" }}>
              {stock.ticker}
            </span>
            <span className="ml-2 font-medium">{stock.company}</span>
            <span className="ml-2 text-xs" style={{ color: "var(--text-muted)" }}>
              {stock.sector} · Analysis:{" "}
              {new Date(stock.analysisDate + "T12:00:00").toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <RunAnalysisButton ticker={stock.ticker} />
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 flex flex-col gap-6">
        {/* Trade recommendation card */}
        <div
          className="rounded-2xl border-2 p-6 relative overflow-hidden"
          style={{ borderColor: "var(--accent-green)", backgroundColor: "var(--surface)" }}
        >
          <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: "var(--accent-green)" }} />
          <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "var(--accent-green)" }}>
                {wheel ? "Calls / Spreads — Secondary Strategy" : "Options Strategy — Recommended Trade"}
              </p>
              <h2 className="text-xl font-bold">{rec.title}</h2>
            </div>
            <div className="text-right">
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Analyst Target</p>
              <p className="text-2xl font-extrabold" style={{ color: "var(--accent-green)" }}>
                ${stock.analystTarget.toFixed(2)}
              </p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                +{upside}% from ${stock.priceAtAnalysis.toFixed(2)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
            {[
              { label: "Strike", value: `$${rec.strike}` },
              { label: "Type", value: rec.type },
              { label: "Expiry", value: rec.expiry },
              { label: "Est. Premium", value: rec.estimatedPremium },
              { label: "Contract Cost", value: rec.contractCost },
              { label: "Delta", value: rec.delta.toFixed(2) },
              { label: "Breakeven", value: rec.breakeven },
            ].map((item) => (
              <div key={item.label} className="rounded-lg px-3 py-2" style={{ backgroundColor: "var(--bg)" }}>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>{item.label}</p>
                <p className="font-bold text-sm mt-0.5">{item.value}</p>
              </div>
            ))}
          </div>

          <div
            className="rounded-lg px-4 py-3 mb-5 border-l-4"
            style={{ backgroundColor: "var(--bg)", borderLeftColor: "var(--accent-amber)" }}
          >
            <p className="text-xs font-bold mb-1" style={{ color: "var(--accent-amber)" }}>ENTRY NOTE</p>
            <p className="text-sm">{rec.entryNote}</p>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>
              Staggered Exit Plan
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              {rec.exitPlan.map((step, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-lg px-4 py-3 border"
                  style={{
                    backgroundColor: "var(--bg)",
                    borderColor: i === 0 ? "var(--accent-amber)" : "var(--accent-green)",
                  }}
                >
                  <p className="text-xs font-bold mb-1" style={{ color: i === 0 ? "var(--accent-amber)" : "var(--accent-green)" }}>
                    {step.label}
                  </p>
                  <p className="text-sm font-medium">{step.trigger}</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                    Option gain: {step.optionGain}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {kronosScore && <KronosSignal score={kronosScore} expanded />}

        {/* Expiry Comparison */}
        {expiry && (
          <Section title="Expiry Comparison — Which DTE to Choose">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              {[
                { label: "Strike", value: `$${expiry.strike}` },
                { label: "Stock Price", value: `$${expiry.underlyingPrice}` },
                { label: "IV", value: expiry.iv },
                { label: "Next Earnings", value: expiry.earningsDate },
              ].map((item) => (
                <div key={item.label} className="rounded-lg px-3 py-2" style={{ backgroundColor: "var(--surface)" }}>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>{item.label}</p>
                  <p className="font-bold text-sm mt-0.5">{item.value}</p>
                </div>
              ))}
            </div>

            <div className="overflow-x-auto -mx-1 mb-5">
              <table className="w-full text-sm min-w-[580px]">
                <thead>
                  <tr className="text-xs uppercase" style={{ color: "var(--text-muted)", borderBottom: "1px solid var(--border)" }}>
                    <th className="pb-2 text-left font-semibold">Expiry</th>
                    <th className="pb-2 text-right font-semibold">Days Total</th>
                    <th className="pb-2 text-right font-semibold">Days Left at Close</th>
                    <th className="pb-2 text-right font-semibold">Premium</th>
                    <th className="pb-2 text-right font-semibold">Stock Flat</th>
                    <th className="pb-2 text-right font-semibold">At Target</th>
                    <th className="pb-2 text-left font-semibold pl-4">Best For</th>
                  </tr>
                </thead>
                <tbody>
                  {expiry.options.map((opt, i) => (
                    <tr
                      key={i}
                      className="border-b last:border-0"
                      style={{
                        borderColor: "var(--border)",
                        backgroundColor: opt.recommended ? "rgba(63, 185, 80, 0.08)" : "transparent",
                      }}
                    >
                      <td className="py-2.5 font-bold" style={{ color: opt.recommended ? "var(--accent-green)" : undefined }}>
                        {opt.expiry}{opt.recommended ? " ⭐" : ""}
                      </td>
                      <td className="py-2.5 text-right">{opt.daysTotal}</td>
                      <td
                        className="py-2.5 text-right font-semibold"
                        style={{ color: opt.daysLeftAtClose < 30 ? "var(--accent-red)" : opt.daysLeftAtClose < 45 ? "var(--accent-amber)" : "var(--accent-green)" }}
                      >
                        {opt.daysLeftAtClose} days
                      </td>
                      <td className="py-2.5 text-right">{opt.premiumEst}</td>
                      <td className="py-2.5 text-right font-semibold" style={{ color: "var(--accent-red)" }}>
                        {opt.flatScenario}
                      </td>
                      <td
                        className="py-2.5 text-right font-semibold"
                        style={{ color: opt.atTarget.startsWith("+") ? "var(--accent-green)" : "var(--accent-red)" }}
                      >
                        {opt.atTarget}
                      </td>
                      <td className="py-2.5 pl-4 text-xs" style={{ color: "var(--text-muted)" }}>{opt.bestFor}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>
                Exit Rules — Recommended Expiry
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { icon: "▶", label: "Entry Trigger", value: expiry.exitRules.entryTrigger, color: "var(--accent-blue, #3b82f6)" },
                  { icon: "✅", label: "Profit Exit", value: expiry.exitRules.profitExit, color: "var(--accent-green)" },
                  { icon: "⏱", label: "50% Time Stop", value: expiry.exitRules.timeStop, color: "var(--accent-amber)" },
                  { icon: "🛑", label: "Loss Stop", value: expiry.exitRules.lossStop, color: "var(--accent-red)" },
                  { icon: "📅", label: "Earnings Hard Stop", value: expiry.exitRules.earningsHardStop, color: "var(--accent-amber)" },
                ].map((rule) => (
                  <div
                    key={rule.label}
                    className="rounded-lg px-4 py-3 border-l-4"
                    style={{ backgroundColor: "var(--surface)", borderLeftColor: rule.color }}
                  >
                    <p className="text-xs font-bold mb-0.5" style={{ color: rule.color }}>{rule.icon} {rule.label}</p>
                    <p className="text-sm">{rule.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </Section>
        )}

        {/* Wheel Strategy */}
        {wheel && (
          <div
            className="rounded-2xl border-2 p-6 relative overflow-hidden"
            style={{
              borderColor: wheel.eligible ? "var(--accent-blue, #3b82f6)" : "var(--border)",
              backgroundColor: "var(--surface)",
              opacity: wheel.eligible ? 1 : 0.85,
            }}
          >
            <div
              className="absolute top-0 left-0 right-0 h-1"
              style={{ backgroundColor: wheel.eligible ? "var(--accent-blue, #3b82f6)" : "var(--text-muted)" }}
            />
            <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "var(--accent-blue, #3b82f6)" }}>
                  Wheel Strategy — Primary
                </p>
                <h2 className="text-lg font-bold">
                  {wheel.eligible ? "Cash-Secured Put → Covered Call" : "⛔ Wheel Not Applicable — Stock Price Exceeds Capital Threshold"}
                </h2>
              </div>
              {wheel.wheelFlag && (
                <span
                  className="text-xs font-bold px-3 py-1.5 rounded-full border"
                  style={{ borderColor: "var(--accent-red)", color: "var(--accent-red)", backgroundColor: "rgba(255,80,80,0.08)" }}
                >
                  ⚠️ {wheel.wheelFlag}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <div className="rounded-lg px-3 py-2.5" style={{ backgroundColor: "var(--bg)" }}>
                <p className="text-xs font-semibold mb-0.5" style={{ color: "var(--text-muted)" }}>Market Condition (VIX)</p>
                <p className="text-sm font-bold">{wheel.vixNote}</p>
              </div>
              <div className="rounded-lg px-3 py-2.5" style={{ backgroundColor: "var(--bg)" }}>
                <p className="text-xs font-semibold mb-0.5" style={{ color: "var(--text-muted)" }}>Bollinger Band Entry</p>
                <p className="text-sm font-bold">{wheel.bollingerEntry}</p>
              </div>
            </div>

            {wheel.ineligibleReason && (
              <div className="rounded-lg px-4 py-3 text-sm" style={{ backgroundColor: "var(--bg)", color: "var(--text-muted)" }}>
                {wheel.ineligibleReason}
              </div>
            )}

            {wheel.eligible && wheel.csp && (
              <div className="flex flex-col sm:flex-row gap-3">
                <div
                  className="flex-1 rounded-xl border p-4"
                  style={{ borderColor: "var(--accent-blue, #3b82f6)", backgroundColor: "var(--bg)" }}
                >
                  <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "var(--accent-blue, #3b82f6)" }}>
                    Leg 1 — Sell Cash-Secured Put
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: "Strike", value: wheel.csp.strike },
                      { label: "Delta", value: wheel.csp.delta },
                      { label: "DTE", value: wheel.csp.dte },
                      { label: "Est. Premium", value: wheel.csp.estimatedPremium },
                      ...(wheel.csp.annualisedYield ? [{ label: "Ann. Yield", value: wheel.csp.annualisedYield }] : []),
                    ].map((item) => (
                      <div key={item.label}>
                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>{item.label}</p>
                        <p className="font-bold text-sm">{item.value}</p>
                      </div>
                    ))}
                  </div>
                  {wheel.csp.exitRule && (
                    <p className="text-xs mt-3 pt-3 border-t" style={{ borderColor: "var(--border)", color: "var(--accent-amber)" }}>
                      ⏱ {wheel.csp.exitRule}
                    </p>
                  )}
                </div>

                {wheel.coveredCall && (
                  <div className="flex-1 rounded-xl border p-4" style={{ borderColor: "var(--border)", backgroundColor: "var(--bg)" }}>
                    <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
                      Leg 2 — Sell Covered Call (if assigned)
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: "Strike", value: wheel.coveredCall.strike },
                        { label: "Delta", value: wheel.coveredCall.delta },
                        { label: "DTE", value: wheel.coveredCall.dte },
                        { label: "Est. Premium", value: wheel.coveredCall.estimatedPremium },
                      ].map((item) => (
                        <div key={item.label}>
                          <p className="text-xs" style={{ color: "var(--text-muted)" }}>{item.label}</p>
                          <p className="font-bold text-sm">{item.value}</p>
                        </div>
                      ))}
                    </div>
                    {wheel.coveredCall.note && (
                      <p className="text-xs mt-3 pt-3 border-t" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>
                        {wheel.coveredCall.note}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Strike comparison table */}
        <Section title="Strike Comparison Table (Calls / Spreads)">
          <div className="overflow-x-auto -mx-1">
            <table className="w-full text-sm min-w-[560px]">
              <thead>
                <tr className="text-xs uppercase" style={{ color: "var(--text-muted)", borderBottom: `1px solid var(--border)` }}>
                  <th className="pb-2 text-left font-semibold">Strike</th>
                  <th className="pb-2 text-left font-semibold">Type</th>
                  <th className="pb-2 text-right font-semibold">Premium</th>
                  <th className="pb-2 text-right font-semibold">Delta</th>
                  <th className="pb-2 text-right font-semibold">2x Cost</th>
                  <th className="pb-2 text-right font-semibold">Breakeven</th>
                  <th className="pb-2 text-right font-semibold">At Target</th>
                </tr>
              </thead>
              <tbody>
                {stock.strikeTable.map((row) => (
                  <tr
                    key={row.strike}
                    className="border-b last:border-0"
                    style={{
                      borderColor: "var(--border)",
                      backgroundColor: row.isRecommended ? "rgba(63, 185, 80, 0.08)" : "transparent",
                    }}
                  >
                    <td className="py-2.5 font-bold" style={{ color: row.isRecommended ? "var(--accent-green)" : undefined }}>
                      {row.strike}
                    </td>
                    <td className="py-2.5 text-xs">{row.type}{row.isRecommended ? " ✅" : ""}</td>
                    <td className="py-2.5 text-right">{row.premium}</td>
                    <td className="py-2.5 text-right">{row.delta.toFixed(2)}</td>
                    <td className="py-2.5 text-right">{row.contracts2Cost}</td>
                    <td className="py-2.5 text-right">{row.breakeven}</td>
                    <td
                      className="py-2.5 text-right font-semibold"
                      style={{ color: row.atTarget.startsWith("+") ? "var(--accent-green)" : "var(--accent-red)" }}
                    >
                      {row.atTarget}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs mt-3" style={{ color: "var(--text-muted)" }}>
            "At Target" column = analyst consensus price target. Black-Scholes estimates with 90 days to expiry remaining at exit.
          </p>
        </Section>

        <Section title="Company Overview">
          <p className="text-sm leading-relaxed">{stock.companyOverview}</p>
        </Section>

        <Section title="Financial Snapshot">
          <div className="overflow-x-auto -mx-1">
            <table className="w-full text-sm">
              <tbody>
                {stock.financials.map((row, i) => (
                  <tr key={i} className="border-b last:border-0" style={{ borderColor: "var(--border)" }}>
                    <td className="py-2.5 pr-4 font-medium w-1/2 sm:w-auto" style={{ color: "var(--text-muted)" }}>
                      {row.metric}
                    </td>
                    <td className="py-2.5 font-bold">{row.value}</td>
                    {row.note && (
                      <td className="py-2.5 pl-4 text-xs" style={{ color: "var(--text-muted)" }}>{row.note}</td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        {insiderFlow && (
          <Section title="Insider Flow (Form 4)">
            <div className="flex flex-col gap-4">
              <div
                className="rounded-lg px-4 py-3 border-l-4"
                style={{
                  backgroundColor: "var(--bg)",
                  borderLeftColor: insiderFlow.signal.startsWith("🔴")
                    ? "var(--accent-red)"
                    : insiderFlow.signal.startsWith("YELLOW") || insiderFlow.signal.startsWith("⚠️")
                    ? "var(--accent-amber)"
                    : "var(--accent-green)",
                }}
              >
                <p
                  className="text-xs font-bold mb-1 uppercase tracking-wider"
                  style={{
                    color: insiderFlow.signal.startsWith("🔴")
                      ? "var(--accent-red)"
                      : insiderFlow.signal.startsWith("YELLOW") || insiderFlow.signal.startsWith("⚠️")
                      ? "var(--accent-amber)"
                      : "var(--accent-green)",
                  }}
                >
                  Signal: {insiderFlow.signal}
                </p>
                <p className="text-sm">{insiderFlow.summary}</p>
              </div>
              <div className="overflow-x-auto -mx-1">
                <table className="w-full text-sm min-w-[560px]">
                  <thead>
                    <tr className="text-xs uppercase" style={{ color: "var(--text-muted)", borderBottom: `1px solid var(--border)` }}>
                      <th className="pb-2 text-left font-semibold">Insider</th>
                      <th className="pb-2 text-left font-semibold">Action</th>
                      <th className="pb-2 text-right font-semibold">Shares</th>
                      <th className="pb-2 text-right font-semibold">Price</th>
                      <th className="pb-2 text-right font-semibold">Value</th>
                      <th className="pb-2 text-left font-semibold pl-4">Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {insiderFlow.transactions.map((tx, i) => (
                      <tr key={i} className="border-b last:border-0" style={{ borderColor: "var(--border)" }}>
                        <td className="py-2.5 font-medium pr-3">{tx.insider}</td>
                        <td
                          className="py-2.5 font-bold text-xs pr-3"
                          style={{
                            color: tx.action === "BUY"
                              ? "var(--accent-green)"
                              : tx.action.startsWith("SELL") || tx.action.includes("SELL")
                              ? "var(--accent-red)"
                              : "var(--text-muted)",
                          }}
                        >
                          {tx.action}
                        </td>
                        <td className="py-2.5 text-right">{tx.shares > 0 ? tx.shares.toLocaleString() : "—"}</td>
                        <td className="py-2.5 text-right">{tx.price}</td>
                        <td className="py-2.5 text-right font-semibold">{tx.value}</td>
                        <td className="py-2.5 pl-4 text-xs" style={{ color: "var(--text-muted)" }}>{tx.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Section>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Section title="Bullish Catalysts">
            <ul className="flex flex-col gap-2">
              {stock.catalysts.map((c, i) => (
                <li key={i} className="flex gap-2 text-sm">
                  <span style={{ color: "var(--accent-green)" }}>▲</span>
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </Section>

          <Section title="Risk Factors">
            <ul className="flex flex-col gap-2">
              {stock.risks.map((r, i) => (
                <li key={i} className="flex gap-2 text-sm">
                  <span style={{ color: "var(--accent-red)" }}>▼</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </Section>
        </div>

        {technicalSetup && (
          <Section title="Technical Setup">
            <div className="flex flex-col gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>Pattern</p>
                <p className="font-semibold">{technicalSetup.pattern}</p>
                <p className="text-sm mt-1 leading-relaxed" style={{ color: "var(--text-muted)" }}>
                  {technicalSetup.description}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>Key Levels</p>
                <div className="flex flex-col gap-2">
                  {technicalSetup.keyLevels.map((lvl, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 rounded-lg px-4 py-3 border-l-4"
                      style={{
                        backgroundColor: "var(--surface)",
                        borderLeftColor:
                          lvl.type === "Support" ? "var(--accent-green)"
                          : lvl.type === "Resistance" ? "var(--accent-red)"
                          : "var(--accent-amber)",
                      }}
                    >
                      <div className="shrink-0 text-right min-w-[72px]">
                        <p className="font-bold">{lvl.level}</p>
                        <p
                          className="text-xs font-semibold"
                          style={{
                            color:
                              lvl.type === "Support" ? "var(--accent-green)"
                              : lvl.type === "Resistance" ? "var(--accent-red)"
                              : "var(--accent-amber)",
                          }}
                        >
                          {lvl.type}
                        </p>
                      </div>
                      <p className="text-sm">{lvl.note}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Section>
        )}

        <EarningsSection ticker={stock.ticker} />

        <Section title="Dilution / Capital Structure">
          {dilutionString && <p className="text-sm">{dilutionString}</p>}
          {dilutionInfo && (
            <div className="flex flex-col gap-3">
              <p className="text-sm font-semibold">{dilutionInfo.summary}</p>
              {dilutionInfo.items.map((item, i) => (
                <div key={i} className="rounded-lg px-4 py-3" style={{ backgroundColor: "var(--surface)" }}>
                  <p className="font-semibold text-sm mb-0.5">{item.label}</p>
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>{item.detail}</p>
                </div>
              ))}
            </div>
          )}
        </Section>
      </main>

      <footer
        className="border-t mt-12 px-6 py-4 text-center text-xs"
        style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
      >
        All option prices are Black-Scholes estimates. Verify on IBKR/Tastytrade before entering. Not financial advice.
      </footer>
    </div>
  );
}
