# Neomore GitHub Copilot Coding Workshop

![GitHub Copilot Vibe Coding Workshop](./images/banner.png)

Let's do agentic coding using [GitHub Copilot](https://docs.github.com/copilot/about-github-copilot/what-is-github-copilot) and its newest and greatest features in UI5, CAP and Java. Ready to jump in?

## Background

Contoso is a company that sells products for various outdoor activities. A marketing department of Contoso would like to launch a micro social media website to promote their products for existing and potential customers. As their first MVP, they want to quickly build the website. The IT department of Contoso needs a Java developer to deliver the application quickly before the launch date.

But here's the situation...

## Workshop Objectives

- Build applications using GitHub Copilot Agent Mode.
- Add custom instruction to GitHub Copilot so that you have more control over GitHub Copilot.
- Add various MCP servers to GitHub Copilot so that you build the applications more precisely.

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

If you want to run the complete containerization sample apps, use:

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
| 01: Java Backend                   | [03-java.md](./docs/03-java.md)                         |
| 02: Containerization               | [05-containerization.md](./docs/05-containerization.md) |

## Complete Samples

Check out the complete example of each application. They're also vibe-coded with GitHub Copilot, therefore, they might not be perfect, and you don't have to follow the app.

| Language            | Application | Location                             |
|---------------------|-------------|--------------------------------------|
| Java Backend        | Spring Boot | [java](./complete/java/)             |
| Containerization    | Container   | [containerization](./complete/)      |

## Read More...

- [GitHub Copilot](https://docs.github.com/en/copilot/about-github-copilot/what-is-github-copilot)
- [GitHub Copilot: Agent Mode](https://code.visualstudio.com/blogs/2025/04/07/agentMode)
- [GitHub Copilot: MCP](https://code.visualstudio.com/blogs/2025/05/12/agent-mode-meets-mcp)
- [GitHub Copilot: Custom Instructions](https://code.visualstudio.com/docs/copilot/copilot-customization)
- [GitHub Copilot: Changing AI Models](https://docs.github.com/en/copilot/using-github-copilot/ai-models/changing-the-ai-model-for-copilot-chat?tool=vscode)
- [Curated MCP Servers](https://github.com/modelcontextprotocol/servers)
