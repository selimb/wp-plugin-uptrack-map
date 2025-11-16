export function log(
  level: "info" | "warn" | "error",
  ...args: unknown[]
): void {
  // eslint-disable-next-line no-console -- Need to log somehow!
  console[level]("[UptrackMap]", ...args);
}

export function err(message: string, options?: ErrorOptions): Error {
  return new Error(`[UptrackMap] ${message}`, options);
}
