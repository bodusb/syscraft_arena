# move-to
**Description:** This node moves the agent to a specific position. It is allowed to prepare for moving inside the node, for example doing take-off before flying. Also the specified altitude is the minimal altitude, the flying should find positions higher if the position is occupied with obstacles.

**Tags:** vehicle

**Task Parameters:**<br>
• **waypoint (geopoint):** The position to move to<br>
• **speed (string):** Qualitative speed level. Possible values are "fast", "standard" and "slow", and the meaning of these parameters is platform-dependent.

<!-- tabs:start -->
## **JSON example**
```json
{
    "com-uuid": "193f5b87-2c88-495e-941e-80182be4451b",
    "command": "start-task",
    "execution-unit": "dji0",
    "sender": "commander",
    "task": {
        "name": "move-to",
        "params": {
            "speed": "standard",
            "waypoint": {
                "altitude": 40.0,
                "latitude": 57.7611363,
                "longitude": 16.6805011,
                "rostype": "GeoPoint"
            }
        }
    },
    "task-uuid": "27ce3be0-972c-4130-b252-4e3f74832497"
}
```

## **ROS example**

<!-- tabs:end -->