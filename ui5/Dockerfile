# Container image for the UI5 Fiori application.
# Build context is the `ui5/` folder.
FROM node:22-slim

WORKDIR /app

# Install dependencies first for better layer caching.
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .

EXPOSE 8080

# Serve the Fiori app using the docker-specific UI5 tooling config.
# ui5-docker.yaml proxies /workshop-hub to the `cap` service in the
# Docker Compose network (http://cap:4004).
#
# Use `ui5 serve` (not `fiori run`) because `fiori run` only binds to
# localhost inside the container and has no host option, so Docker's port
# forward returns an empty reply. `--accept-remote-connections` binds the
# server to 0.0.0.0 so the mapped host port (8081 -> 8080) is reachable.
CMD ["npx", "ui5", "serve", "--config", "./ui5-docker.yaml", "--accept-remote-connections", "--port", "8080"]
