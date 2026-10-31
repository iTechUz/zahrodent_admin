# syntax=docker/dockerfile:1

# ---------- build ----------
FROM node:20.20.2-alpine3.23 AS build
WORKDIR /app

COPY package.json package-lock.json ./
# npm cache build'lar orasida saqlanadi (image'ga tushmaydi).
RUN --mount=type=cache,target=/root/.npm \
    npm ci --no-audit --no-fund

COPY . .
# Build-time default only. At runtime the container's VITE_API_URL (docker run --env-file)
# is written to /env-config.js and takes precedence (see docker/40-env-config.sh).
ARG VITE_API_URL=https://api.zahro.iqroagency.uz
ENV VITE_API_URL=${VITE_API_URL}
RUN npm run build

# ---------- runtime ----------
FROM nginx:1.31.8-alpine3.24

# `apk upgrade` pulls fixed Alpine packages (e.g. brotli-libs, curl) newer than the base image
# snapshot — keeps the Trivy CRITICAL gate in CD green.
RUN apk upgrade --no-cache

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY docker/security-headers.conf /etc/nginx/snippets/security-headers.conf
COPY docker/40-env-config.sh /docker-entrypoint.d/40-env-config.sh
RUN chmod +x /docker-entrypoint.d/40-env-config.sh
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8071
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:8071/healthz || exit 1

# nginx image entrypoint runs /docker-entrypoint.d/*.sh, then starts nginx
CMD ["nginx", "-g", "daemon off;"]
