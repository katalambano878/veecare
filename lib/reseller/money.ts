/** Integer pesewas (1 GHS = 100). Never use raw IEEE floats for money math. */

export function toPesewas(ghs: number | string | null | undefined): number {
  const n = Number(ghs);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
}

export function fromPesewas(pesewas: number): number {
  return Math.round(pesewas) / 100;
}

export function addPesewas(...parts: number[]): number {
  return parts.reduce((sum, part) => sum + Math.round(part), 0);
}

export function mulRatePesewas(basePesewas: number, percent: number): number {
  const rate = Number(percent);
  if (!Number.isFinite(rate) || rate <= 0) return 0;
  return Math.round((Math.round(basePesewas) * rate) / 100);
}
