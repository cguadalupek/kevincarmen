FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY apps/api/package.json ./apps/api/
COPY packages/types/package.json ./packages/types/
RUN pnpm install --frozen-lockfile || pnpm install

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY . .
RUN pnpm --filter @kevincarmen/api prisma:generate
RUN pnpm --filter @kevincarmen/api build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN npm install -g prisma@6.19.3
COPY --from=builder /app ./
WORKDIR /app/apps/api
EXPOSE 4001
CMD ["sh", "-c", "prisma migrate deploy && node dist/main.js"]
