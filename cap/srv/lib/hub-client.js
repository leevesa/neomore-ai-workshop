'use strict'

/**
 * Thin REST client for the Workshop Hub (the Spring Boot service in
 * `workshop-hub/`). The Hub is a plain JSON/REST API — not OData — so this
 * client wraps the handful of endpoints the CAP service needs using the
 * built-in `fetch` (Node.js 18+).
 *
 * Everything is configurable so the same image can talk to a local Hub during
 * development and to the hosted/cloud Hub during the workshop:
 *
 *   WORKSHOP_HUB_URL     Base URL of the Hub        (default http://localhost:8080)
 *   WORKSHOP_SESSION_ID  Session to join            (default demo)
 *   WORKSHOP_PASSWORD    Optional shared password   (default none)
 *   WORKSHOP_HTTP_TIMEOUT_MS  Per-request timeout   (default 8000)
 */

const PASSWORD_HEADER = 'X-Workshop-Password'

function config() {
  return {
    url: (process.env.WORKSHOP_HUB_URL || 'http://localhost:8080').replace(/\/+$/, ''),
    sessionId: process.env.WORKSHOP_SESSION_ID || 'demo',
    password: process.env.WORKSHOP_PASSWORD || '',
    timeoutMs: Number(process.env.WORKSHOP_HTTP_TIMEOUT_MS || 8000)
  }
}

/**
 * Error carrying the upstream HTTP status so handlers can surface a meaningful
 * code to the CAP/Fiori client.
 */
class HubError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'HubError'
    this.status = status || 502
  }
}

async function request(method, path, body) {
  const cfg = config()
  const headers = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (cfg.password) headers[PASSWORD_HEADER] = cfg.password

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), cfg.timeoutMs)

  let response
  try {
    response = await fetch(`${cfg.url}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal
    })
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new HubError(`Workshop Hub did not respond within ${cfg.timeoutMs} ms (${cfg.url})`, 504)
    }
    throw new HubError(`Cannot reach Workshop Hub at ${cfg.url}: ${err.message}`, 502)
  } finally {
    clearTimeout(timer)
  }

  const text = await response.text()
  const payload = text ? safeJson(text) : null

  if (!response.ok) {
    const message = (payload && payload.message) || `Workshop Hub returned ${response.status}`
    throw new HubError(message, response.status)
  }
  return payload
}

function safeJson(text) {
  try {
    return JSON.parse(text)
  } catch {
    return { message: text }
  }
}

module.exports = {
  HubError,
  config,

  health() {
    return request('GET', '/health')
  },

  listTasks() {
    const { sessionId } = config()
    return request('GET', `/sessions/${encodeURIComponent(sessionId)}/tasks`)
  },

  readFeed(limit) {
    const { sessionId } = config()
    const query = limit ? `?limit=${encodeURIComponent(limit)}` : ''
    return request('GET', `/sessions/${encodeURIComponent(sessionId)}/feed${query}`)
  },

  registerParticipant(displayName) {
    const { sessionId } = config()
    return request('POST', `/sessions/${encodeURIComponent(sessionId)}/participants`, { displayName })
  },

  publishEvent(event) {
    const { sessionId } = config()
    return request('POST', `/sessions/${encodeURIComponent(sessionId)}/events`, event)
  },

  /** Anonymous presence ping — no participant identity, no body. */
  sendHeartbeat() {
    const { sessionId } = config()
    return request('POST', `/sessions/${encodeURIComponent(sessionId)}/heartbeat`)
  },

  /**
   * Upload a participant's avatar image as raw bytes. The Hub detects and
   * validates the real image type from the bytes, so the content type sent here
   * is only a hint.
   */
  async uploadAvatar(participantId, bytes, contentType) {
    const cfg = config()
    const headers = { 'Content-Type': contentType || 'application/octet-stream' }
    if (cfg.password) headers[PASSWORD_HEADER] = cfg.password

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), cfg.timeoutMs)
    const path = `/sessions/${encodeURIComponent(cfg.sessionId)}/participants/${encodeURIComponent(participantId)}/avatar`

    let response
    try {
      response = await fetch(`${cfg.url}${path}`, {
        method: 'POST',
        headers,
        body: bytes,
        signal: controller.signal
      })
    } catch (err) {
      if (err.name === 'AbortError') {
        throw new HubError(`Workshop Hub did not respond within ${cfg.timeoutMs} ms (${cfg.url})`, 504)
      }
      throw new HubError(`Cannot reach Workshop Hub at ${cfg.url}: ${err.message}`, 502)
    } finally {
      clearTimeout(timer)
    }

    if (!response.ok) {
      const text = await response.text()
      const payload = text ? safeJson(text) : null
      const message = (payload && payload.message) || `Workshop Hub returned ${response.status}`
      throw new HubError(message, response.status)
    }
  },

  /**
   * Download a participant's avatar. Returns the raw bytes and content type, or
   * throws a {@link HubError} with status 404 when no avatar is set.
   */
  async getAvatar(participantId) {
    const cfg = config()
    const headers = {}
    if (cfg.password) headers[PASSWORD_HEADER] = cfg.password

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), cfg.timeoutMs)
    const path = `/sessions/${encodeURIComponent(cfg.sessionId)}/participants/${encodeURIComponent(participantId)}/avatar`

    let response
    try {
      response = await fetch(`${cfg.url}${path}`, { method: 'GET', headers, signal: controller.signal })
    } catch (err) {
      if (err.name === 'AbortError') {
        throw new HubError(`Workshop Hub did not respond within ${cfg.timeoutMs} ms (${cfg.url})`, 504)
      }
      throw new HubError(`Cannot reach Workshop Hub at ${cfg.url}: ${err.message}`, 502)
    } finally {
      clearTimeout(timer)
    }

    if (!response.ok) {
      throw new HubError(`No avatar for participant ${participantId}`, response.status)
    }
    const buffer = Buffer.from(await response.arrayBuffer())
    return { bytes: buffer, contentType: response.headers.get('content-type') || 'application/octet-stream' }
  }
}
