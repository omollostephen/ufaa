export async function checkSystemStatus(system) {
  // If system defines a ussdCode, use server-side USSD probe
  if (system && system.ussdCode) {
    try {
      const body = { code: system.ussdCode, phone: system.testPhone || '' }
      const res = await fetch('/api/health/ussd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        return {
          up: null,
          statusCode: res.status,
          latency: null,
          checkedAt: new Date().toISOString(),
          details: `USSD proxy returned ${res.status}`,
        }
      }
      const j = await res.json()
      return {
        up: j.up === true,
        statusCode: null,
        latency: j.latencyMs || null,
        checkedAt: j.checkedAt || new Date().toISOString(),
        details: j.details || 'USSD probe result',
      }
    } catch (e) {
      return {
        up: null,
        statusCode: null,
        latency: null,
        checkedAt: new Date().toISOString(),
        details: `USSD probe failed: ${e && e.message ? e.message : e}`,
      }
    }
  }
  // If URL is missing or empty, return explicit down status.
  if (!system || !system.url || String(system.url).trim() === '') {
    return {
      up: false,
      statusCode: null,
      latency: null,
      checkedAt: new Date().toISOString(),
      details: 'No URL configured',
    }
  }

  // Normalize URL: ensure it has a scheme
  let urlStr = String(system.url).trim()
  try {
    // if urlStr doesn't contain :// assume https
    if (!/^[a-zA-Z]+:\/\//.test(urlStr)) urlStr = `https://${urlStr}`
  } catch (e) {
    urlStr = `https://${urlStr}`
  }

  let parsed
  try {
    parsed = new URL(urlStr)
  } catch (e) {
    return {
      up: null,
      statusCode: null,
      latency: null,
      checkedAt: new Date().toISOString(),
      details: 'Invalid URL',
    }
  }

  // Only attempt HTTP(S) checks in browser
  if (!/^https?:$/.test(parsed.protocol)) {
    return {
      up: null,
      statusCode: null,
      latency: null,
      checkedAt: new Date().toISOString(),
      details: `Unsupported protocol: ${parsed.protocol}`,
    }
  }

  // Special-case WhatsApp links: browser fetches cannot reliably determine
  // whether a WhatsApp number is valid. Treat as unknown unless a server-side
  // verification is available (e.g. WhatsApp Business API). This avoids false
  // positives where wa.me redirects or pages exist even for invalid numbers.
  try {
    const host = parsed.hostname || ''
    if (
      host.includes('wa.me') ||
      host.includes('whatsapp.com') ||
      host.includes('api.whatsapp.com')
    ) {
      return {
        up: null,
        statusCode: null,
        latency: null,
        checkedAt: new Date().toISOString(),
        details:
          'WhatsApp links cannot be reliably validated from the browser; use provider-side verification',
      }
    }
  } catch (e) {
    // ignore and continue
  }

  const timeoutMs = 4000

  // Try HEAD first (lighter), then GET if HEAD not allowed
  const tryFetch = async (method) => {
    const controller = new AbortController()
    const id = setTimeout(() => controller.abort(), timeoutMs)
    const start = Date.now()
    try {
      const res = await fetch(parsed.href, { method, mode: 'cors', signal: controller.signal })
      clearTimeout(id)
      const latency = Date.now() - start
      return { ok: true, res, latency }
    } catch (err) {
      clearTimeout(id)
      return { ok: false, err }
    }
  }

  // First attempt HEAD
  const headResult = await tryFetch('HEAD')
  if (headResult.ok) {
    const res = headResult.res
    return {
      up: res.ok,
      statusCode: res.status,
      latency: headResult.latency,
      checkedAt: new Date().toISOString(),
      details: res.ok ? 'OK (HEAD)' : 'Non-OK response (HEAD)',
    }
  }

  // If HEAD failed but returned a network/CORS error, try GET (some servers don't allow HEAD)
  const getResult = await tryFetch('GET')
  if (getResult.ok) {
    const res = getResult.res
    return {
      up: res.ok,
      statusCode: res.status,
      latency: getResult.latency,
      checkedAt: new Date().toISOString(),
      details: res.ok ? 'OK (GET)' : 'Non-OK response (GET)',
    }
  }

  // If both fetch attempts failed (often CORS/network), try a no-cors fetch as a last-resort reachability probe.
  try {
    const controller2 = new AbortController()
    const id2 = setTimeout(() => controller2.abort(), timeoutMs)
    const start2 = Date.now()
    // mode:no-cors will return an opaque response for cross-origin requests; treat that as reachable
    const resNoCors = await fetch(parsed.href, {
      method: 'GET',
      mode: 'no-cors',
      signal: controller2.signal,
    })
    clearTimeout(id2)
    const latency2 = Date.now() - start2
    // If fetch didn't throw, consider the origin reachable (opaque)
    return {
      up: true,
      statusCode: null,
      latency: latency2,
      checkedAt: new Date().toISOString(),
      details: 'Opaque response (no-cors) — reachable but CORS prevents status code',
    }
  } catch (e) {
    // continue to image ping
  }

  // If both fetch attempts failed (often CORS/network), try an image ping as a heuristic.
  const imagePing = (path) => {
    return new Promise((resolve) => {
      const img = new Image()
      let done = false
      const t = setTimeout(() => {
        if (done) return
        done = true
        img.src = ''
        resolve({ ok: false, err: 'timeout' })
      }, timeoutMs)

      img.onload = () => {
        if (done) return
        done = true
        clearTimeout(t)
        resolve({ ok: true })
      }
      img.onerror = () => {
        if (done) return
        done = true
        clearTimeout(t)
        resolve({ ok: false, err: 'error' })
      }

      // try given path; add cache-buster
      try {
        img.src = path + (path.includes('?') ? '&' : '?') + 'cache=' + Date.now()
      } catch (e) {
        clearTimeout(t)
        resolve({ ok: false, err: 'exception' })
      }
    })
  }

  const origins = [
    parsed.origin + '/',
    parsed.origin + '/favicon.ico',
    parsed.origin + '/favicon.png',
    parsed.origin + parsed.pathname,
  ]
  for (const p of origins) {
    try {
      const r = await imagePing(p)
      if (r.ok) {
        return {
          up: true,
          statusCode: null,
          latency: null,
          checkedAt: new Date().toISOString(),
          details: 'Reachable (image ping) — CORS likely prevented fetch',
        }
      }
    } catch (e) {
      // continue
    }
  }

  // Unable to determine reliably from browser — return unknown rather than false to avoid false negatives
  return {
    up: null,
    statusCode: null,
    latency: null,
    checkedAt: new Date().toISOString(),
    details: 'Unreachable or CORS blocked; status unknown from browser',
  }
}

export default { checkSystemStatus }
