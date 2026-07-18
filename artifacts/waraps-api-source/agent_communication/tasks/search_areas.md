# search-areas
**Description:** This node specifies a search of a set of area. The areas are "closed" by assuming a segment between the last and first position in the list of geopoints. It is allowed to prepare for moving inside the node, for example doing take-off before flying.

**Tags:** vehicle

**Task Parameters:**<br>
• **areas (geopointarrays):** The areas to search.<br>
• **speed (string):** Qualitative speed level. Possible values are "fast", "standard" and "slow", and the meaning of these parameters is platform-dependent.<br>
• **target-type (string):** The type of the search target. Possible values: human, boat, ship, car, ...<br>
• **area-type (string):** The type of the search area given as a list of tags. Possible tag values: water, beach, forest, field<br>
• **target-size (float64):** The estimates size of the search target in meter.

<!-- tabs:start -->
## **JSON example**
```json
{
    "com-uuid": "c6929a0e-ad60-40d9-8f60-9b05d632c0fe",
    "command": "start-task",
    "execution-unit": "op0",
    "sender": "commander",
    "task": {
        "name": "search-areas",
        "params": {
            "areas": [
                [
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
                [
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
                [
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
                ]
            ],
            "speed": "standard",
            "target-size": 4.0
        }
    },
    "task-uuid": "3f800056-7340-4607-8660-930297adc8b7"
}
```

## **ROS example**

<!-- tabs:end -->