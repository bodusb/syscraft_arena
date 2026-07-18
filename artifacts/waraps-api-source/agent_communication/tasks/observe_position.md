# observe-position
**Description:** The agent will try to observe a given position. It will observe it until it gets an **$enough signal**.

**Tags:** None

**Task Parameters:**<br>
• **geopoint (geopoint):** The position to observe.<br>
• **speed (string):** Qualitative speed level. Possible values are "fast", "standard" and "slow", and the meaning of these parameters is platform-dependent.<br>
• **distance (float64):** If given or if greater than 0.0 then use this radius for circling the observation position for vehicles that needs to move while observing the position. For vehicles that can hover uses this is the distance from which to observe.<br>
• **height (float64):** If vehicles can hover this is the wanted height above the position to observe.<br>
• **duration (int32):** Time to observe the position in seconds. If negative never stop and an $enough signal have to be sent to finish the TST execution.

<!-- tabs:start -->
## **JSON example**
```json
{
    "com-uuid": "e74ea2f3-db13-442d-a2ee-11c5baba0145",
    "command": "start-task",
    "execution-unit": "dji0",
    "sender": "commander",
    "task": {
        "name": "observe-position",
        "params": {
            "distance": 10.0,
            "duration": 20,
            "geopoint": [
                {
                    "altitude": 40.0,
                    "latitude": 57.7611363,
                    "longitude": 16.6805011,
                    "rostype": "GeoPoint"
                }
            ],
            "height": -1.0,
            "speed": [
                
            ]
        }
    },
    "task-uuid": "46eab756-e0e7-47e3-948b-ad78c795295c"
}
```

## **ROS example**

<!-- tabs:end -->