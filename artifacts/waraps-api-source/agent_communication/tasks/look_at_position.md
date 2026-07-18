# look-at-position
**Description:** The agent will try to observe a position by moving the camera (it is only allowed to move the camera). It will try to observe it until it gets an **$enough** signal. It will send back status in the feedback message telling if the position is in view. Possible values for status relative to that: in-view-center, in-view, not-in-view.

**Tags:** None

**Task Parameters:**<br>
• **geopoint (geopoint):** The position to observe.<br>
• **named-position (string):** If defined look at this position (that can change). If the string start with / then it is the position of that unit that is used instead.<br>

<!-- tabs:start -->
## **JSON example**
```json
{
    "com-uuid": "173ba99f-cb4e-4c7f-87d0-c4888b1f1e9d",
    "command": "start-task",
    "execution-unit": "dji0",
    "sender": "commander",
    "task": {
        "name": "look-at-position",
        "params": {
            "geopoint": {
                "altitude": 40.0,
                "latitude": 57.7611363,
                "longitude": 16.6805011,
                "rostype": "GeoPoint"
            }
        }
    },
    "task-uuid": "fded481d-f3a9-46c1-a44e-af205b0190d9"
}
```

## **ROS example**

<!-- tabs:end -->