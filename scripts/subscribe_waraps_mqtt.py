#!/usr/bin/env python3
"""Print MQTT messages received under the SysCraft Arena WARA-PS topic tree."""

from __future__ import annotations

import argparse
import json
import os
import signal
import sys
import threading
import uuid

try:
    import paho.mqtt.client as mqtt
except ModuleNotFoundError:
    mqtt = None


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Subscribe to and print SysCraft Arena MQTT packets.")
    parser.add_argument("--host", default=os.getenv("SYSCRAFT_MQTT_HOST", "mqtt.conceptio.cloud"))
    parser.add_argument("--port", type=int, default=int(os.getenv("SYSCRAFT_MQTT_PORT", "1883")))
    parser.add_argument("--username", default=os.getenv("SYSCRAFT_MQTT_USERNAME", "chris"))
    parser.add_argument("--password", default=os.getenv("SYSCRAFT_MQTT_PASSWORD", ""))
    parser.add_argument("--client-id", default=f"syscraft-mqtt-observer-{uuid.uuid4().hex[:8]}")
    parser.add_argument("--root-topic", default=os.getenv("SYSCRAFT_MQTT_ROOT_TOPIC", "syscraft/arena"))
    parser.add_argument("--count", type=int, default=0, help="Stop after this many messages (0 means continue).")
    return parser.parse_args()


def pretty_payload(payload: bytes) -> str:
    text = payload.decode("utf-8", errors="replace")
    try:
        return json.dumps(json.loads(text), indent=2, sort_keys=True)
    except json.JSONDecodeError:
        return text


def main() -> int:
    args = parse_args()
    if args.count < 0:
        print("--count cannot be negative.", file=sys.stderr)
        return 2
    if mqtt is None:
        print("Missing dependency: paho-mqtt. Run: python3 -m pip install -r scripts/requirements.txt", file=sys.stderr)
        return 2
    if not args.password:
        print("Set SYSCRAFT_MQTT_PASSWORD or pass --password.", file=sys.stderr)
        return 2

    subscription = f"{args.root_topic.strip('/')}/#"
    stop_requested = threading.Event()
    connected = threading.Event()
    messages_received = 0

    client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, client_id=args.client_id, protocol=mqtt.MQTTv5)
    client.username_pw_set(args.username, args.password)

    def on_connect(
        mqtt_client: mqtt.Client,
        _userdata: object,
        _flags: mqtt.ConnectFlags,
        reason_code: mqtt.ReasonCode,
        _properties: mqtt.Properties | None,
    ) -> None:
        if reason_code.is_failure:
            print(f"Broker rejected connection: {reason_code}", file=sys.stderr)
            stop_requested.set()
            return
        print(f"Connected to {args.host}:{args.port} as {args.client_id}")
        result, _message_id = mqtt_client.subscribe(subscription, qos=1)
        if result != mqtt.MQTT_ERR_SUCCESS:
            print(f"Subscription request failed: rc={result}", file=sys.stderr)
            stop_requested.set()
            return
        connected.set()

    def on_subscribe(
        _client: mqtt.Client,
        _userdata: object,
        _message_id: int,
        reason_code_list: list[mqtt.ReasonCode],
        _properties: mqtt.Properties | None,
    ) -> None:
        if any(reason_code.value >= 128 for reason_code in reason_code_list):
            print(f"Broker denied subscription to {subscription}: {reason_code_list}", file=sys.stderr)
            stop_requested.set()
            return
        print(f"Subscribed: {subscription}")

    def on_message(_client: mqtt.Client, _userdata: object, message: mqtt.MQTTMessage) -> None:
        nonlocal messages_received
        messages_received += 1
        print(f"\n--- message {messages_received} ---\ntopic: {message.topic}\npayload:\n{pretty_payload(message.payload)}")
        if args.count and messages_received >= args.count:
            stop_requested.set()

    def on_disconnect(
        _client: mqtt.Client,
        _userdata: object,
        _disconnect_flags: mqtt.DisconnectFlags,
        reason_code: mqtt.ReasonCode,
        _properties: mqtt.Properties | None,
    ) -> None:
        if not stop_requested.is_set():
            print(f"Disconnected unexpectedly: {reason_code}", file=sys.stderr)

    client.on_connect = on_connect
    client.on_subscribe = on_subscribe
    client.on_message = on_message
    client.on_disconnect = on_disconnect

    def request_stop(_signum: int, _frame: object) -> None:
        stop_requested.set()

    signal.signal(signal.SIGINT, request_stop)
    signal.signal(signal.SIGTERM, request_stop)

    try:
        client.connect(args.host, args.port, 60)
        client.loop_start()
        if not connected.wait(timeout=10):
            print("No successful broker connection within 10 seconds.", file=sys.stderr)
            return 1
        while not stop_requested.wait(0.2):
            pass
    finally:
        client.loop_stop()
        client.disconnect()

    print(f"Stopped. Received {messages_received} message(s).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
