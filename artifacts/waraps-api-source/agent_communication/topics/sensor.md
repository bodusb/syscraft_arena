# Sensor
The "sensor" subtopic is where an agents different sensors publish their data to the MQTT. It should correspond to the list found in the "sensor_info" message's "sensor-data-provided" parameter.

Publish sensor messages under the following topic:<br>
**TOPIC: UNIT/sensor/SENSOR**<br>
*Note that "SENSOR" is the name of the sensor e.g. "speed", "heading" ect.*

**Mandatory sensors:**<br>
Please note that the following sensors and values are **mandatory** for an level 2 agent:<br> 
• **position**<br>
• **heading**<br>
• **course**<br>
• **speed**<br>

<!-- tabs:start -->
## **JSON sensor examples**
• waraps/unit/air/simulation/dji0/sensor/position: GeoPoint *= json-object consisting of 4 values namely* {latitude: float, longitude: float, altitude: float, type: "GeoPoint"*(string)* }<br>
• waraps/unit/air/simulation/dji0/sensor/heading: float<br>
• waraps/unit/air/simulation/dji0/sensor/course: float<br>
• waraps/unit/air/simulation/dji0/sensor/speed: float<br>

## **ROS sensor examples**
• /dji0/sensor/position: geographic msgs/GeoPoint<br>
• /dji0/sensor/heading: std msgs/Float32<br>
• /dji0/sensor/course: std msgs/Float32<br>
• /dji0/sensor/speed: std msgs/Float32<br>

<!-- tabs:end -->
