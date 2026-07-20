# ───────────────────────────────────────────────────────
# Stage 1 – Install production dependencies
# ───────────────────────────────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app

# Copy only the files npm needs to resolve the dependency tree
COPY package.json package-lock.json ./

# Install production dependencies only (no devDependencies)
RUN npm ci --omit=dev

# ───────────────────────────────────────────────────────
# Stage 2 – Build / prepare the application source
# ───────────────────────────────────────────────────────
FROM node:20-alpine AS build

WORKDIR /app

# Bring in all deps (including dev) for any build tooling
COPY package.json package-lock.json ./
RUN npm ci

# Copy the full source tree
COPY . .

# If a build script exists, run it (currently the project is plain JS
# so this is a no-op guard for future TypeScript migration)
RUN npm run build --if-present

# ───────────────────────────────────────────────────────
# Stage 3 – Slim runtime image
# ───────────────────────────────────────────────────────
FROM node:20-alpine AS runtime

# Harden: run as a non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

ENV NODE_ENV=production

# Copy production node_modules from the deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy application source from the build stage
COPY --from=build /app ./

# If a dist/ folder was produced by the build, it's already included.
# Remove leftover dev artefacts that slipped through .dockerignore
RUN rm -rf .env .git

# Create uploads/temp dirs the app may need at runtime
RUN mkdir -p uploads temp && chown -R appuser:appgroup /app

USER appuser

EXPOSE 5000

CMD ["node", "server.js"]
