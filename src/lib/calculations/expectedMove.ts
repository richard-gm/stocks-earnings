export function computeExpectedMovePercent(
  atmCallPrice: number,
  atmPutPrice: number,
  stockPrice: number
): number {
  return parseFloat((((atmCallPrice + atmPutPrice) / stockPrice) * 100).toFixed(2));
}

export function ivProxyExpectedMove(
  annualizedIV: number,
  daysToEarnings: number
): number {
  return parseFloat((annualizedIV * Math.sqrt(daysToEarnings / 365) * 100).toFixed(2));
}
