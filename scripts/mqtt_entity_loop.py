#!/usr/bin/env python3
"""Publish WARA-PS entity snapshots and compact heartbeats to MQTT."""

from __future__ import annotations

import argparse
import json
import math
import os
import signal
import sys
import time
import uuid
from dataclasses import dataclass
from typing import Any

try:
    import paho.mqtt.client as mqtt
except ModuleNotFoundError:
    mqtt = None


DOMAINS = ("surface", "ground", "air", "space", "cyber", "social")
WARA_AGENT_TYPES = {
    "surface": "surface",
    "ground": "ground",
    "air": "air",
    # WARA-PS only defines air, ground, surface, and subsurface agent types.
    "space": "air",
    "cyber": "ground",
    "social": "ground",
}


@dataclass(frozen=True)
class EntitySeed:
    entity_id: str
    name: str
    domain: str
    asset_type: str
    system_type: str
    latitude: float
    longitude: float
    altitude_meters: float
    heading_degrees: float
    sidc: str
    affiliation: str
    orbit_radius_m: float
    orbit_speed: float
    symbology: dict[str, Any]


ENTITY_SEEDS = (
    EntitySeed(
        entity_id="erau-surface-01",
        name="Halifax Surface Track",
        domain="surface",
        asset_type="vehicle",
        system_type="surface-contact",
        latitude=29.2054,
        longitude=-81.0192,
        altitude_meters=0,
        heading_degrees=205,
        sidc="130301000012010000000000000000",
        affiliation="neutral",
        orbit_radius_m=90,
        orbit_speed=0.55,
        symbology={
            "uniqueDesignation": "SURF 01",
            "type": "SURFACE",
            "additionalInformation": "HALIFAX",
        },
    ),
    EntitySeed(
        entity_id="erau-ground-01",
        name="Simulation Center",
        domain="ground",
        asset_type="infra",
        system_type="simulation-facility",
        latitude=29.1892,
        longitude=-81.0473,
        altitude_meters=9,
        heading_degrees=0,
        sidc="130310001412110000000000000000",
        affiliation="friend",
        orbit_radius_m=18,
        orbit_speed=0.24,
        symbology={
            "uniqueDesignation": "SIM CENTER",
            "type": "SIMULATION",
            "staffComments": "MODEL FEDERATION",
            "additionalInformation": "MQTT LIVE",
        },
    ),
    EntitySeed(
        entity_id="erau-air-01",
        name="Training Aircraft",
        domain="air",
        asset_type="vehicle",
        system_type="training-aircraft",
        latitude=29.1869,
        longitude=-81.0588,
        altitude_meters=420,
        heading_degrees=84,
        sidc="130301000011010000000000000000",
        affiliation="friend",
        orbit_radius_m=420,
        orbit_speed=1.35,
        symbology={
            "uniqueDesignation": "ERAU AIR 01",
            "type": "TRAINING AIRCRAFT",
            "staffComments": "PATTERN",
        },
    ),
    EntitySeed(
        entity_id="erau-space-01",
        name="LEO Pass",
        domain="space",
        asset_type="vehicle",
        system_type="satellite-pass",
        latitude=29.1968,
        longitude=-81.0364,
        altitude_meters=520000,
        heading_degrees=62,
        sidc="130301000011010000000000000000",
        affiliation="friend",
        orbit_radius_m=760,
        orbit_speed=0.42,
        symbology={
            "uniqueDesignation": "SAT 01",
            "type": "SPACE",
            "additionalInformation": "LEO TRACK",
        },
    ),
    EntitySeed(
        entity_id="erau-cyber-01",
        name="Cyber Range",
        domain="cyber",
        asset_type="infra",
        system_type="cyber-node",
        latitude=29.1875,
        longitude=-81.0451,
        altitude_meters=8,
        heading_degrees=0,
        sidc="130310001412110000000000000000",
        affiliation="unknown",
        orbit_radius_m=12,
        orbit_speed=0.18,
        symbology={
            "uniqueDesignation": "CYBER 01",
            "type": "CYBER",
            "staffComments": "TOPIC FILTER",
        },
    ),
    EntitySeed(
        entity_id="erau-social-01",
        name="Ops Team",
        domain="social",
        asset_type="people",
        system_type="operator-team",
        latitude=29.1889,
        longitude=-81.0493,
        altitude_meters=7,
        heading_degrees=270,
        sidc="130310001412110000000000000000",
        affiliation="friend",
        orbit_radius_m=8,
        orbit_speed=0.12,
        symbology={
            "uniqueDesignation": "OPS TEAM",
            "type": "SOCIAL",
            "additionalInformation": "HUMAN CELL",
        },
    ),
)


