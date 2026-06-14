import type { Rating } from "@/types";

export function calculateUpside(priceAtAnalysis: number, analystTarget: number): string {
  return (((analystTarget - priceAtAnalysis) / priceAtAnalysis) * 100).toFixed(0);
}

export const RATING_COLOR: Record<Rating, string> = {
  BULLISH: "var(--accent-green)",
  NEUTRAL: "var(--accent-amber)",
  BEARISH: "var(--accent-red)",
};

export const RATING_BG: Record<Rating, string> = {
  BULLISH: "rgba(63, 185, 80, 0.15)",
  NEUTRAL: "rgba(210, 153, 34, 0.15)",
  BEARISH: "rgba(248, 81, 73, 0.15)",
};
