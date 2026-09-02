export type LoyaltySettings = {
  earnGhsPerPoint: number;
  redeemPoints: number;
  redeemValueGhs: number;
  minRedeemPoints: number;
};

export const DEFAULT_LOYALTY_SETTINGS: LoyaltySettings = {
  earnGhsPerPoint: 10,
  redeemPoints: 100,
  redeemValueGhs: 10,
  minRedeemPoints: 100,
};

export function quoteRedeemDiscount(pointsToUse: number, settings: LoyaltySettings): number {
  if (pointsToUse < settings.minRedeemPoints) return 0;
  const blocks = Math.floor(pointsToUse / settings.redeemPoints);
  return Number((blocks * settings.redeemValueGhs).toFixed(2));
}

export function quoteEarnPoints(orderTotal: number, settings: LoyaltySettings): number {
  const total = Number(orderTotal);
  if (!Number.isFinite(total) || total <= 0) return 0;
  return Math.floor(total / settings.earnGhsPerPoint);
}
