FROM node:22-alpine AS base

WORKDIR /app

COPY package*.json ./

FROM base AS development

RUN npm install

COPY . .

EXPOSE 5174 5175

CMD ["npm", "run", "dev"]

FROM base AS build

RUN npm ci

COPY . .

RUN npm run build

FROM node:22-alpine AS production

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist
COPY server ./server

EXPOSE 5175

CMD ["node", "server/index.mjs"]
