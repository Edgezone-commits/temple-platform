# The Next.js website.
#
#   docker build -t temple-frontend ./frontend
#
# Node 22 LTS, not 20: Next 16 needs >= 20.9, and Node 20 reached end of life
# in April 2026, so 20 would ship an unpatched runtime on a public site.
#
# IMPORTANT — why .env.local is NOT excluded from this build context:
# every NEXT_PUBLIC_* value is compiled into the browser bundle by `next build`,
# so the build must be able to read them. They are public by definition (the
# prefix is the promise), and the finished bundle contains them anyway, so
# copying the file in leaks nothing that visitors can't already read. Real
# secrets live in backend/.env, which this image never sees.
#
# Consequence: changing a NEXT_PUBLIC_* value needs a REBUILD, not a restart.
#   docker compose up --build

# ---------------------------------------------------------------- deps
FROM node:22-alpine AS deps
WORKDIR /app
# npm ci needs both files and installs exactly what the lockfile pins.
COPY package.json package-lock.json ./
RUN npm ci

# ---------------------------------------------------------------- build
FROM node:22-alpine AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ---------------------------------------------------------------- runtime
FROM node:22-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# node:alpine ships a `node` user (uid 1000); make our own so the uid is fixed.
RUN addgroup -g 10001 nodejs && adduser -S -u 10001 -G nodejs nextjs

# standalone/ holds server.js plus only the node_modules actually reachable.
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
# server.js does not serve these two itself — they have to sit beside it.
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=build --chown=nextjs:nodejs /app/public ./public

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:3000/en',r=>process.exit(r.statusCode<400?0:1)).on('error',()=>process.exit(1))"

CMD ["node", "server.js"]
