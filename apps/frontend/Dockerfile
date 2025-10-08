# ============================================
# Stage 1: Dependencies - Install all dependencies
# ============================================
FROM node:20-alpine AS deps

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# ============================================
# Stage 2: Builder - Build Next.js
# ============================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copier node_modules depuis deps
COPY --from=deps /app/node_modules ./node_modules

# Copier le code source
COPY . .

# Variables d'environnement pour le build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build Next.js avec standalone output
RUN npm run build

# ============================================
# Stage 3: Production - Image légère
# ============================================
FROM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Créer un utilisateur non-root
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copier les fichiers nécessaires depuis le builder
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Utiliser l'utilisateur non-root
USER nextjs

# Exposer le port
EXPOSE 3000

# Variable d'environnement pour le port
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Commande de démarrage
CMD ["node", "server.js"]
