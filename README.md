# Neomore GitHub Copilot Coding Workshop

![GitHub Copilot Vibe Coding Workshop](./images/banner.png)

Let's do agentic coding using [GitHub Copilot](https://docs.github.com/copilot/about-github-copilot/what-is-github-copilot) and its newest and greatest features in UI5, CAP and Java. Ready to jump in?

## Background

Participants improve a live workshop chat application built with SAPUI5 and CAP.
A shared Spring Boot Workshop Hub validates real API activity and projects team
progress, messages, avatars, and heartbeats on a facilitator dashboard.

## Workshop Objectives

- Debug and enhance a multi-service application with GitHub Copilot Agent Mode.
- Trace contracts across UI5, CAP, and Java before making focused changes.
- Validate behavior with automated tests and Hub-observed API activity.

## Prerequisites

This workshop is designed to run locally with Docker Compose.
Before starting, make sure you've installed everything identified below.

### Run Locally with Docker Compose

If you prefer a local containerized setup, use the files in the repository root.

1. Start the workshop container.

    ```bash
    docker compose -f compose.workshop.yaml up --build -d
    ```

1. Open a shell in the container.

    ```bash
    docker compose -f compose.workshop.yaml exec workshop bash
    ```

1. Run the workshop steps from that shell. App ports are exposed by the app compose files you run.
1. Stop the environment when done.

    ```bash
    docker compose -f compose.workshop.yaml down
    ```

To run the finished Workshop Hub, CAP, and UI5 reference stack, use:

```bash
docker compose -f complete/compose.yaml up --build -d
```

### Common

- [Visual Studio Code](https://code.visualstudio.com/)
- [git CLI](https://git-scm.com/downloads)
- [Docker Desktop](https://docs.docker.com/get-started/introduction/get-docker-desktop/)


## Workshop Instructions

This is a self-paced workshop by following the links below:

| Step                               | Link                                                    |
|------------------------------------|---------------------------------------------------------|
| 00: Development Environment        | [00-setup.md](./docs/00-setup.md)                       |
| 01: 60-Minute Chat Workshop        | [01-chat-workshop.md](./docs/01-chat-workshop.md)       |
| 02: Containerization               | [05-containerization.md](./docs/05-containerization.md) |

## Workshop Layout

| Location | Purpose |
|----------|---------|
| [`ui5/`](./ui5/) and [`cap/`](./cap/) | Runnable workshop starters with intentional TODO defects |
| [`workshop-hub/`](./workshop-hub/) | Server-side task validation and facilitator dashboard |
| [`complete/`](./complete/) | Finished CAP/UI5 reference and aggregate Compose stack |

## Read More...

- [GitHub Copilot](https://docs.github.com/en/copilot/about-github-copilot/what-is-github-copilot)
- [GitHub Copilot: Agent Mode](https://code.visualstudio.com/blogs/2025/04/07/agentMode)
- [GitHub Copilot: MCP](https://code.visualstudio.com/blogs/2025/05/12/agent-mode-meets-mcp)
- [GitHub Copilot: Custom Instructions](https://code.visualstudio.com/docs/copilot/copilot-customization)
- [GitHub Copilot: Changing AI Models](https://docs.github.com/en/copilot/using-github-copilot/ai-models/changing-the-ai-model-for-copilot-chat?tool=vscode)
- [Curated MCP Servers](https://github.com/modelcontextprotocol/servers)
