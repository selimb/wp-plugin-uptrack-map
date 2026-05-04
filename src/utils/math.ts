export function clamp(v: number, min: number, max: number): number {
  // eslint-disable-next-line unicorn/prefer-math-min-max -- This is simpler.
  return v < min ? min : v > max ? max : v;
}
