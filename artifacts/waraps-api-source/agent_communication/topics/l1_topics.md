# L1 Topics
Topics to which agents/services publish and subscribe their information are cruical to the workings of MQTT. However, as there is nothing preventing agents/services from publishing to the same topic, it becomes important to standardize how topics should be constructed. <br>
This to make it easier for the user interfaces and services to find the information they require in order to work, as well as limit the possibility of users interfering with each other by overwriting each others data.

**Design decisions:**<br>
• One info message should be sent for each API level, but at a lower update rate than the general HeartBeat message.<br>
• Use different heartbeat/info messages for each level and send them for all levels you want to register on.<br>
• A ”heartbeat” message shall be sent to indicate the existence of the agent.<br>
• The ”heartbeat” message shall contain a list of levels it is registered on.<br>
• The ”info” messages should have an agent-uuid field that is changed each time the agent reboots. This so that we can detect that the agent has lost its history of commands.<br>

The topics that are necessary for an L1 agent to work with most Core System Services are:<br>
• [heartbeat](agent_communication/topics/heartbeat.md) - All agents<br>
• [sensor_info](agent_communication/topics/sensor_info.md) - Level 1 and above agents<br>
• [sensor](agent_communication/topics/sensor.md) - Level 1 and above agents<br>

To understand and use these topics correctly, you must first understand the basic naming conventions for the topic paths.