def meters_to_latitude_degrees(meters: float) -> float:
    return meters / 111_320


def meters_to_longitude_degrees(meters: float, latitude: float) -> float:
    return meters / (111_320 * max(math.cos(math.radians(latitude)), 0.01))


def topic_for(root_topic: str, entity: EntitySeed, message_type: str) -> str:
    root = root_topic.strip("/")
    return f"{root}/unit/{WARA_AGENT_TYPES[entity.domain]}/simulation/{entity.entity_id}/{message_type}"


def sensor_info_for(entity: EntitySeed, snapshot_rate: float, started_at: float) -> dict[str, Any]:
    elapsed = time.time() - started_at
    angle = entity.orbit_speed * elapsed
    north_m = math.sin(angle) * entity.orbit_radius_m
    east_m = math.cos(angle) * entity.orbit_radius_m
    latitude = entity.latitude + meters_to_latitude_degrees(north_m)
    longitude = entity.longitude + meters_to_longitude_degrees(east_m, entity.latitude)
    heading = (math.degrees(angle) + entity.heading_degrees + 90) % 360
    altitude_wave = 0

    if entity.domain == "air":
        altitude_wave = math.sin(angle * 0.7) * 45
    elif entity.domain == "space":
        altitude_wave = math.sin(angle * 0.3) * 1200

    return {
        "name": entity.entity_id,
        "rate": snapshot_rate,
        "sensor-data-provided": ["position", "heading"],
        "stamp": time.time(),
        "type": "SensorInfo",
        # SysCraft extension: the full map representation accompanies the
        # WARA-PS SensorInfo envelope and is only sent at the snapshot rate.
        "arena-entity": {
            "id": entity.entity_id,
            "displayName": entity.name,
            "domain": entity.domain,
            "assetType": entity.asset_type,
            "systemType": entity.system_type,
            "latitude": round(latitude, 7),
            "longitude": round(longitude, 7),
            "altitudeMeters": round(entity.altitude_meters + altitude_wave, 2),
            "headingDegrees": round(heading, 2),
            "sidc": entity.sidc,
            "symbology": {
                **entity.symbology,
                "direction": round(heading),
                "dtg": time.strftime("%d%H%MZ%b%y", time.gmtime()).upper(),
            },
            "affiliation": entity.affiliation,
            "visible": True,
            "renderMode": "mil-symbol",
        },
    }


