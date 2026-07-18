# MQTT message format

This is the current wire contract for SysCraft Arena. Keep this document and `frontend/src/mqtt/arenaMessage.ts` in sync whenever a field or topic changes.

The contract follows the WARA-PS JSON/MQTT naming convention and its `sensor_info` and `heartbeat` envelopes. The Arena reads only these two endpoints.

## Topic layout

```text
{prefix}/unit/{agent-type}/{state}/{unit}/sensor_info
{prefix}/unit/{agent-type}/{state}/{unit}/heartbeat
```

The Arena base topic is `syscraft/arena`, the default state is `simulation`, and topic segments are lowercase. For example:

```text
syscraft/arena/unit/air/simulation/debug-aircraft-01/sensor_info
syscraft/arena/unit/air/simulation/debug-aircraft-01/heartbeat
```

`agent-type` is one of the WARA-PS values: `air`, `ground`, `surface`, or `subsurface`. The `unit` segment and the payload `name` must be the same stable identifier. `agent-uuid` changes when the publisher restarts.

The Arena can still represent `space`, `cyber`, and `social` in the snapshot extension. Its demo publisher maps those three to the closest permitted WARA-PS routing type (`air` for space; `ground` for cyber and social), while preserving the Arena-specific domain in `arena-entity.domain`.

## 1. Full entity snapshot: `sensor_info`

Publish this retained packet at a low rate (the demo uses one every 30 seconds, QoS 1), at startup, and whenever entity metadata or location materially changes. It uses the WARA-PS `SensorInfo` fields plus one documented SysCraft extension, `arena-entity`, for the map-specific representation.

```json
{
  "name": "debug-aircraft-01",
  "rate": 0.0333333333,
  "sensor-data-provided": ["position", "heading"],
  "stamp": 1763241600.125,
  "type": "SensorInfo",
  "arena-entity": {
    "id": "debug-aircraft-01",
    "displayName": "Debug MQTT Aircraft",
    "domain": "air",
    "assetType": "vehicle",
    "systemType": "training-aircraft",
    "latitude": 29.1886,
    "longitude": -81.0487,
    "altitudeMeters": 350,
    "headingDegrees": 90,
    "sidc": "130301000011010000000000000000",
    "affiliation": "friend",
    "renderMode": "mil-symbol",
    "symbology": { "uniqueDesignation": "DEBUG 01" }
  }
}
```

Required WARA-PS fields are `name`, `rate`, `sensor-data-provided`, `stamp`, and `type: "SensorInfo"`. The Arena requires the extension's `latitude` and `longitude` before it can draw an entity. `arena-entity` deliberately contains the larger map payload so this information is not repeated in each heartbeat.

`arena-entity.sidc` selects the MIL-STD symbol drawn on the map. It must describe the entity itself (for example, use a ground-vehicle SIDC for a ground vehicle); `domain` controls grouping and does not override an explicitly supplied SIDC.

## 2. Liveness packet: `heartbeat`

Publish this lightweight, non-retained packet at the liveness rate (the demo uses one per second, QoS 0). It never carries coordinates, symbology, or the other map fields. The Arena uses it only to refresh the known entity's last-seen time.

```json
{
  "agent-type": "air",
  "agent-uuid": "b992552b-90b0-4911-8707-d6f808362bd2",
  "levels": ["sensor"],
  "name": "debug-aircraft-01",
  "rate": 1.0,
  "stamp": 1763241601.125,
  "type": "HeartBeat"
}
```

Required WARA-PS fields are `agent-type`, `agent-uuid`, `levels`, `name`, `rate`, `stamp`, and `type: "HeartBeat"`. `levels` includes `sensor` because the unit publishes `sensor_info`.

## Receiver rules

1. Subscribe to `{prefix}/#` (the default UI subscription is `syscraft/arena/#`).
2. Accept only JSON packets whose final topic segment is `sensor_info` or `heartbeat`.
3. Create or replace map state only from `SensorInfo` packets containing `arena-entity` and a valid latitude/longitude.
4. Refresh liveness only when a `HeartBeat` packet's `name` matches an existing entity ID.
5. Ignore other endpoints and malformed payloads.

The retained snapshot lets a newly connected UI render known entities without waiting for the next snapshot. A heartbeat cannot create an entity, by design.

## Publisher examples

```bash
export SYSCRAFT_MQTT_PASSWORD="your-password"
python3 scripts/mqtt_single_entity_heartbeat.py
python3 scripts/mqtt_entity_loop.py --sensor-info-interval 30 --interval 1
```

The scripts are reference publishers for this contract. They publish a snapshot immediately, then at `--sensor-info-interval`; they publish a heartbeat at `--interval`.

## Change checklist

When changing this protocol, update this tutorial, the parser, and both reference publishers in the same change. Do not add fields to the heartbeat merely for UI convenience; add infrequently changing map data to the snapshot extension instead. If location needs sub-second fidelity, introduce the WARA-PS `sensor/position` endpoint rather than making heartbeats large.

WARA-PS references: [sensor_info](https://api-docs.waraps.org/#/agent_communication/topics/sensor_info) and [heartbeat](https://api-docs.waraps.org/#/agent_communication/topics/heartbeat).
