# Deploy the Arena visualizer to a VPS

This deploys the static Arena frontend as a small Nginx container. MQTT stays
external: browsers connect directly to the configured WebSocket broker.

## Prerequisites

- SSH access to the VPS
- Docker Engine with the Docker Compose plugin on the VPS
- Firewall access to the selected HTTP port (default: `8080`)

## Upload and launch

From the project directory on your computer, copy the source to the VPS:

```bash
rsync -az --delete \
  --exclude .git --exclude frontend/node_modules --exclude frontend/dist \
  ./ USER@VPS_HOST:/opt/syscraft-arena/
```

Then connect to the VPS and launch the visualizer:

```bash
ssh USER@VPS_HOST
cd /opt/syscraft-arena
docker compose -f docker-compose.vps.yml up --build -d
docker compose -f docker-compose.vps.yml ps
```

Open `http://VPS_HOST:8080`.

## MQTT configuration

The default image uses the current broker and topic root:

```text
ws://mqtt.conceptio.cloud:8083/mqtt
syscraft/arena/#
```

For a different broker, create `/opt/syscraft-arena/.env` on the VPS before
building:

```dotenv
ARENA_HTTP_PORT=8080
VITE_MQTT_PROTOCOL=wss
VITE_MQTT_HOST=broker.example.org
VITE_MQTT_PORT=443
VITE_MQTT_PATH=/mqtt
VITE_MQTT_CLIENT_ID=syscraft_arena_vps
VITE_MQTT_ROOT_TOPIC=syscraft/arena
```

Rebuild after changing any `VITE_MQTT_*` value:

```bash
docker compose -f docker-compose.vps.yml up --build -d
```

For an HTTPS domain, place this container behind the VPS's existing reverse
proxy and use `wss` for the MQTT broker to avoid browser mixed-content blocks.
