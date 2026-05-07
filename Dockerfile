# ─────────────────────────────────────────────────────────────────────────────
# SpotCast — Railway Dockerfile
#
# Uses node:20-bookworm-slim as base, installs Chromium system libraries,
# then runs `npx playwright install chromium` so Daleel Madani and EJN
# (both behind Cloudflare Managed Challenge) can be scraped.
#
# Build stages:
#   1. deps    — install production + dev deps (for build)
#   2. builder — build Next.js app
#   3. runner  — lean production image
# ─────────────────────────────────────────────────────────────────────────────

# ── Stage 1: Install dependencies ─────────────────────────────────────────────
FROM node:20-bookworm-slim AS deps

WORKDIR /app

# Install system libraries that Chromium requires at runtime
# These are the exact packages that `playwright install --with-deps` installs
# on Debian/Ubuntu. Installing them here ensures they're in the final image.
RUN apt-get update && apt-get install -y --no-install-recommends \
    # Chromium core
    libnss3 \
    libnspr4 \
    # Accessibility
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libatspi2.0-0 \
    # Printing
    libcups2 \
    # GPU / graphics
    libdrm2 \
    libgbm1 \
    libgl1-mesa-glx \
    # Display
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libx11-6 \
    libxcb1 \
    libxext6 \
    # Audio
    libasound2 \
    # Text rendering
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libcairo2 \
    # Fonts
    fonts-liberation \
    fonts-noto-color-emoji \
    # Network / TLS
    ca-certificates \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install ALL deps (dev included — needed for build)
# Skip Playwright browser auto-download during npm install
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
RUN npm ci

# Install Playwright Chromium browser (now that system deps are present)
# This downloads only the Chromium binary (~120 MB), not other browsers
RUN npx playwright install chromium

# Generate Prisma client
RUN npx prisma generate


# ── Stage 2: Build Next.js ─────────────────────────────────────────────────────
FROM deps AS builder

WORKDIR /app

COPY . .

# Build the app
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build


# ── Stage 3: Production runner ─────────────────────────────────────────────────
FROM node:20-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
# Tell Playwright exactly where to find the Chromium binary we installed as root.
# Without this, when the app runs as the non-root "nextjs" user, Playwright resolves
# the path relative to that user's home dir (~/.cache/ms-playwright) which doesn't exist.
ENV PLAYWRIGHT_BROWSERS_PATH=/root/.cache/ms-playwright

# Re-install Chromium system libraries in the runner stage
RUN apt-get update && apt-get install -y --no-install-recommends \
    libnss3 libnspr4 libatk1.0-0 libatk-bridge2.0-0 libatspi2.0-0 \
    libcups2 libdrm2 libgbm1 libgl1-mesa-glx \
    libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 \
    libx11-6 libxcb1 libxext6 libasound2 \
    libpango-1.0-0 libpangocairo-1.0-0 libcairo2 \
    fonts-liberation fonts-noto-color-emoji ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy built output from builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/next.config.ts ./
COPY --from=builder /app/app/generated ./app/generated

# Copy Playwright Chromium browser from builder (so we don't re-download)
COPY --from=builder /root/.cache/ms-playwright /root/.cache/ms-playwright

# Install production-only node_modules
RUN npm ci --omit=dev

# Make non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs && \
    chown -R nextjs:nodejs /app && \
    chown -R nextjs:nodejs /root/.cache/ms-playwright

USER nextjs

EXPOSE 3000

CMD ["sh", "-c", "npm start -- -p ${PORT:-3000}"]
