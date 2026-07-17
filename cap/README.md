# Workshop Hub CAP service

A CAP (Node.js) service that fronts the [Workshop Hub](../workshop-hub/) REST API
for the Fiori chat app in [`../ui5/`](../ui5/). Nothing is stored locally — every
read and action is forwarded to the Hub, which will eventually run in the cloud.

Folder | Purpose
---------|----------
`srv/` | the `WorkshopHubService` model and handlers (`srv/lib/hub-client.js` talks to the Hub)


## Prerequisites

- Install Node.js → always use the latest LTS version.
- Install @sap/cds-dk globally with: `npm install -g @sap/cds-dk`

## Running the application

- run ```npm install``` to install all dependencies
- run ```npm run start```, this will start the application on http://localhost:4004.

## Workshop Hub integration service

This project exposes a `WorkshopHubService` (OData V4 at `/workshop-hub`) that the
Fiori app uses to talk to the [Workshop Hub](../workshop-hub/) REST API. Nothing is
stored locally — every read and action is forwarded to the Hub.

### Configuration

The target Hub is fully configurable via environment variables, so the same
build runs against a local Hub or the hosted one:

Variable | Purpose | Default
---------|---------|--------
`WORKSHOP_HUB_URL` | Base URL of the Workshop Hub | `http://localhost:8080`
`WORKSHOP_PASSWORD` | Optional shared password (sent as `X-Workshop-Password`) | _(none)_
`WORKSHOP_HTTP_TIMEOUT_MS` | Per-request timeout in ms | `8000`

### Endpoints

- Connection state (single row, includes `avatarSet`): `GET /workshop-hub/Connection`
- Task list (from the Hub): `GET /workshop-hub/Tasks`
- Activity feed (supports `$filter`, `$orderby` and `$top`, evaluated server-side):
  `GET /workshop-hub/Feed?$filter=eventType eq 'chat.message.sent'&$orderby=timestamp`
- Team avatar image (OData V4 media stream, proxied from the Hub):
  `GET /workshop-hub/Avatars('<participantId>')/data`
- Hub health probe: `GET /workshop-hub/health()`

Actions (HTTP `POST` to `/workshop-hub/<action>`):

- `register` — `{ "displayName": "Team Rocket" }` — register and remember the participant
- `uploadAvatar` — `{ "image": "<base64-encoded PNG/JPEG/WEBP bytes>" }` — store the current
  participant's avatar on the Hub (requires `register` first)
- `startTask` — `{ "taskId": "register" }`
- `completeTask` — `{ "taskId": "register", "message": "done" }`
- `passCheckpoint` — `{ "taskId": "celebrate", "message": "🎉" }`
- `reportFailure` — `{ "taskId": "chat", "message": "tests failed" }`
- `sendChatMessage` — `{ "message": "hello hub" }`
- `heartbeat` — `{}` — anonymous keep-alive ping (no registration required)

> The participant-scoped event actions (`uploadAvatar`, `startTask`, `completeTask`,
> `passCheckpoint`, `reportFailure`, `sendChatMessage`) require `register` to be called
> first (returns `412` otherwise). `heartbeat` is anonymous and can be sent any time.

> Task completion is authored by the Hub itself after it validates the payload —
> clients never self-report. Registering completes the `register` task, posting a
> non-empty chat message completes `chat`, and uploading a valid image completes
> `feature-avatar`.


## Running in Docker

The CAP service ships with a `Dockerfile` and `compose.yaml`. Point it at any Hub
via `WORKSHOP_HUB_URL`:

```bash
# Build and run, talking to a Hub on the host (e.g. the workshop-hub stack on :8080)
docker compose up --build

# Target the hosted/cloud Hub instead
WORKSHOP_HUB_URL=https://workshop-hub.example.com \
docker compose up --build
```

The service is then available on http://localhost:4004.