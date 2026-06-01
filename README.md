# GitHub Copilot Vibe Coding Workshop

![GitHub Copilot Vibe Coding Workshop](./images/banner.png)

Let's vibe-code with [GitHub Copilot](https://docs.github.com/copilot/about-github-copilot/what-is-github-copilot) and its newest and greatest features in Java, as well as make the app cloud-native by containerization. Are you ready to jump in?

## Background

Contoso is a company that sells products for various outdoor activities. A marketing department of Contoso would like to launch a micro social media website to promote their products for existing and potential customers. As their first MVP, they want to quickly build the website. The IT department of Contoso needs a Java developer to deliver the application quickly before the launch date.

But here's the situation...

## Workshop Objectives

- Build applications using GitHub Copilot Agent Mode.
- Add custom instruction to GitHub Copilot so that you have more control over GitHub Copilot.
- Add various MCP servers to GitHub Copilot so that you build the applications more precisely.

## Workshop in Your Language

This workshop material is currently provided in the following languages:

[English](./README.md) | [Español](./localisation/es-es/) | [Français](./localisation/fr-fr/) | [日本語](./localisation/ja-jp/) | [한국어](./localisation/ko-kr/) | [Português](./localisation/pt-br/) | [中文(简体)](./localisation/zh-cn/)

## Prerequisites

During this workshop, [GitHub Codespaces](https://docs.github.com/en/codespaces/about-codespaces/what-are-codespaces) is highly recommended because there's no need for preparation, except a web browser.

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/microsoft/github-copilot-vibe-coding-workshop)

However, if you really need to use your machine, make sure you've installed everything identified below.

### Run Locally with Docker Compose (Alternative to Codespaces)

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
- VS Code [GitHub Copilot](https://marketplace.visualstudio.com/items?itemName=GitHub.copilot) Extension
- VS Code [GitHub Copilot Chat](https://marketplace.visualstudio.com/items?itemName=GitHub.copilot-chat) Extension
- 💥 For Windows users 👉 [PowerShell 7](https://learn.microsoft.com/powershell/scripting/install/installing-powershell)
- [git CLI](https://git-scm.com/downloads)
- [GitHub CLI](https://cli.github.com/)
- [Docker Desktop](https://docs.docker.com/get-started/introduction/get-docker-desktop/)

### Java

- [SDKMAN](https://sdkman.io/)
- [OpenJDK 21](https://learn.microsoft.com/java/openjdk/download) through SDKMAN
- [Apache Maven](https://maven.apache.org/download.cgi) through SDKMAN
- [Gradle Build Tool](https://docs.gradle.org/current/userguide/installation.html) through SDKMAN
- [Spring Boot Initializr](https://docs.spring.io/spring-boot/cli/installation.html) through SDKMAN
- VS Code [Extension Pack for Java](https://marketplace.visualstudio.com/items/?itemName=vscjava.vscode-java-pack) Extension
- VS Code [Spring Boot Extension Pack](https://marketplace.visualstudio.com/items/?itemName=vmware.vscode-boot-dev-pack) Extension

## Product Requirements Document

First and foremost, the place for you to start is this [PRD (Product Requirements Document)](./product-requirements.md). This document will give you a better understanding of what to do and how to do it.

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

- [GitHub Codespaces](https://docs.github.com/en/codespaces/about-codespaces/what-are-codespaces)
- [GitHub Copilot](https://docs.github.com/en/copilot/about-github-copilot/what-is-github-copilot)
- [GitHub Copilot: Agent Mode](https://code.visualstudio.com/blogs/2025/04/07/agentMode)
- [GitHub Copilot: MCP](https://code.visualstudio.com/blogs/2025/05/12/agent-mode-meets-mcp)
- [GitHub Copilot: Custom Instructions](https://code.visualstudio.com/docs/copilot/copilot-customization)
- [GitHub Copilot: Changing AI Models](https://docs.github.com/en/copilot/using-github-copilot/ai-models/changing-the-ai-model-for-copilot-chat?tool=vscode)
- [Curated MCP Servers](https://github.com/modelcontextprotocol/servers)
