# --- Build: instala todo, genera el cliente de Prisma y compila TypeScript ---
FROM node:24-alpine AS build
WORKDIR /app

COPY package.json package-lock.json prisma.config.ts ./
COPY prisma ./prisma
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# --- Runtime: solo dependencias de producción y el código compilado ---
FROM node:24-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
# --ignore-scripts: el postinstall (prisma generate) necesita el CLI, que es devDependency;
# el cliente ya viene generado y compilado en dist/
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

COPY --from=build /app/dist ./dist
COPY views ./views
COPY public ./public

USER node
EXPOSE 3000
CMD ["node", "dist/index.js"]
