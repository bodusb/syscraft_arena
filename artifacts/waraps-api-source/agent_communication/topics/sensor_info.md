# Sensor Info
The "sensor_info" message contains information about which sensors an agent has that are publishing data to the MQTT. The message should be sent for all level 1 and above agents and is a companion to the "[sensor](agent_communication/topics/sensor.md)" subtopic. It also works as a heartbeat for the sensor level which is why it should contain a list of all sensors published under the "sensor" subtopic.

Publish the sensor_info message to:<br>
**TOPIC: UNIT/sensor_info**

**Message parameters**<br>
• **name:** The name of the agent<br>
• **sensor-data-provided:** List of sensors the agent retains and sends data about. Should correspond with the messages published to the "sensor" subtopic.<br>
• **rate:** The expected rate the message is sent, written in Hz<br>
• **stamp:** Epoch time stamp of when the message was sent, in double (time.time() in Python, seconds in double)<br>
• **type:** A type field indicates what type of message it is. In this case sensor info. <br>

*Note!* The strings listed in **sensor-data-provided** is the string used in **sensor topic**. All sensor topics is under "UNIT/sensor/". E.g: piraya0/sensor/position.

**Example**
```json
{
"name": "piraya0",
"rate": 1.0,
"sensor-data-provided": [
    "position",
    "speed",
    "executing_tasks"
],
"stamp": 1614181737.0478,
"type": "SensorInfo"
}
```