def heartbeat_for(entity: EntitySeed, agent_uuid: str, rate: float) -> dict[str, Any]:
    return {
        "agent-type": WARA_AGENT_TYPES[entity.domain],
        "agent-uuid": agent_uuid,
        "levels": ["sensor"],
        "name": entity.entity_id,
        "rate": rate,
        "stamp": time.time(),
        "type": "HeartBeat",
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Loop SysCraft Arena MQTT demo entities.")
    parser.add_argument("--host", default=os.getenv("SYSCRAFT_MQTT_HOST", "mqtt.conceptio.cloud"))
    parser.add_argument("--port", type=int, default=int(os.getenv("SYSCRAFT_MQTT_PORT", "1883")))
    parser.add_argument("--username", default=os.getenv("SYSCRAFT_MQTT_USERNAME", "chris"))
    parser.add_argument("--password", default=os.getenv("SYSCRAFT_MQTT_PASSWORD", ""))
    parser.add_argument("--client-id", default=os.getenv("SYSCRAFT_MQTT_CLIENT_ID", "chris"))
    parser.add_argument("--root-topic", default=os.getenv("SYSCRAFT_MQTT_ROOT_TOPIC", "syscraft/arena"))
    parser.add_argument("--interval", type=float, default=float(os.getenv("SYSCRAFT_MQTT_INTERVAL", "1.0")))
    parser.add_argument("--sensor-info-interval", type=float, default=float(os.getenv("SYSCRAFT_SENSOR_INFO_INTERVAL", "30")))
    parser.add_argument("--iterations", type=int, default=int(os.getenv("SYSCRAFT_MQTT_ITERATIONS", "0")))
    parser.add_argument("--qos", type=int, choices=(0, 1, 2), default=int(os.getenv("SYSCRAFT_MQTT_QOS", "0")))
    parser.add_argument("--retain", action="store_true", default=os.getenv("SYSCRAFT_MQTT_RETAIN", "true").lower() == "true")
    return parser.parse_args()


def main() -> int:
    args = parse_args()

    if args.interval <= 0 or args.sensor_info_interval <= 0:
        print("--interval and --sensor-info-interval must be greater than zero.", file=sys.stderr)
        return 2

    if mqtt is None:
        print("Missing dependency: paho-mqtt. Run: python3 -m pip install -r scripts/requirements.txt", file=sys.stderr)
        return 2

    if not args.password:
        print("Set SYSCRAFT_MQTT_PASSWORD or pass --password.", file=sys.stderr)
        return 2

    stop_requested = False

    def request_stop(_signum: int, _frame: object) -> None:
        nonlocal stop_requested
        stop_requested = True

    signal.signal(signal.SIGINT, request_stop)
    signal.signal(signal.SIGTERM, request_stop)

    client = mqtt.Client(
        mqtt.CallbackAPIVersion.VERSION2,
        client_id=args.client_id,
        protocol=mqtt.MQTTv5,
    )
    client.username_pw_set(args.username, args.password)

    def on_connect(
        _client: mqtt.Client,
        _userdata: object,
        _flags: mqtt.ConnectFlags,
        reason_code: mqtt.ReasonCode,
        _properties: mqtt.Properties | None,
    ) -> None:
        print(f"Connected to {args.host}:{args.port} as client_id={args.client_id} reason={reason_code}")

    def on_disconnect(
        _client: mqtt.Client,
        _userdata: object,
        _flags: mqtt.DisconnectFlags,
        reason_code: mqtt.ReasonCode,
        _properties: mqtt.Properties | None,
    ) -> None:
        if not stop_requested:
            print(f"Disconnected unexpectedly: {reason_code}", file=sys.stderr)

    client.on_connect = on_connect
    client.on_disconnect = on_disconnect

    client.connect(args.host, args.port, 60)
    client.loop_start()

    started_at = time.time()
    tick = 0
    last_snapshot_at = 0.0
    agent_uuids = {entity.entity_id: str(uuid.uuid4()) for entity in ENTITY_SEEDS}

    print(f"Publishing {len(ENTITY_SEEDS)} entities under {args.root_topic}/...")
    if args.iterations > 0:
        print(f"Publishing for {args.iterations} iterations.")
    else:
        print("Press Ctrl+C to stop.")

    try:
        while not stop_requested:
            tick += 1
            now = time.monotonic()
            for entity in ENTITY_SEEDS:
                heartbeat_topic = topic_for(args.root_topic, entity, "heartbeat")
                client.publish(heartbeat_topic, json.dumps(heartbeat_for(entity, agent_uuids[entity.entity_id], 1 / args.interval), separators=(",", ":")), qos=0, retain=False)
                if now - last_snapshot_at >= args.sensor_info_interval:
                    sensor_info_topic = topic_for(args.root_topic, entity, "sensor_info")
                    client.publish(sensor_info_topic, json.dumps(sensor_info_for(entity, 1 / args.sensor_info_interval, started_at), separators=(",", ":")), qos=args.qos, retain=args.retain)

            if now - last_snapshot_at >= args.sensor_info_interval:
                last_snapshot_at = now

            if tick == 1 or tick % 10 == 0:
                domains = ", ".join(DOMAINS)
                print(f"tick={tick} published={len(ENTITY_SEEDS)} domains=[{domains}]")

            if args.iterations > 0 and tick >= args.iterations:
                break

            time.sleep(args.interval)
    finally:
        client.loop_stop()
        client.disconnect()
        print("Stopped publisher.")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
