// Generic exponential-backoff retry. Used for RAG calls.
async function withRetry(fn, { retries = 2, baseMs = 250, factor = 2, retryOn = () => true } = {}) {
  let attempt = 0;
  let lastErr;
  while (attempt <= retries) {
    try {
      return await fn(attempt);
    } catch (err) {
      lastErr = err;
      if (attempt === retries || !retryOn(err)) break;
      const delay = baseMs * Math.pow(factor, attempt);
      await new Promise((r) => setTimeout(r, delay));
      attempt += 1;
    }
  }
  throw lastErr;
}
module.exports = { withRetry };
