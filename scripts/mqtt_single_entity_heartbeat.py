#!/usr/bin/env python3
"""Publish a WARA-PS sensor_info snapshot and compact heartbeats for one entity.

Topics:
  {root}/unit/{agent-type}/simulation/{unit}/sensor_info
  {root}/unit/{agent-type}/simulation/{unit}/heartbeat
"""

from __future__ import annotations

import argparse
import json
import os
import signal
import sys
import time
import uuid
from typing import Any

try:
    import paho.mqtt.client as mqtt
except ModuleNotFoundError:
    mqtt = None


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Publish one WARA-PS entity snapshot and heartbeat.")
    parser.add_argument("--host", default=os.getenv("SYSCRAFT_MQTT_HOST", "mqtt.conceptio.cloud"))
    parser.add_argument("--port", type=int, default=int(os.getenv("SYSCRAFT_MQTT_PORT", "1883")))
    parser.add_argument("--username", default=os.getenv("SYSCRAFT_MQTT_USERNAME", "chris"))
    parser.add_argument("--password", default=os.getenv("SYSCRAFT_MQTT_PASSWORD", ""))
    parser.add_argument("--client-id", default=os.getenv("SYSCRAFT_MQTT_CLIENT_ID", "chris"))
    parser.add_argument("--root-topic", default=os.getenv("SYSCRAFT_MQTT_ROOT_TOPIC", "syscraft/arena"))
    parser.add_argument("--interval", type=float, default=float(os.getenv("SYSCRAFT_MQTT_INTERVAL", "1.0")))
    parser.add_argument("--sensor-info-interval", type=float, default=float(os.getenv("SYSCRAFT_SENSOR_INFO_INTERVAL", "30")))
    parser.add_argument("--iterations", type=int, default=int(os.getenv("SYSCRAFT_MQTT_ITERATIONS", "0")))
    parser.add_argument("--entity-id", default=os.getenv("SYSCRAFT_ENTITY_ID", "debug-aircraft-01"))
    parser.add_argument("--agent-type", default=os.getenv("SYSCRAFT_AGENT_TYPE", "air"), choices=("air", "ground", "surface", "subsurface"))
    parser.add_argument("--latitude", type=float, default=float(os.getenv("SYSCRAFT_ENTITY_LATITUDE", "29.1886")))
    parser.add_argument("--longitude", type=float, default=float(os.getenv("SYSCRAFT_ENTITY_LONGITUDE", "-81.0487")))
    parser.add_argument("--altitude", type=float, default=float(os.getenv("SYSCRAFT_ENTITY_ALTITUDE", "350")))
    parser.add_argument("--retain", action="store_true", default=os.getenv("SYSCRAFT_MQTT_RETAIN", "true").lower() == "true")
    return parser.parse_args()


def topic_for(root_topic: str, agent_type: str, unit: str, message_type: str) -> str:
    return f"{root_topic.strip('/')}/unit/{agent_type}/simulation/{unit}/{message_type}"


def sensor_info_for(args: argparse.Namespace) -> dict[str, Any]:
    return {
        "name": args.entity_id,
        "rate": 1 / args.sensor_info_interval,
        "sensor-data-provided": ["position", "heading"],
        "stamp": time.time(),
        "type": "SensorInfo",
        "arena-entity": {
            "id": args.entity_id,
            "displayName": "Debug MQTT Aircraft",
            "domain": args.agent_type,
            "assetType": "vehicle",
            "systemType": "debug-aircraft",
            "latitude": args.latitude,
            "longitude": args.longitude,
            "altitudeMeters": args.altitude,
            "headingDegrees": 90,
            "sidc": "130301000011010000000000000000",
            "affiliation": "friend",
            "renderMode": "mil-symbol",
            "symbology": {"uniqueDesignation": "DEBUG 01", "type": "MQTT"},
        },
    }


def heartbeat_for(args: argparse.Namespace, agent_uuid: str) -> dict[str, Any]:
    return {
        "agent-type": args.agent_type,
        "agent-uuid": agent_uuid,
        "levels": ["sensor"],
        "name": args.entity_id,
        "rate": 1 / args.interval,
        "stamp": time.time(),
        "type": "HeartBeat",
    }


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

    client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, client_id=args.client_id, protocol=mqtt.MQTTv5)
    client.username_pw_set(args.username, args.password)
    client.connect(args.host, args.port, 60)
    client.loop_start()

    sensor_info_topic = topic_for(args.root_topic, args.agent_type, args.entity_id, "sensor_info")
    heartbeat_topic = topic_for(args.root_topic, args.agent_type, args.entity_id, "heartbeat")
    agent_uuid = str(uuid.uuid4())
    last_snapshot_at = 0.0
    tick = 0
    print(f"Publishing sensor_info={sensor_info_topic} and heartbeat={heartbeat_topic}")
    try:
        while not stop_requested:
            tick += 1
            now = time.monotonic()
            if now - last_snapshot_at >= args.sensor_info_interval:
                client.publish(sensor_info_topic, json.dumps(sensor_info_for(args), separators=(",", ":")), qos=1, retain=args.retain)
                last_snapshot_at = now
            client.publish(heartbeat_topic, json.dumps(heartbeat_for(args, agent_uuid), separators=(",", ":")), qos=0, retain=False)
            if args.iterations > 0 and tick >= args.iterations:
                break
            time.sleep(args.interval)
    finally:
        client.loop_stop()
        client.disconnect()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
