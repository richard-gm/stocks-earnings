export function computeActualMovePercent(
  priceBefore: number,
  priceAfter: number
): number {
  return parseFloat((((priceAfter - priceBefore) / priceBefore) * 100).toFixed(2));
}
