# 05: Containerization

## Scenario

Contoso is a company that sells products for various outdoor activities. A marketing department of Contoso would like to launch a micro social media website to promote their products for existing and potential customers.

They now have a Java-based backend app. They want to make it containerized so that it can be deployed on any platform.

Now, as a DevOps engineer, you should containerize both apps.

## Prerequisites

Refer to the [README](../README.md) doc for preparation.

## Getting Started

- [Check GitHub Copilot Agent Mode](#check-github-copilot-agent-mode)
- [Prepare Custom Instructions](#prepare-custom-instructions)
- [Containerize Java Application](#containerize-java-application)
- [Orchestrate Containers](#orchestrate-containers)

### Check GitHub Copilot Agent Mode

1. Click the GitHub Copilot icon on the top of GitHub Codespace or VS Code and open GitHub Copilot window.

   ![Open GitHub Copilot Chat](./images/setup-02.png)

1. If you're asked to login or sign up, do it. It's free of charge.
1. Make sure you're using GitHub Copilot Agent Mode.

   ![GitHub Copilot Agent Mode](./images/setup-03.png)

1. Select model to either `GPT-4.1` or `Claude Sonnet 4`.
1. Make sure that you've configured [MCP Servers](./00-setup.md#set-up-mcp-servers).

### Prepare Custom Instructions

1. Set the environment variable of `$REPOSITORY_ROOT`.

   ```bash
   # bash/zsh
   REPOSITORY_ROOT=$(git rev-parse --show-toplevel)
   ```

   ```powershell
   # PowerShell
   $REPOSITORY_ROOT = git rev-parse --show-toplevel
   ```

1. Copy custom instructions.

    ```bash
    # bash/zsh
    cp -r $REPOSITORY_ROOT/docs/custom-instructions/containerization/. \
          $REPOSITORY_ROOT/.github/
    ```

    ```powershell
    # PowerShell
    Copy-Item -Path $REPOSITORY_ROOT/docs/custom-instructions/containerization/* `
              -Destination $REPOSITORY_ROOT/.github/ -Recurse -Force
    ```

### Containerize Java Application

1. Make sure that you're using GitHub Copilot Agent Mode with the model of `Claude Sonnet 4` or `GPT-4.1`.
1. Use prompt like below to build a container image for the Java app.

    ```text
    I'd like to build a container image of a Java app. Follow the instructions below.

    - Identify all the steps first, which you're going to do.
    - The Java app is located at `java/socialapp`.
    - Your working directory is the repository root.
    - Create a Dockerfile, `Dockerfile.java`.
    - Use Microsoft OpenJDK 21.
    - Use multi-stage build approach.
    - Extract JRE from JDK.
    - Use the target port number of `8080` for the container image.
    - Add both environment variables, `CODESPACE_NAME` and `GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN` from the host to the container image.
    - Create an SQLite database file, `sns_api.db`, in the container image. DO NOT Copy the file from the host.
    ```

1. Click the ![the keep button image](https://img.shields.io/badge/keep-blue) button of GitHub Copilot to take the changes.

1. Once `Dockerfile.java` is created, build the container image with the following prompt.

    ```text
    Use `Dockerfile.java` and build a container image.

    - Use `contoso-backend` as the container image name.
    - Use `latest` as the container image tag.
    - Verify if the container image is built properly.
    - If the build fails, analyze the issues and fix them.
    ```

1. Click the ![the keep button image](https://img.shields.io/badge/keep-blue) button of GitHub Copilot to take the changes.

1. Once the build succeeds, run the container image with the following prompt.

    ```text
    Use the container image just built, run a container and verify if the app is running properly.
    
    - Use the host port of `8080`.
    - Both `CODESPACE_NAME` and `GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN` values should be the ones from GitHub Codespaces.
    ```

### Orchestrate Containers

1. Make sure that you're using GitHub Copilot Agent Mode with the model of `Claude Sonnet 4` or `GPT-4.1`.
1. Use prompt like below to build a Docker Compose file.

    ```text
    I'd like to create a Docker Compose file. Follow the instructions below.
    
    - Identify all the steps first, which you're going to do.
    - Your working directory is the repository root.
    - Use `Dockerfile.java` as the app image.
    - Create `compose.yaml` as the Docker Compose file.
    - Use `contoso` as the network name.
    - Use `contoso-backend` as the container name of the Java app. Its target port is 8080, and host port is 8080.
    - Add both environment variables, `CODESPACE_NAME` and `GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN` from the host to the container.
    ```

1. Click the ![the keep button image](https://img.shields.io/badge/keep-blue) button of GitHub Copilot to take the changes.

1. Once the `compose.yaml` file is created, run it and verify if the app is running properly.

    ```text
    Run the Docker compose file and verify if the app is running properly.
    ```

1. Open a web browser and navigate to `http://localhost:8080`, and verify if the app is up and running properly.

---

Congratulations! 🎉 You've completed all the workshop sessions successfully!
