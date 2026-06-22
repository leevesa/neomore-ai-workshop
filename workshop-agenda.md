# Neomore AI Coding Workshop Agenda

## Workshop Summary

**Duration:** 2.5 hours  
**Format:** Guided codelab with hands-on GitHub Copilot Agent Mode exercises  
**Audience:** Developers who want to use GitHub Copilot effectively across backend, frontend, integration, and containerization work  
**Scenario:** Build a local CAP and UI5 workshop app that connects to a hosted live codelab service

This version of the workshop turns the codelab itself into the product. Every participant builds a local application that connects to a shared cloud-hosted service. The hosted service receives progress events, chat messages, task completions, and connection heartbeats from each participant. A facilitator dashboard shows the live feed on the projector so the room can see progress as it happens.

The hands-on scope is intentionally focused:

- **CAP** provides the local backend, owns task/progress state, validates participant actions, and integrates with the hosted workshop service.
- **UI5** provides the participant chat app for registration (with a team avatar), sending messages, and reading the shared chatboard.
- **Containerization** keeps the local development environment repeatable.
- **Workshop Hub** is implemented in this repository under [`workshop-hub/`](workshop-hub/) (Spring Boot + in-memory H2). It receives events, stores team avatars, authors task completions after validating payloads, and serves the facilitator dashboard. The same build runs locally or as the shared cloud instance.

The goal is not only to build code faster. The goal is to teach participants how to use Copilot to reason across local code, remote service contracts, integration risks, verification loops, and real-time feedback.

## Use Case Plan

Neomore hosts a shared **Workshop Hub** in the cloud before the session starts. Participants each run a local CAP and UI5 application from the workshop repository. During the codelab, their local app connects to the hosted service and publishes lightweight events.

The facilitator opens a projector dashboard backed by the hosted service. As participants connect, complete tasks, send messages, or hit checkpoints, the dashboard updates live.

Core experience:

1. A participant starts the local workshop app.
2. The UI5 cockpit asks for a participant or team name.
3. The CAP backend registers the participant with the hosted Workshop Hub.
4. The UI5 cockpit shows connection status, workshop tasks, local progress, and recent activity.
5. When the participant completes a task, UI5 calls CAP.
6. CAP validates the action and sends a progress event to the hosted service.
7. The hosted projector dashboard shows the update in the live feed.
8. The facilitator uses the feed to spot blockers, pace the room, and celebrate milestones.

The hosted service can start as a high-level concept for this agenda. Later, it can become a small cloud API with persistent session state, a projector UI, and optional WebSocket or Server-Sent Events support.

## Conceptual Architecture

```text
Participant Browser
    |
    | UI actions: register, start task, complete task, send chat
    v
Local UI5 App
    |
    | OData/actions or REST calls to local backend
    v
Local CAP Backend
    |
    | Validated HTTP events, configured by environment variables
    v
Hosted Workshop Hub
    |
    | Live feed and aggregate progress
    v
Facilitator Projector Dashboard
```

Design principle: the browser should call the local CAP backend, not the hosted service directly. CAP becomes the integration boundary, protects tokens, normalizes payloads, handles failures, and keeps the UI simple.

## Conceptual Hosted Service Contract

The exact implementation can be decided later, but the workshop should assume a small, stable contract so participants have something concrete to integrate with.

Suggested configuration:

- `WORKSHOP_HUB_URL`: Base URL for the hosted service.
- `WORKSHOP_SESSION_ID`: Identifier for the live workshop session.
- `WORKSHOP_PARTICIPANT_NAME`: Optional default participant or team name.
- `WORKSHOP_PARTICIPANT_TOKEN`: Optional short-lived workshop token.
- `WORKSHOP_DRY_RUN`: Allows the local app to simulate successful events when the hosted service is unavailable.

Suggested event types:

