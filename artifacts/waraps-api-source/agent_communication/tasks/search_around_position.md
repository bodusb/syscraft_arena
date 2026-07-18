# search-around-position
**Description:** This node specifies a search of an area given by a list of geopoints. It is allowed to prepare for moving inside the node, for example doing take-off before flying.

**Tags:** vehicle

**Task Parameters:**<br>
• **geopoint (geopoint):** The area to search.<br>
• **radius (float64):** The radius around the geopoint to focus on.
• **speed (string):** Qualitative speed level. Possible values are "fast", "standard" and "slow", and the meaning of these parameters is platform-dependent.<br>
• **target-type (string):** The type of the search target. Possible values: human, boat, ship, car, ...<br>
• **target-size (float64):** The estimates size of the search target in meters.

<!-- tabs:start -->
## **JSON example**
```json
{
    "com-uuid": "d37a2e04-c739-4691-a667-de8de8f3e7e8",
    "command": "start-task",
    "execution-unit": "dji0",
    "sender": "commander",
    "task": {
        "name": "search-around-position",
        "params": {
            "geopoint": {
                "altitude": 28.9,
                "latitude": 57.7611363,
                "longitude": 16.6805011,
                "rostype": "GeoPoint"
            },
            "radius": 25.0,
            "speed": "standard",
            "target-size": 2.0,
            "target-type": "human"
        }
    },
    "task-uuid": "f0dbb936-0c64-4b73-b2c5-85f718e1d7ba"
}
```

## **ROS example**

<!-- tabs:end -->