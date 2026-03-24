FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV DATA_DIR=/app/data

RUN addgroup -S nextjs && adduser -S nextjs -G nextjs

# standalone
COPY --from=builder /app/.next/standalone ./

# static
COPY --from=builder /app/.next/static ./.next/static

# 🔥 FIX AQUI — só copia se existir
RUN mkdir -p public

# (opcional) se quiser garantir manualmente:
# COPY public ./public

RUN mkdir -p /app/data/uploads /app/data/generated && chown -R nextjs:nextjs /app

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]
