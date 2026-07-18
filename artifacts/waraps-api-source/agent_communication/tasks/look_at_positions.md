# look-at-positions
**Description:** The agent will try to observe a position or a set of positions by moving the camera (it is only allowed to move the camera). It will try to observe it until it gets an **$enough** signal. It will send back status in the feedback message telling if the position is in view. Possible values for status relative to that: in-view-center, in-view, not-in-view. If more than one position is given as argument then the position nearest to the vehicle should be selected.

**Tags:** None

**Task Parameters:**<br>
• **geopoints (geopoints):** The positions to observe.<br>
• **named-positions (strings):** If defined look at this position (that can change). If the string start with / then it is the position of that unit that is used instead.<br>

<!-- tabs:start -->
## **JSON example**
```json
{
    "com-uuid": "05b87b68-c361-43f7-b0b8-b1b3543ee908",
    "command": "start-task",
    "execution-unit": "dji0",
    "sender": "commander",
    "task": {
        "name": "look-at-positions",
        "params": {
            "geopoints": [
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
        }
    },
    "task-uuid": "67c9526d-4abd-49cb-8146-100eba998e04"
}
```

## **ROS example**

<!-- tabs:end -->