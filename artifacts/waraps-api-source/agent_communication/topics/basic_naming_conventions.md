# Basic Naming Conventions
In order to standardise the topic paths and make it easier to find subtopics and their values, a naming convention has been created that all who intend to use the Core System services should follow.

<!-- tabs:start -->
## **JSON**
For users connecting dircetly to the MQTT broker, following naming conventions applies:

***Naming scheme:*** PREFIX1/PREFIX2/PREFIX3/PREFIX4/UNIT/#<br>
***For sensors:*** PREFIX1/PREFIX2/PREFIX3/PREFIX4/UNIT/sensor/SENSOR<br>
***For heartbeat/info messages:*** PREFIX1/PREFIX2/PREFIX3/PREFIX4/UNIT/XXX<br>

>• **PREFIX1:** - The context/ system the unit is used in, can be used to have parallel experiments/demos. E.g: "waraps-demo-2021", "waraps", "aiics-testing", and so on.The standard to connect to Core System services is to use "waraps"<br>
• **PREFIX2:** - The type, in this case "unit" to indicate that it is a agent/robot/system that have heartbeat. Other possible values are general and service but those ar maninly used by Core System services and not relevant in this example.<br>
• **PREFIX3:** The domain of the unit menaing where it is (most) active, e.g. "surface", "air", "subsurface", "ground". Used to filter e.g. boats from drones.<br>
• **PREFIX4:** The state of the agent, wether it is "real", virtual that ha the topic "simulation" or a "playback" of a recording of the agent.<br>
• **UNIT:** Name of the agent e.g. "usvc2", "piraya0", "dji1", "airpelagosystem0" ect.<br>
• **SENSOR:** Name or reference to real or virtual sensor. Examples: "position", "speed", "course", "heading", "battery_state".<br>

**Examples of topic paths:**<br>
    • waraps/unit/air/simulation/dji0/[heartbeat](agent_communication/topics/heartbeat.md)<br>
    • waraps/unit/air/simulation/dji0/[sensor_info](agent_communication/topics/sensor_info.md)<br>
    • waraps/unit/air/simulation/dji0/[direct_execution_info](agent_communication/topics/direct_execution_info.md)<br>
    • waraps/unit/air/simulation/dji0/[tst_execution_info](agent_communication/topics/tst_execution_info.md)<br>
    • waraps/unit/air/simulation/dji0/[sensor](agent_communication/topics/sensor.md)/position<br>
    • waraps/unit/air/simulation/dji0/[sensor](agent_communication/topics/sensor.md)/spatial<br>
    • waraps/unit/air/simulation/dji0/[sensor](agent_communication/topics/sensor.md)/speed<br>
    • waraps/unit/air/simulation/dji0/[sensor](agent_communication/topics/sensor.md)/heading<br>
    • waraps/unit/air/simulation/dji0/[sensor](agent_communication/topics/sensor.md)/course<br>
    • waraps/unit/air/simulation/dji0/[sensor](agent_communication/topics/sensor.md)/camera_url<br>
    • waraps/unit/air/simulation/dji0/[exec](agent_communication/tasks/tasks.md)/command<br>
    • waraps/unit/air/simulation/dji0/[exec](agent_communication/tasks/tasks.md)/response<br>
    • waraps/unit/air/simulation/dji0/[exec](agent_communication/tasks/tasks.md)/feedback<br>

***Please Note*** <br>
    • Topics starts with a name, e.g. waraps/ **not** /waraps/<br>
    • Topics have all **lowercase** and separates words with **underscore ‘_’**, e.g. *.../sensor/camera_data*<br>


## **ROS**
*For sensor topics see Sensors ROS example*<br>

The heartbeat/info messages in string format are sent on:
`n.advertise<lrs_msgs_common::TopicMsg>("/heartbeat_info", 10);`

The definition of TopicMsg is:<br>
`string topic`<br>
`string msg`<br>
So the topic used in the JSON/MQTT API is put on the msg also. That is so that it can be forwarded to the JSON/MQTT part of the system.<br>

*WORK IN PROGRESS, TO BE EXTENDED.*

<!-- tabs:end -->