# search-area
**Description:** This node specifies a search of an area given by a list of geopoints. The area is ’closed’ by assuming a segment between the last and first position in the list of geopoints. It is allowed to prepare for moving inside the node, for example doing take-off before flying.

**Tags:** vehicle

**Task Parameters:**<br>
• **area (geopoints):** The area to search.<br>
• **speed (string):** Qualitative speed level. Possible values are "fast", "standard" and "slow", and the meaning of these parameters is platform-dependent.<br>
• **target-type (string):** The type of the search target. Possible values: human, boat, ship, car, ...<br>
• **area-type (string):** The type of the search target. Possible values: water, beach, forest, field<br>
• **target-size (float64):** The estimates size of the search target in meter.

<!-- tabs:start -->
## **JSON example**
```json
{
    "com-uuid": "e16b95da-e3ef-4ba7-99f5-6db1680ad078",
    "command": "start-task",
    "execution-unit": "dji0",
    "sender": "commander",
    "task": {
        "name": "search-area",
        "params": {
            "area": [
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
                }
            ],
            "speed": "standard",
            "target-size": 2.0
        }
    },
    "task-uuid": "dc5adc1f-eb01-40a9-be36-040b5e143e70"
}
```

## **ROS example**

<!-- tabs:end -->