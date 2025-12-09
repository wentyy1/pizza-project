export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function backoff(base, attempt, jitter) {
  const ms = base * 2 ** attempt;
  return jitter ? ms + Math.floor(Math.random() * 100) : ms;
}

export async function fetchWithResilience(
  url,
  opts = {}
) {
  const {
    retry = {},
    idempotencyKey,
    requestId,
    ...init
  } = opts;

  const {
    retries = 2,
    baseDelayMs = 300,
    timeoutMs = 3500,
    jitter = true
  } = retry;

  const headers = new Headers(init.headers || {});
  headers.set("Content-Type", "application/json");

  if (idempotencyKey) headers.set("Idempotency-Key", idempotencyKey);
  headers.set("X-Request-Id", requestId ?? crypto.randomUUID());

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      ...init,
      headers,
      signal: controller.signal
    });

    // 429 Retry-After
    if (res.status === 429 && retries >= 1) {
      const wait = Number(res.headers.get("Retry-After") || 1) * 1000;
      await sleep(wait);
      return fetchWithResilience(url, {
        ...opts,
        retry: { ...retry, retries: retries - 1 }
      });
    }

    // 5xx => backoff retry
    if ([500, 502, 503, 504].includes(res.status) && retries >= 1) {
      const attempt = opts.__attempt ?? 0;
      await sleep(backoff(baseDelayMs, attempt, jitter));
      return fetchWithResilience(url, {
        ...opts,
        __attempt: attempt + 1,
        retry: { ...retry, retries: retries - 1 }
      });
    }

    return res;

  } catch (err) {
    // Network/timeout => retry
    if (retries >= 1) {
      const attempt = opts.__attempt ?? 0;
      await sleep(backoff(baseDelayMs, attempt, jitter));
      return fetchWithResilience(url, {
        ...opts,
        __attempt: attempt + 1,
        retry: { ...retry, retries: retries - 1 }
      });
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}
