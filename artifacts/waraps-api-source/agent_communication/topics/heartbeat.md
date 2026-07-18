# Heartbeat
The "heartbeat" message is the most fundamental message an agent should publish in order to be a part of the Core System. This as it is used to indicate the existance of an agent.<br>

Publish the heartbeat message to:<br>
**TOPIC: .../UNIT/heartbeat**

One of the parameters the heartbeat should contain is a list of the agents info topics, meaning the levels it is registered on. <br>
E.g. A level 2 agent should in this list state both "sensor", as well as "direct_execution" to display how it publishes to the corresponding info subtopics.

**Message parameters:**<br>
• **agent-type:** The domain the agent (primarily) belongs to (which also is a part of the topic pathway). Possible values are: "air", "ground", "surface", and "subsurface".<br>
• **agent-uuid:** Unique id for the agent (uuid v4), should change when rebooting and losing state information.<br>
• **levels:** A list of levels to register on. Possible values are: "sensor", "direct execution", "tst execution" and "delegation". This means the agent is intended to work on these levels but the info messages then indicate if it is available on that level. For example when a boat is out of communication range it will not send info messages on sensor and direct execution level.<br>
• **name:** The name of the agent (which also is a part of the topic pathway)<br>
• **rate:** The expected rate the message is sent, written in Hz<br>
• **stamp:** Epoch time stamp of when the message was sent, in double (time.time() in Python, seconds in double)<br>
• **type:** A type field indicates what type of message it is. In this case heartbeat.<br>

**Example**
```json
{
    "agent-type": "surface",
    "agent-uuid": "b992552b-90b0-4911-8707-d6f808362bd2",
    "levels": [
        "sensor",
        "direct execution"
    ],
    "name": "piraya0",
    "rate": 1.0,
    "stamp": 1614080475.1084013,
    "type": "HeartBeat"
}
```