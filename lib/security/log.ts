/** Never serialize provider/database exceptions: they can include credentials, codes or user input. */
export function logFailure(scope: string, error?: unknown) {
  const code = (error as { code?: unknown } | null)?.code
  console.error('[operation failed]', { scope, requestId: crypto.randomUUID(), ...(typeof code === 'string' && /^[0-9A-Z]{5}$/.test(code) ? { code } : {}) })
}
