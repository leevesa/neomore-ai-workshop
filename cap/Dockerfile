# Container image for the CAP service that fronts the Workshop Hub.
# Build context is the `cap/` folder.
FROM node:22-slim

# Default runtime configuration. Every value can be overridden at `docker run`
# / compose time so the same image works against a local or cloud Hub.
#
# CDS_REQUIRES_AUTH_KIND=dummy disables authentication. In production CAP
# otherwise defaults to the `jwt` strategy, which requires the (uninstalled)
# `@sap/xssec` package. The services define no auth restrictions, so `dummy`
# is appropriate for this workshop backend.
ENV NODE_ENV=production \
    PORT=4004 \
    CDS_REQUIRES_AUTH_KIND=dummy \
    WORKSHOP_HUB_URL=http://localhost:8080 \
    WORKSHOP_PASSWORD="" \
    WORKSHOP_HTTP_TIMEOUT_MS=8000

WORKDIR /app

# Install dependencies first for better layer caching. @cap-js/sqlite (a
# devDependency) is needed at runtime for the in-memory work-order data, so we
# install all dependencies.
COPY package.json ./
RUN npm install --no-audit --no-fund

COPY . .

EXPOSE 4004

# `cds-serve` (bundled with @sap/cds) bootstraps the in-memory SQLite database,
# loads the CSV seed data for the work-order service, and serves every service
# in srv/ (including the Workshop Hub integration service).
CMD ["npx", "cds-serve"]
