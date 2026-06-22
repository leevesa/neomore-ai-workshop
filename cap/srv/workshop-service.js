'use strict'

const { Readable } = require('stream')
const cds = require('@sap/cds')
const hub = require('./lib/hub-client')

/**
 * Handlers for {@link WorkshopHubService}. Nothing is stored in the CAP
 * database — reads and actions are forwarded to the Workshop Hub REST API via
 * the configurable {@link module:lib/hub-client client}. The only local state
 * is the current participant registration, kept in memory so subsequent events
 * can be attributed to the right participant.
 */
class WorkshopHubService extends cds.ApplicationService {
  async init() {
    this.connection = { participantId: null, displayName: null, avatarSet: false }

    this.on('READ', 'Tasks', () => this.readTasks())
    this.on('READ', 'Feed', (req) => this.readFeed(req))
    this.on('READ', 'Connection', () => [this.connectionRow()])
    this.on('READ', 'Avatars', (req) => this.readAvatar(req))

    this.on('register', (req) => this.doRegister(req))
    this.on('uploadAvatar', (req) => this.doUploadAvatar(req))
    this.on('startTask', (req) => this.sendEvent('task.started', req, { taskId: req.data.taskId }))
    this.on('completeTask', (req) => this.sendEvent('task.completed', req, { taskId: req.data.taskId, message: req.data.message, status: 'completed' }))
    this.on('passCheckpoint', (req) => this.sendEvent('checkpoint.passed', req, { taskId: req.data.taskId, message: req.data.message }))
    this.on('reportFailure', (req) => this.sendEvent('verification.failed', req, { taskId: req.data.taskId, message: req.data.message, status: 'failed' }))
    this.on('sendChatMessage', (req) => this.sendEvent('chat.message.sent', req, { message: req.data.message }))
    this.on('heartbeat', (req) => this.doHeartbeat(req))
    this.on('health', (req) => this.guard(req, () => hub.health()))

    await super.init()
  }

  // --- reads -------------------------------------------------------------

  async readTasks() {
    const tasks = await hub.listTasks()
    return (tasks || []).map((t) => ({
      taskId: t.taskId,
      title: t.title,
      description: t.description,
      ordinal: t.ordinal
    }))
  }

  async readFeed(req) {
    const select = req.query?.SELECT || {}
    // Fetch a generous window from the Hub, then apply OData filter/order/paging
    // locally (the Hub feed endpoint does not understand OData query options).
    let items = (await hub.readFeed(FEED_FETCH_LIMIT)).map(toFeedRow)
    items = applyWhere(items, select.where)
    items = applyOrderBy(items, select.orderBy)
    items = applyPaging(items, select.limit)
    return items
  }

  /** Stream a participant's avatar image back from the Hub (OData media read). */
  async readAvatar(req) {
    const participantId = req.data.participantId
    if (!participantId) return req.reject(400, 'participantId is required')
    const { bytes, contentType } = await this.guard(req, () => hub.getAvatar(participantId))
    return {
      participantId,
      contentType,
      data: Readable.from(bytes),
      '*@odata.mediaContentType': contentType
    }
  }

  // --- actions -----------------------------------------------------------

  async doRegister(req) {
    const displayName = (req.data.displayName || '').trim()
    if (!displayName) return req.reject(400, 'displayName is required')

    const participant = await this.guard(req, () => hub.registerParticipant(displayName))
    this.connection = {
      participantId: participant.participantId,
      displayName: participant.displayName,
      avatarSet: false
    }
    return this.connectionRow()
  }

  /** Forward the uploaded avatar image (base64 bytes) to the Hub. */
  async doUploadAvatar(req) {
    if (!this.connection.participantId) {
      return req.reject(412, 'Not registered yet — call register(displayName) first')
    }
    const image = req.data.image
    if (!image) return req.reject(400, 'image is required')
    const bytes = Buffer.isBuffer(image) ? image : Buffer.from(image, 'base64')

    await this.guard(req, () => hub.uploadAvatar(this.connection.participantId, bytes))
    this.connection.avatarSet = true
    return this.connectionRow()
  }

  /** Send an anonymous heartbeat — no participant identity, no registration required. */
  async doHeartbeat(req) {
    await this.guard(req, () => hub.sendHeartbeat())
  }

  /**
   * Build and publish an event to the Hub, attributing it to the registered
   * participant. Returns the created feed item.
   */
  async sendEvent(eventType, req, fields) {
    if (!this.connection.participantId) {
      return req.reject(412, 'Not registered yet — call register(displayName) first')
    }
    const event = {
      participantId: this.connection.participantId,
      displayName: this.connection.displayName,
      eventType,
      taskId: fields.taskId || null,
      message: fields.message || null,
      status: fields.status || null
    }
    const item = await this.guard(req, () => hub.publishEvent(event))
    return toFeedRow(item)
  }

  // --- helpers -----------------------------------------------------------

  connectionRow() {
    const cfg = hub.config()
    return {
      id: 'current',
      hubUrl: cfg.url,
      sessionId: cfg.sessionId,
      connected: Boolean(this.connection.participantId),
      participantId: this.connection.participantId,
      displayName: this.connection.displayName,
      avatarSet: Boolean(this.connection.avatarSet),
      passwordProtected: Boolean(cfg.password)
    }
  }

  /** Run a Hub call and translate transport/HTTP failures into CAP errors. */
  async guard(req, fn) {
    try {
      return await fn()
    } catch (err) {
      const status = err instanceof hub.HubError ? err.status : 502
      return req.reject(status, err.message)
    }
  }
}

function toFeedRow(item) {
  return {
    id: item.id,
    sessionId: item.sessionId,
    participantId: item.participantId,
    displayName: item.displayName,
    eventType: item.eventType,
    taskId: item.taskId,
    message: item.message,
    status: item.status,
    timestamp: item.timestamp,
    metadata: item.metadata
  }
}

// How many feed items to pull from the Hub before filtering/paging locally.
const FEED_FETCH_LIMIT = 200

/** Apply a CQN WHERE clause (only simple equality predicates joined by AND). */
function applyWhere(items, where) {
  if (!Array.isArray(where) || where.length === 0) {
    return items
  }
  const predicates = []
  for (let i = 0; i < where.length; i++) {
    const token = where[i]
    if (token && token.ref && where[i + 1] === '=' && where[i + 2] && 'val' in where[i + 2]) {
      predicates.push({ field: token.ref[token.ref.length - 1], value: where[i + 2].val })
      i += 2
    }
  }
  if (predicates.length === 0) {
    return items
  }
  return items.filter((row) => predicates.every((p) => row[p.field] === p.value))
}

/** Apply a CQN ORDER BY clause. */
function applyOrderBy(items, orderBy) {
  if (!Array.isArray(orderBy) || orderBy.length === 0) {
    return items
  }
  const sorted = items.slice()
  sorted.sort((a, b) => {
    for (const o of orderBy) {
      const field = o.ref ? o.ref[o.ref.length - 1] : null
      if (!field) continue
      const dir = o.sort === 'desc' ? -1 : 1
      if (a[field] < b[field]) return -1 * dir
      if (a[field] > b[field]) return 1 * dir
    }
    return 0
  })
  return sorted
}

/** Apply CQN LIMIT (OData $top/$skip). */
function applyPaging(items, limit) {
  if (!limit) {
    return items
  }
  const skip = limit.offset?.val || 0
  const top = limit.rows?.val
  return top != null ? items.slice(skip, skip + top) : items.slice(skip)
}

module.exports = WorkshopHubService
