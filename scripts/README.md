# SysCraft MQTT Tools

## Demo Entity Loop

Publish moving demo entities into the Arena topic structure:

```bash
python3 -m pip install -r scripts/requirements.txt
export SYSCRAFT_MQTT_PASSWORD="your-password"
python3 scripts/mqtt_entity_loop.py
```

Defaults:

```text
host: mqtt.conceptio.cloud
port: 1883
username: chris
client-id: chris
root-topic: syscraft/arena
subscription in UI: syscraft/arena/#
```

Topic structure:

```text
syscraft/arena/unit/{agentType}/simulation/{unit}/{sensor_info|heartbeat}
```

The retained `sensor_info` packet is sent at startup and every 30 seconds; compact `heartbeat` packets are sent every second. The full contract is in [the MQTT message-format tutorial](../docs/mqtt-message-format.md).

Arena domains currently emitted:

```text
surface, ground, air, space, cyber, social
```

## Single Entity Debug Heartbeat

For a smaller debug loop, publish only one entity:

```bash
export SYSCRAFT_MQTT_PASSWORD="your-password"
python3 scripts/mqtt_single_entity_heartbeat.py
```

Or open this WARA-PS packet-test notebook in JupyterLab:

```text
notebooks/syscraft_single_entity_heartbeat.ipynb
```

The single debug topics are:

```text
syscraft/arena/unit/air/simulation/debug-aircraft-01/sensor_info
syscraft/arena/unit/air/simulation/debug-aircraft-01/heartbeat
```

## Packet Contract Smoke Test

This publisher sends one retained `SensorInfo` snapshot followed by three
compact `HeartBeat` messages. First inspect the exact packets without using a
broker:

```bash
python3 scripts/test_waraps_mqtt_packets.py --dry-run
```

Then publish them to the configured broker:

```bash
export SYSCRAFT_MQTT_PASSWORD="your-password"
python3 scripts/test_waraps_mqtt_packets.py
```

## Observe Received Packets

Run this in a separate terminal or Jupyter terminal to prove which packets the
broker delivers under the Arena topic tree:

```bash
export SYSCRAFT_MQTT_PASSWORD="your-password"
python3 scripts/subscribe_waraps_mqtt.py
```

It subscribes to `syscraft/arena/#` and prints every topic and JSON payload.
Use `--count 2` to exit after two received packets.
