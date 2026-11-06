FROM node:24-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ENV SOMA_WEB_BASE=/soma EXPO_PUBLIC_URL_BACKEND=/soma/api
RUN NODE_OPTIONS=--max-old-space-size=512 npx expo export --platform web --max-workers 1

FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production PORTA=3001 ENDERECO=0.0.0.0
COPY package*.json ./
RUN npm ci --omit=dev
COPY backend ./backend
COPY deploy/korvy/rota-caddy.cjs ./deploy/korvy/rota-caddy.cjs
COPY --from=build /app/dist ./dist
USER node
EXPOSE 3001
CMD ["node", "backend/servidor.js"]
