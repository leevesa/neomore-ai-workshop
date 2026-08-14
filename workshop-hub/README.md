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
- The dashboard prompts through browser Basic authentication (any username, shared password).
- Read endpoints (`/feed`, `/feed/stream`, `/tasks`, `/health`) stay open so the dashboard can stream.

---

## 4. API reference

Base URL: `http://localhost:8080`

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/participants` | Register a participant or team |
| `POST` | `/heartbeat` | Emit an anonymous pulse or verify a known participant heartbeat |
| `POST` | `/events` | Publish chat, task-start, checkpoint, or failure activity |
| `POST` | `/participants/{participantId}/avatar` | Upload validated image bytes |
| `GET` | `/participants/{participantId}/avatar` | Read a participant avatar |
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

The Hub rejects client-authored `task.completed` events. It authors completion
events only after observing these six actions:

| Task | Verified activity |
| --- | --- |
| `register` | Participant created with a valid display name |
| `heartbeat` | `/heartbeat` receives a known participant ID |
| `chat` | Nonblank `chat.message.sent` event |
| `multiline-message` | Chat payload contains at least two nonblank real lines |
| `feature-avatar` | Valid PNG, JPEG, or WEBP bytes uploaded |
| `reply-message` | Reply metadata references an existing chat event |

---

## 5. Example flow (curl)

```bash
# 1. See the seeded tasks
curl http://localhost:8080/tasks

# 2. Register a team — capture the returned participantId
curl -X POST http://localhost:8080/participants \
  -H 'content-type: application/json' \
  -d '{"displayName":"Team A"}'

# 3. Send an attributed heartbeat (use the participantId from step 2)
curl -X POST http://localhost:8080/heartbeat \
  -H 'content-type: application/json' \
  -d '{"participantId":"<id>"}'

# 4. Send a chat message; the Hub completes the chat task
curl -X POST http://localhost:8080/events \
  -H 'content-type: application/json' \
  -d '{"participantId":"<id>","eventType":"chat.message.sent","message":"Hello room"}'

# 5. Read the feed (newest first)
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
2. `POST /heartbeat` with the registered participant ID for presence.
3. `POST /events` when they send chat, start work, or pass a checkpoint.

Clients never post `task.completed`; completion is a Hub-authored result of valid
endpoint activity.

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

---

## 11. Azure operations

The shared Hub is deployed to Azure Container Apps with these resources:

```bash
RESOURCE_GROUP="rg-neomore-workshop"
ENVIRONMENT="cae-neomore-workshop"
APP="neomore-workshop-hub"
BASE_URL="https://neomore-workshop-hub.politegrass-3dc51b12.northeurope.azurecontainerapps.io"
```

Sign in and select the correct Azure subscription before running the commands below:

```bash
az login
az account list --output table
az account set --subscription "<subscription-name-or-id>"
```

### Check status and logs

```bash
az containerapp show \
  --name "$APP" \
  --resource-group "$RESOURCE_GROUP" \
  --query '{revision:properties.latestRevisionName,running:properties.runningStatus,minReplicas:properties.template.scale.minReplicas,maxReplicas:properties.template.scale.maxReplicas}' \
  --output table

curl -fsS "$BASE_URL/actuator/health"
curl -fsS "$BASE_URL/tasks"
```

Follow the application logs with:

```bash
az containerapp logs show \
  --name "$APP" \
  --resource-group "$RESOURCE_GROUP" \
  --follow
```

### Restart the service

Restart the latest revision when the process is unhealthy or a clean workshop state
is required. **Restarting clears all participants, messages, avatars, and progress.**

```bash
REVISION="$(az containerapp show \
  --name "$APP" \
  --resource-group "$RESOURCE_GROUP" \
  --query properties.latestRevisionName \
  --output tsv)"

az containerapp revision restart \
  --name "$APP" \
  --resource-group "$RESOURCE_GROUP" \
  --revision "$REVISION"

curl -fsS "$BASE_URL/actuator/health"
```

### Build and deploy a new version

Run these commands from the repository root. Azure builds the local Dockerfile, pushes
the image to the existing registry, and creates a new Container Apps revision. Deploying
a revision also starts with an empty in-memory database.

```bash
cd workshop-hub

docker compose build

az containerapp up \
  --name "$APP" \
  --resource-group "$RESOURCE_GROUP" \
  --environment "$ENVIRONMENT" \
  --source . \
  --ingress external \
  --target-port 8080
```

Keep exactly one always-running replica because every replica has its own in-memory
database and SSE clients must observe the same process:

```bash
az containerapp update \
  --name "$APP" \
  --resource-group "$RESOURCE_GROUP" \
  --min-replicas 1 \
  --max-replicas 1 \
  --cpu 0.5 \
  --memory 1.0Gi
```

Verify the new revision before the workshop:

```bash
az containerapp show \
  --name "$APP" \
  --resource-group "$RESOURCE_GROUP" \
  --query properties.latestRevisionName \
  --output tsv

curl -fsS "$BASE_URL/actuator/health"
curl -fsS "$BASE_URL/tasks"
```

The existing `WORKSHOP_PASSWORD` secret reference is retained when deploying a new
revision. Do not place the password itself in this repository or in deployment commands
that will be committed.
