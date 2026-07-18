# move-path
**Description:** This node moves the agent along a path. It is allowed to prepare for moving inside the node, for example doing take-off before flying. Also the specified altitudes is the minimal altitude, the flying should find positions higher if the position is occupied with obstacles.

**Tags:** vehicle

**Task Parameters:**<br>
• **waypoints (geopoints):** The positions to move to<br>
• **speed (string):** Qualitative speed level. Possible values are "fast", "standard" and "slow", and the meaning of these parameters is platform-dependent.

<!-- tabs:start -->
## **JSON example**
```json
{
    "com-uuid": "0bac359a-7b77-467b-95f9-bbaed320aadd",
    "command": "start-task",
    "execution-unit": "dji0",
    "sender": "commander",
    "task": {
        "name": "move-path",
        "params": {
            "speed": "standard",
            "waypoints": [
                {
                    "altitude": 40.0,
                    "latitude": 57.7611363,
                    "longitude": 16.6805011,
                    "rostype": "GeoPoint"
                },
                {
                    "altitude": 40.0,
                    "latitude": 57.7615541,
                    "longitude": 16.6798574,
                    "rostype": "GeoPoint"
                },
                {
                    "altitude": 40.0,
                    "latitude": 57.7615255,
                    "longitude": 16.6784841,
                    "rostype": "GeoPoint"
                },
                {
                    "altitude": 40.0,
                    "latitude": 57.7609703,
                    "longitude": 16.6780335,
                    "rostype": "GeoPoint"
                },
                {
                    "altitude": 40.0,
                    "latitude": 57.760398,
                    "longitude": 16.6787201,
                    "rostype": "GeoPoint"
                },
                {
                    "altitude": 40.0,
                    "latitude": 57.7604781,
                    "longitude": 16.6799003,
                    "rostype": "GeoPoint"
                }
            ]
        }
    },
    "task-uuid": "15c42e27-6c43-4291-bf10-d55334148e35"
}
```

## **ROS example**

<!-- tabs:end -->