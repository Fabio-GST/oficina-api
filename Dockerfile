# syntax=docker/dockerfile:1

FROM node:24-alpine AS base

# --- Dependências (todas) ---
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# --- Build (compila TypeScript para ./build) ---
FROM base AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN node ace build

# --- Imagem de produção ---
FROM base AS production
ENV NODE_ENV=production
ENV PORT=3333
WORKDIR /app

# Instala apenas as dependências de runtime antes de copiar o build, para
# aproveitar o cache de camadas quando só o código muda.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build --chown=node:node /app/build ./
# Spec OpenAPI versionada: em producao o adonis-autoswagger le swagger.json pre-gerado
# em vez de montar a spec a cada requisicao (sem ele, /swagger responde 500).
COPY --from=build --chown=node:node /app/docs/openapi.json ./swagger.json

# Processo sem privilégios (o usuário "node" já existe na imagem oficial).
USER node

EXPOSE 3333

# Healthcheck usa o endpoint /health da própria API (sem depender de curl/wget).
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3333)+'/health').then((r)=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "bin/server.js"]
