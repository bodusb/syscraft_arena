#!/usr/bin/env python3
"""Smoke-test the Arena MQTT contract by publishing both WARA-PS packet types.

The script publishes one retained SensorInfo snapshot, then compact HeartBeat
messages. Use --dry-run to print the exact topics and JSON without a broker.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
import uuid
from typing import Any

try:
    import paho.mqtt.client as mqtt
except ModuleNotFoundError:
    mqtt = None


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Publish WARA-PS SensorInfo and HeartBeat test packets.")
    parser.add_argument("--host", default=os.getenv("SYSCRAFT_MQTT_HOST", "mqtt.conceptio.cloud"))
    parser.add_argument("--port", type=int, default=int(os.getenv("SYSCRAFT_MQTT_PORT", "1883")))
    parser.add_argument("--username", default=os.getenv("SYSCRAFT_MQTT_USERNAME", "chris"))
    parser.add_argument("--password", default=os.getenv("SYSCRAFT_MQTT_PASSWORD", ""))
    parser.add_argument("--client-id", default=f"syscraft-mqtt-test-{uuid.uuid4().hex[:8]}")
    parser.add_argument("--root-topic", default=os.getenv("SYSCRAFT_MQTT_ROOT_TOPIC", "syscraft/arena"))
    parser.add_argument("--agent-type", choices=("air", "ground", "surface", "subsurface"), default="air")
    parser.add_argument("--unit", default="mqtt-contract-test-01")
    parser.add_argument("--heartbeats", type=int, default=3, help="Number of compact heartbeat packets to send.")
    parser.add_argument("--interval", type=float, default=1.0, help="Seconds between heartbeat packets.")
    parser.add_argument("--dry-run", action="store_true", help="Print packets without connecting or publishing.")
    return parser.parse_args()


def topic(root: str, agent_type: str, unit: str, endpoint: str) -> str:
    return f"{root.strip('/')}/unit/{agent_type}/simulation/{unit}/{endpoint}"


def sensor_info(unit: str, agent_type: str) -> dict[str, Any]:
    sidc_by_agent_type = {
        "air": "130301000011010000000000000000",
        "ground": "130315000016040000000000000000",
        "surface": "130330000012050100000000000000",
        "subsurface": "130303000011010000000000000000",
    }
    return {
        "name": unit,
        "rate": 1 / 30,
        "sensor-data-provided": ["position", "heading"],
        "stamp": time.time(),
        "type": "SensorInfo",
        "arena-entity": {
            "id": unit,
            "displayName": "MQTT Contract Test",
            "domain": agent_type,
            "assetType": "vehicle",
            "systemType": "mqtt-contract-test",
            "latitude": 29.1886,
            "longitude": -81.0487,
            "altitudeMeters": 350,
            "headingDegrees": 90,
            "sidc": sidc_by_agent_type[agent_type],
            "affiliation": "friend",
            "renderMode": "mil-symbol",
            "symbology": {"uniqueDesignation": "MQTT TEST"},
        },
    }


def heartbeat(unit: str, agent_type: str, agent_uuid: str, rate: float) -> dict[str, Any]:
    return {
        "agent-type": agent_type,
        "agent-uuid": agent_uuid,
        "levels": ["sensor"],
        "name": unit,
        "rate": rate,
        "stamp": time.time(),
        "type": "HeartBeat",
    }


def encoded(packet: dict[str, Any]) -> str:
    return json.dumps(packet, separators=(",", ":"))


def main() -> int:
    args = parse_args()
    if args.heartbeats < 1 or args.interval <= 0:
        print("--heartbeats must be at least 1 and --interval must be greater than zero.", file=sys.stderr)
        return 2

    sensor_info_topic = topic(args.root_topic, args.agent_type, args.unit, "sensor_info")
    heartbeat_topic = topic(args.root_topic, args.agent_type, args.unit, "heartbeat")
    agent_uuid = str(uuid.uuid4())
    snapshot = sensor_info(args.unit, args.agent_type)

    if args.dry_run:
        print(f"sensor_info topic: {sensor_info_topic}\n{encoded(snapshot)}")
        print(f"heartbeat topic: {heartbeat_topic}\n{encoded(heartbeat(args.unit, args.agent_type, agent_uuid, 1 / args.interval))}")
        return 0

    if mqtt is None:
        print("Missing dependency: paho-mqtt. Run: python3 -m pip install -r scripts/requirements.txt", file=sys.stderr)
        return 2
    if not args.password:
        print("Set SYSCRAFT_MQTT_PASSWORD or pass --password.", file=sys.stderr)
        return 2

    client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, client_id=args.client_id, protocol=mqtt.MQTTv5)
    client.username_pw_set(args.username, args.password)
    client.connect(args.host, args.port, 60)
    client.loop_start()
    try:
        result = client.publish(sensor_info_topic, encoded(snapshot), qos=1, retain=True)
        result.wait_for_publish()
        print(f"published retained SensorInfo: {sensor_info_topic}")

        for index in range(1, args.heartbeats + 1):
            result = client.publish(heartbeat_topic, encoded(heartbeat(args.unit, args.agent_type, agent_uuid, 1 / args.interval)), qos=0, retain=False)
            result.wait_for_publish()
            print(f"published HeartBeat {index}/{args.heartbeats}: {heartbeat_topic}")
            if index < args.heartbeats:
                time.sleep(args.interval)
    finally:
        client.loop_stop()
        client.disconnect()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
