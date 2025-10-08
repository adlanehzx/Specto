# ============================================
# Stage 1: Builder - Build TypeScript
# ============================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./
COPY tsconfig.json ./

# Installer les dépendances (y compris devDependencies pour le build)
# Utiliser npm ci si package-lock.json existe, sinon npm install
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# Copier le code source
COPY . .

# Générer le client Prisma
RUN npx prisma generate

# Compiler TypeScript
RUN npm run build

# ============================================
# Stage 2: Production - Image légère
# ============================================
FROM node:20-alpine AS production

WORKDIR /app

# Installer Playwright avec dépendances système + cloudflared
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    openssl \
    openssl-dev \
    wget

# Installer cloudflared pour les tunnels Cloudflare
RUN wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -O /usr/local/bin/cloudflared && \
    chmod +x /usr/local/bin/cloudflared && \
    cloudflared --version

# Variables d'environnement pour Playwright
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
ENV PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer TOUTES les dépendances (y compris @playwright/test qui est en devDependencies)
# Playwright est nécessaire en runtime pour exécuter les tests
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# Copier le code compilé depuis le builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Copier les fichiers Prisma pour les migrations
COPY prisma ./prisma

# Créer le dossier pour les screenshots
RUN mkdir -p /app/screenshots && chmod 777 /app/screenshots

# Exposer le port
EXPOSE 4000

# Commande de démarrage (avec génération du client Prisma et migration)
CMD ["sh", "-c", "npx prisma generate && npx prisma migrate deploy && node dist/server.js"]
