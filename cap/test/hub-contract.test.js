'use strict'

const assert = require('node:assert/strict')
const { afterEach, test } = require('node:test')

const hub = require('../srv/lib/hub-client')
const WorkshopHubService = require('../srv/workshop-service')

const originalFetch = global.fetch

afterEach(() => {
  global.fetch = originalFetch
  delete process.env.WORKSHOP_HUB_URL
})

test('heartbeat sends participant identity and password', async () => {
  let request
  process.env.WORKSHOP_HUB_URL = 'https://hub.example.test'
  global.fetch = async (url, options) => {
    request = { url, options }
    return { ok: true, status: 202, text: async () => '' }
  }

  await hub.sendHeartbeat('participant-1', 'secret')

  assert.equal(request.url, 'https://hub.example.test/heartbeat')
  assert.equal(request.options.method, 'POST')
  assert.equal(request.options.headers['X-Workshop-Password'], 'secret')
  assert.deepEqual(JSON.parse(request.options.body), { participantId: 'participant-1' })
})

test('ordinary chat omits reply metadata', () => {
  assert.deepEqual(WorkshopHubService.chatFields({ message: 'hello' }), {
    message: 'hello'
  })
})

test('restores the in-memory connection from a persisted browser identity', () => {
  const service = Object.create(WorkshopHubService.prototype)
  service.connection = { participantId: null, displayName: null, avatarSet: false }

  const result = service.doRestoreConnection({
    data: { participantId: 'participant-1', displayName: 'Team One' }
  })

  assert.equal(result.connected, true)
  assert.equal(result.participantId, 'participant-1')
  assert.equal(result.displayName, 'Team One')
})