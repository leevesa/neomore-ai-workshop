# Workshop Hub

The hosted service for the Neomore codelab. It receives participant registration and
progress/chat/heartbeat events from each participant's local CAP backend, stores them in an
in-memory database, and powers a live **facilitator projector dashboard** over Server-Sent
Events (SSE).

- **Tech:** Spring Boot 4.1, Java 21, Gradle, in-memory H2.
- **Runs:** locally via Docker (no local JDK required) and is portable to a cloud webapp.
- **Default port:** `8080`.

---

## 1. Prerequisites

- Docker Desktop running. That's it — the JDK and Gradle run inside containers.

---

## 2. Run the hub locally (Docker)

From the `workshop-hub/` folder:

```bash
docker compose up --build
```

Then open the projector dashboard:

```
http://localhost:8080/dashboard/index.html
```

Stop it with `Ctrl+C`, or in another terminal:

```bash
docker compose down
```

On startup the hub seeds the canonical workshop task list, so the dashboard and
`/tasks` endpoint work immediately.

---

## 3. Configuration

All settings are environment variables (override them in `compose.yaml` or your shell).

| Variable | Default | Purpose |
| --- | --- | --- |
| `WORKSHOP_PASSWORD` | _(empty)_ | Optional shared password. When set, write endpoints and the dashboard require it. When empty, the hub is fully open (ideal for local/dry-run). |

Example with a password:

```bash
WORKSHOP_PASSWORD=letmein docker compose up --build
```

When a password is set:
- Write calls (`POST`) must send header `X-Workshop-Password: letmein`.
- The dashboard URL needs `&password=letmein` (because the browser/EventSource cannot send custom headers).
- Read endpoints (`/feed`, `/feed/stream`, `/tasks`, `/health`) stay open so the dashboard can stream.

---

## 4. API reference

Base URL: `http://localhost:8080`

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/participants` | Register a participant or team |
| `POST` | `/events` | Publish a progress / heartbeat / chat / checkpoint event |
| `GET` | `/feed` | Read recent activity (newest first, `?limit=` optional) |
| `GET` | `/feed/stream` | SSE stream of live events (used by the dashboard) |
| `GET` | `/tasks` | Read the canonical task list |
| `GET` | `/health` | Service availability |
| `GET` | `/actuator/health` | Health endpoint used by the container healthcheck |

### Event types

`participant.connected`, `participant.heartbeat`, `task.started`, `task.completed`,
`chat.message.sent`, `checkpoint.passed`, `verification.failed`.

### Event payload fields

`participantId`, `displayName`, `eventType` (required), `taskId`, `message`, `status`,
`metadata` (free-form object).

---

## 5. Example flow (curl)

```bash
# 1. See the seeded tasks
curl http://localhost:8080/tasks

# 2. Register a team — capture the returned participantId
curl -X POST http://localhost:8080/participants \
  -H 'content-type: application/json' \
  -d '{"displayName":"Team A"}'

# 3. Publish a completed task (use the participantId from step 2)
curl -X POST http://localhost:8080/events \
  -H 'content-type: application/json' \
  -d '{"participantId":"<id>","eventType":"task.completed","taskId":"connect"}'

# 4. Read the feed (newest first)
curl http://localhost:8080/feed
```

With a password set, add `-H 'X-Workshop-Password: letmein'` to the two `POST` calls.

---

## 6. The projector dashboard

Open on the projector:

```
http://localhost:8080/dashboard/index.html
```

It shows, updating live as events arrive:
- **Connection status** (green dot = streaming).
- **Participants** — who has joined; idle teams (no heartbeat for ~60s) are dimmed.
- **Task progress** — a bar per task showing how many participants completed it.
- **Activity feed** — the running event log.
- **Celebration overlay** — pops when a `checkpoint.passed` event arrives.

Query params: `password` (only if the hub is password-protected).

---

## 7. How a local CAP backend integrates (workshop exercise)

The participant's browser talks only to their **local CAP backend**; CAP is the integration
boundary that forwards validated events to this hub. During the codelab participants wire
CAP to call:

1. `POST /participants` when a team name is entered.
2. `POST /events` when they start/complete tasks, send chat, or pass a
   checkpoint — including a periodic `participant.heartbeat`.

CAP reads the hub location from its own configuration (e.g. `WORKSHOP_HUB_URL`,
`WORKSHOP_PARTICIPANT_TOKEN`/password, `WORKSHOP_DRY_RUN`). That CAP
side is intentionally **not** implemented here — it's what participants build.

---

## 8. Run the tests (Docker)

> Note: the unit/integration tests are written but a few imports still need updating for
> Spring Boot 4's relocated test-slice annotations, so the test task may not pass yet.
> The application itself builds and runs.

```bash
docker run --rm -v "$PWD":/workspace -v "$HOME/.gradle":/root/.gradle \
  -w /workspace mcr.microsoft.com/openjdk/jdk:21-ubuntu \
  bash -lc "./gradlew test --no-daemon"
```

Build just the runnable jar (skips tests, same as the Docker image build):

```bash
docker run --rm -v "$PWD":/workspace -v "$HOME/.gradle":/root/.gradle \
  -w /workspace mcr.microsoft.com/openjdk/jdk:21-ubuntu \
  bash -lc "./gradlew bootJar --no-daemon -x test"
```

---

## 9. Project layout

```
workshop-hub/
├── compose.yaml            # local Docker orchestration
├── Dockerfile              # multi-stage build, slim custom JRE, non-root
├── build.gradle            # Spring Boot 4.1 deps (modular starters, Jackson 3)
└── src/main/
    ├── java/com/neomore/workshophub/
    │   ├── config/         # properties, CORS, password filter
    │   ├── model/          # JPA entities + EventType
    │   ├── repository/     # Spring Data repositories
    │   ├── dto/            # request/response records
    │   ├── service/        # WorkshopService, FeedBroadcaster, seeders
    │   └── web/            # REST + SSE controllers, error handler
    └── resources/
        ├── application.yaml
        └── static/dashboard/   # projector UI (index.html, app.js, style.css)
```

---

## 10. Data persistence

State lives in **in-memory H2** and resets every time the container restarts. That's
deliberate for a short live workshop. To inspect data while running, the H2 console is
available at `http://localhost:8080/h2-console` (JDBC URL
`jdbc:h2:mem:workshophub`, user `sa`, empty password).
