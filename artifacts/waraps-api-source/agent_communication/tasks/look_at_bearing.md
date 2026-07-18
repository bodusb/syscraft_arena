# look-at-bearing
**Description:** This task causes the platform with a camera to point that camera using the specified bearing. The task is intended for cases where one should for example capture video, so rather than pointing once, it encapsulates a process where the camera is continuously adjusted. The task will only terminate when a signal **$enough** is sent to the task.

**Tags:** payload

**Task Parameters:**<br>
• **bearing (float64):** Bearing angle in degree. Positive is to the right (clock wise). If absoulte bearing is used zero degre is north<br>
• **use-absolute-bearing (bool):** If true then bearing angle is relative to north. Otherwise it is relative to the vehicles direction.<br>
• **tilt (float64):** Tilt angle in degree. Positive is up.<br>
• **tilt-body-relative (bool):** If true then the tilt angle is relative to the body of the vehicle. Otherwise it is relative to the world (horisontal plane). If this flag is false and the camera cannot be controlled relative to the horisontal plane than act like the parameter was true.

<!-- tabs:start -->
## **JSON example**
```json
{
    "com-uuid": "06143d7a-ceae-4274-8ad5-7df5f75157c8",
    "command": "start-task",
    "execution-unit": "dji0",
    "sender": "commander",
    "task": {
        "name": "look-at-bearing",
        "params": {
            "bearing": 45,
            "tilt": -45,
            "tilt-body-relative": false,
            "use_absoiute_bearing": false
        }
    },
    "task-uuid": "0f2ae2c5-6fc1-465d-b94b-c1adc25a587f"
}
```

## **ROS example**

<!-- tabs:end -->