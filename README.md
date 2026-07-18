# SysCraft Arena

SysCraft Arena is the executable runtime foundation for distributed System-of-Systems simulation.

## Development

Start the current webapp foundation:

```bash
docker compose up --build
```

Then open:

```text
http://localhost:5173
```

## Current Stack

- React + TypeScript
- Vite
- React Flow
- MapLibre GL map rendering
- Docker Compose frontend service

The compose project is intentionally small for the first webapp pass. Gateway, simulation core, MQTT, and database services will be added as the runtime contracts settle.

## Map Sources

The webapp supports:

- MapLibre 2D map mode
- MapLibre 3D terrain/building mode

The current MapLibre style uses OpenStreetMap raster tiles as the 2D base, MapLibre demo DEM tiles for terrain, and OpenMapTiles demo vector building data for early 3D extrusion testing.

## MQTT Demo Publisher

To publish moving demo entities into the Arena:

```bash
python3 -m pip install -r scripts/requirements.txt
export SYSCRAFT_MQTT_PASSWORD="your-password"
python3 scripts/mqtt_entity_loop.py
```

The publisher uses WARA-PS-shaped `syscraft/arena/unit/{agentType}/simulation/{unit}/{sensor_info|heartbeat}` topics. It sends retained, low-rate entity snapshots and compact, frequent heartbeats. See the [MQTT message-format tutorial](docs/mqtt-message-format.md).

If you prefer JupyterLab, open:

```text
notebooks/syscraft_mqtt_entity_loop.ipynb
```

The notebook exposes `start_publisher()` and `stop_publisher()` cells for an interactive loop.

For debugging one entity at a time, open:

```text
notebooks/syscraft_single_entity_heartbeat.ipynb
```

It previews and publishes one WARA-PS `SensorInfo` snapshot plus compact `HeartBeat` packets under `syscraft/arena/unit/air/simulation/mqtt-contract-test-01/`.

To inspect the packets delivered by the broker from JupyterLab, open:

```text
notebooks/syscraft_mqtt_subscriber.ipynb
```
