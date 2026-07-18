FROM node:22-alpine AS base

WORKDIR /app

COPY package*.json ./

FROM base AS development

RUN npm install

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

FROM base AS build

RUN npm ci

COPY . .

ARG VITE_MQTT_PROTOCOL=ws
ARG VITE_MQTT_HOST=mqtt.conceptio.cloud
ARG VITE_MQTT_PORT=8083
ARG VITE_MQTT_PATH=/mqtt
ARG VITE_MQTT_CLIENT_ID=syscraft_arena
ARG VITE_MQTT_ROOT_TOPIC=syscraft/arena

ENV VITE_MQTT_PROTOCOL=$VITE_MQTT_PROTOCOL
ENV VITE_MQTT_HOST=$VITE_MQTT_HOST
ENV VITE_MQTT_PORT=$VITE_MQTT_PORT
ENV VITE_MQTT_PATH=$VITE_MQTT_PATH
ENV VITE_MQTT_CLIENT_ID=$VITE_MQTT_CLIENT_ID
ENV VITE_MQTT_ROOT_TOPIC=$VITE_MQTT_ROOT_TOPIC

RUN npm run build

FROM nginxinc/nginx-unprivileged:1.27-alpine AS production

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080
