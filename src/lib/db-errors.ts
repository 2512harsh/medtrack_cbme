// drizzle-orm wraps the underlying Postgres driver error in `.cause` (the
// thrown error's own message is just "Failed query: ..."), so the Postgres
// error code lives at err.cause.code, not err.code directly.
export function isUniqueViolation(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const code = (err as { code?: unknown }).code ?? (err.cause as { code?: unknown } | undefined)?.code;
  return code === "23505";
}