- `participant.connected`
- `participant.heartbeat` (anonymous keep-alive; powers the dashboard's live pulse, not a per-team task)
- `task.started`
- `task.completed` (authored by the Hub after it validates the payload — never self-reported)
- `chat.message.sent`
- `checkpoint.passed`
- `verification.failed`

### Verifiable task backbone (implemented)

The Hub seeds the `demo` session with three payload-verifiable tasks. The Hub itself
authors the matching `task.completed` event once the action is validated:

| Task ID | Title | Completed by the Hub when... |
| --- | --- | --- |
| `register` | Register your team | a participant is created with a valid display name |
| `chat` | Post to the chatboard | a `chat.message.sent` arrives with a non-empty message |
| `feature-avatar` | Add a team avatar | a valid image (PNG/JPEG/WEBP) is uploaded for the team |

Team avatars are stored as raw image bytes in their own H2 table and served back as a
binary `GET .../avatar` endpoint (exposed through CAP as the `Avatars` OData media entity).

Possible API shape:

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/sessions/{sessionId}/participants` | Register a participant or team |
| `POST` | `/sessions/{sessionId}/events` | Publish progress, checkpoint, or chat events |
| `POST` | `/sessions/{sessionId}/participants/{participantId}/avatar` | Upload a team avatar image (raw bytes) |
| `GET` | `/sessions/{sessionId}/participants/{participantId}/avatar` | Fetch a team avatar image |
| `POST` | `/sessions/{sessionId}/heartbeat` | Anonymous keep-alive ping |
| `GET` | `/sessions/{sessionId}/feed` | Read recent activity for participant UI or facilitator tooling |
| `GET` | `/sessions/{sessionId}/tasks` | Read the canonical task list for the codelab |
| `GET` | `/health` | Verify hosted service availability |

Suggested event payload fields:

- `participantId`
- `displayName`
- `eventType`
- `taskId`
- `message`
- `status`
- `timestamp`
- `metadata`

This contract should stay deliberately small. The point of the workshop is to practice AI-assisted integration, not to spend the whole session designing a platform.

## Learning Outcomes

By the end of the workshop, participants should be able to:

- Use GitHub Copilot Chat and Agent Mode to make focused multi-file changes.
- Provide useful project context through README files, service contracts, custom instructions, and relevant source files.
- Break implementation work into small prompts with clear acceptance criteria.
- Generate and refine CAP, UI5, and Docker changes using existing repository patterns.
- Design a local backend integration to a remote HTTP service.
- Keep secrets and remote-service configuration out of browser code.
- Validate generated code by running commands, reviewing diffs, checking endpoints, and improving tests.
- Use MCP servers and custom instructions as practical steering tools rather than novelty features.
- Recognize common risks in AI-generated integration code, including hallucinated APIs, weak error handling, missing retries, leaked secrets, and inconsistent architecture.

## Narrative Spine

The workshop itself becomes the product.

Participants are not only building an example app. They are building a local codelab cockpit that reports its own progress to the shared room dashboard. This creates a visible feedback loop: the better their CAP and UI5 integration works, the more their work appears in the live feed.

The participant app has two local responsibilities:

1. **CAP workshop backend** exposes local task state, validates progress updates, and forwards events to the hosted Workshop Hub.
2. **UI5 participant cockpit** gives the participant a simple interface for connection status, tasks, progress updates, recent activity, and optional chat.

The hosted cloud service has three conceptual responsibilities:

1. Accept participant registrations and events.
2. Aggregate live progress across the workshop session.
3. Power a projector dashboard for facilitators.

## Recommended Repository Flow

| Area | Folder Or Artifact | Role In Workshop |
| --- | --- | --- |
| Setup | `docs/00-setup.md` | Prepare VS Code, Copilot, custom instructions, and MCP servers |
| Workshop agenda | `workshop-agenda.md` | Explain the live integration scenario and timing |
| CAP | `cap/` | Local backend, task state, validation, and hosted service integration |
| UI5 | `ui5/` | Participant cockpit for tasks, progress, connection status, and chat |
| Containerization | `Dockerfile.workshop`, `compose.workshop.yaml` | Repeatable local workshop environment |
| Complete samples | `complete/` | Reference material for comparison, debugging, and extension ideas |
| Hosted service | Planned cloud service | Shared live feed, task progress aggregation, and projector dashboard |

## 150-Minute Agenda

| Time | Segment | Focus | Output |
| --- | --- | --- | --- |
| 0:00-0:10 | Welcome and live demo vision | Show the idea of a shared projector dashboard receiving participant events | Shared understanding of the room-scale feedback loop |
| 0:10-0:25 | Copilot setup | Confirm VS Code, Copilot Chat, Agent Mode, model choice, custom instructions, and MCP servers | Working AI coding environment |
| 0:25-0:40 | Hosted contract briefing | Introduce the conceptual Workshop Hub contract and define local acceptance criteria | Clear integration plan and event model |
| 0:40-1:15 | CAP integration exercise | Add local task/progress model, participant registration, and event publishing to the hosted service | CAP backend that can prepare and send workshop events |
| 1:15-1:25 | Live checkpoint | Review integration code, error handling, and event payloads | Safer integration prompts and shared troubleshooting notes |
| 1:25-2:00 | UI5 participant cockpit | Build a UI for connection status, task progress, event submission, recent activity, and optional chat | UI5 app that drives participant progress events |
| 2:00-2:15 | End-to-end smoke test | Run local app, submit a progress event, and inspect CAP logs or hosted response | Verified local-to-hosted integration path |
| 2:15-2:30 | Containerization and recap | Review local runtime, environment variables, diffs, and production hardening | Repeatable run plan and key Copilot takeaways |

## Segment Details

### 1. Welcome And Live Demo Vision, 10 Minutes

Introduce the workshop as a practical AI-assisted integration challenge. The room is part of the application: every participant connects to the same hosted service, and the facilitator dashboard shows progress live.

Suggested framing:

- We are building a local participant cockpit for an AI coding workshop.
- CAP owns local state, validation, and integration with the hosted service.
- UI5 provides the participant experience.
- The hosted Workshop Hub collects events from everyone.
- The projector dashboard turns individual progress into a shared live feed.

Facilitator note: even if the hosted service is not implemented yet, show a simple mock screenshot, API sketch, or example payload so the concept feels concrete.

### 2. Copilot Setup, 15 Minutes

Use `docs/00-setup.md` as the setup guide. Keep this segment focused on enabling the workflow, not explaining every Copilot feature.

Cover:

- GitHub Copilot Chat in VS Code.
- Agent Mode for multi-file implementation.
- Inline chat for small local edits.
- Model selection and when to use a stronger reasoning model.
- Custom instructions for CAP, UI5, integration, testing, and containerization.
- MCP servers for documentation lookup, repo context, browser verification, or platform-specific tools.

Checkpoint prompt:

```text

```

### 3. Hosted Contract Briefing, 15 Minutes

Participants practice context engineering before implementation. The facilitator introduces the conceptual hosted service contract and asks Copilot to turn it into a scoped local implementation plan.

Recommended Copilot flow:

1. Ask Copilot to summarize the hosted service contract.
2. Ask it to identify local CAP entities, actions, configuration values, and failure cases.
3. Ask it to identify UI5 views, models, states, and user actions.
4. Ask for a small implementation plan with acceptance criteria.
5. Ask it to call out ambiguous requirements before editing code.

Example prompt:

```text

```

### 4. CAP Integration Exercise, 35 Minutes

Participants use Copilot Agent Mode to work in the CAP backend. The exercise focuses on a local integration boundary rather than deep domain modeling.

Possible tasks:

- Inspect the existing CAP schema and service files.
- Add a simple workshop task or progress entity if needed.
- Add an action such as `registerParticipant`, `sendProgressEvent`, or `sendChatMessage`.
- Read hosted service configuration from environment variables.
- Implement HTTP calls from CAP to the hosted Workshop Hub.
- Add validation for required participant, task, and message fields.
- Handle hosted service failures with useful errors and logs.
- Add a mock or dry-run mode when `WORKSHOP_HUB_URL` is not configured.
- Run a CAP service smoke check.

Example prompt:

```text

```

Expected artifact:

- CAP service that can represent local workshop progress and prepare or send events to the hosted Workshop Hub.

### 5. Live Checkpoint, 10 Minutes

Pause before building the UI. This teaches that integration code needs review, especially when generated by AI.

Review questions:

- Did Copilot follow existing CAP service patterns?
- Did it invent hosted endpoints or payload fields beyond the agreed contract?
- Are environment variables handled safely?
- What happens when the hosted service is unavailable?
- Are errors useful for participants during a live workshop?

Suggested Copilot review prompt:

```text
Review the CAP integration changes for correctness, consistency with the existing repository style, missing validation, unsafe configuration handling, and weak remote-service error handling. List only actionable findings.
```

### 6. UI5 Participant Cockpit, 35 Minutes

The UI5 starter becomes the participant-facing part of the codelab. Keep the UI practical and focused on the workshop flow.

Recommended workflow:

- Show connection status to the hosted Workshop Hub.
- Show participant or team identity.
- Show the codelab task list.
- Let participants mark a task as started or completed.
- Send progress events through CAP.
- Show recent local activity or hosted feed entries if available.
- If time allows, add a lightweight chat message form.

Example prompt:

```text
Act as a SAPUI5 developer. Build a simple participant cockpit using the existing UI5 app structure. Show connection status, participant identity, workshop tasks, progress actions, and recent activity. Call the CAP service actions instead of calling the hosted Workshop Hub directly from the browser.
```

Expected artifact:

- UI5 participant cockpit that drives progress and optional chat events through CAP.

### 7. End-To-End Smoke Test, 15 Minutes

Participants verify that the local app can complete the intended loop.

Smoke test path:

1. Start the local CAP service.
2. Start the UI5 app.
3. Register or identify the participant.
4. Mark a task as started or completed.
5. Confirm CAP logs, dry-run output, or hosted service response.
6. Confirm the UI shows success, failure, or retry guidance clearly.

Suggested verification prompt:

```text
Based on the current CAP and UI5 changes, tell me the shortest reliable smoke test for proving that a participant can send a progress event to the Workshop Hub. Include expected success and failure signals.
```

### 8. Containerization And Recap, 15 Minutes

Use the final segment to reinforce repeatability. The goal is not to fully productionize the hosted service, but to show how local container execution supports consistent development.

Cover:

- Review `compose.workshop.yaml` and `Dockerfile.workshop`.
- Discuss where hosted service environment variables should be configured.
- Explain how a dry-run mode helps when the cloud service is unavailable.
- Inspect diffs before accepting changes.
- Identify production hardening items that are outside workshop scope.

Suggested recap prompt:

```text
Review the workshop changes across CAP, UI5, and containerization. Summarize what was built, how to run it, how progress events flow to the hosted service, what checks were performed, and what should be improved before production use.
```

## GitHub Copilot Best Practices For June 2026

### Context First

Copilot performs better when it can see the system shape. Before asking for implementation, open the README, workshop agenda, service contract, related source files, test files, and configuration files. Ask Copilot to summarize what it sees and correct it if the summary is wrong.

### Prompt In Small Slices

Use a sequence of prompts instead of one huge request:

1. Understand the current code.
2. Understand the remote service contract.
3. Create an implementation plan.
4. Make a scoped CAP change.
5. Make a scoped UI5 change.
6. Add or update tests and smoke checks.
7. Run verification.
8. Review the diff.

### Use The Right Copilot Mode

- Use **Agent Mode** for multi-file changes, scaffolded features, tests, and integration work.
- Use **inline chat** for small local changes in one file.
- Use **chat Q&A** for understanding code, comparing options, and preparing prompts.
- Use a stronger reasoning model when the task requires architecture, debugging, or cross-file planning.

### Make Custom Instructions Practical

Custom instructions should be short, specific, and tied to repository conventions. Good instructions describe stack choices, naming rules, testing expectations, formatting preferences, and architectural boundaries.

Useful instruction categories for this workshop:

- CAP and CDS modeling conventions.
- HTTP integration, configuration, and error-handling conventions.
- UI5 controller, view, routing, model, and i18n conventions.
- Docker and Compose conventions.
- General review and testing expectations.

### Use MCP Servers Deliberately

MCP servers are most useful when they bring trusted external or local context into the workflow. Good uses include documentation lookup, API exploration, browser verification, repository search, and platform-specific guidance. Avoid adding MCP servers just to have more tools available.

### Verify Generated Integration Code

Generated integration code still needs normal engineering discipline:

- Run tests or smoke checks.
- Inspect diffs before accepting changes.
- Validate API paths, payloads, headers, and status codes.
- Check generated UI behavior in the browser.
- Confirm generated commands exist in the repo.
- Confirm secrets and tokens are not committed.
- Test hosted-service unavailable scenarios.
- Ask Copilot to review its own changes for actionable risks.

### Keep Humans In Control

Copilot can accelerate implementation, but the developer owns correctness. Watch for hallucinated APIs, invented dependencies, weak error handling, missing authorization assumptions, leaked configuration, overly broad refactors, and tests that only confirm the implementation rather than the requirement.

## Suggested Facilitator Checklist

Before the workshop:

- Verify Docker Desktop, git, VS Code, and GitHub Copilot access.
- Confirm the workshop container starts with `docker compose -f compose.workshop.yaml up --build -d`.
- Confirm the setup guide still matches the current VS Code Copilot UI.
- Prepare custom instruction files for CAP, UI5, integration, and containerization.
- Prepare a stable hosted Workshop Hub URL or a mock endpoint.
- Prepare a short service contract document or slide with endpoint and payload examples.
- Prepare a projector dashboard concept, mock, or live hosted dashboard.
- Prepare a fallback dry-run mode so participants can complete the exercise even if the hosted service is unavailable.

During the workshop:

- Keep each coding task small enough to complete in 10 to 15 minutes.
- Ask participants to inspect plans before letting Agent Mode edit files.
- Ask participants to read diffs before accepting generated changes.
- Run at least one verification command or smoke check for CAP and UI5.
- Watch the projector feed for stalled participants or repeated failure events.
- Capture prompt improvements as shared learnings.

After the workshop:

- Share the final prompts that produced the best results.
- Share known limitations and extension exercises.
- Export or summarize the live progress feed if useful.
- Encourage participants to adapt the custom instructions to their own repositories.

## Future Hosted Service Backlog

The hosted Workshop Hub is outside the current repository scope, but it will become the centerpiece of the live experience. A future implementation could include:

- Session creation and facilitator controls.
- Participant registration and display names.
- Progress event ingestion.
- Chat or activity feed ingestion.
- Projector dashboard with live participant progress.
- WebSocket or Server-Sent Events support for real-time updates.
- Simple authentication using session codes or short-lived tokens.
- Rate limiting and input validation.
- Export of final workshop metrics.

## Extension Ideas

If the group moves quickly, add one of these extensions:

- Add a chat message form in UI5 and forward messages through CAP.
- Add UI filtering by task status, participant identity, or event type.
- Add CAP tests for validation and hosted-service failure handling.
- Add a mock Workshop Hub server for local development.
- Add Compose environment variable examples for the hosted service.
- Use Copilot to create a pull request summary and review checklist.
- Add a short security review for tokens, input validation, and exposed endpoints.

## Out Of Scope For The Core Session

The following topics are valuable, but should remain optional for a 2.5-hour workshop:

- Implementing the full hosted Workshop Hub during the session.
- Full production authentication and authorization.
- SAP BTP deployment.
- Full CI/CD pipeline setup.
- Complete end-to-end test automation.
- Deep domain modeling beyond the workshop progress scenario.
- Large-scale refactoring of the starter projects.