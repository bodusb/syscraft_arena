# Agent Communication
Communication between agents and the user interface and services in WARA-PS is mainly done through a MQTT broker, which is also accessed by ROS agents through a [ROS-MQTT Bridge](agent_communication/topics/ros_mqtt_bridge.md). <br>

Following chapters will guide you through the fundamentals of that communication, including design descisions that have been made, how to write certain topics, what tasks are already defined in the Core System and what parameters and values they use to name a few.

MQTT stands for Message Queuing Telemetry Transport and is a lightweight open source messaging protocol, or set of rules, used for machine-to-machine communication in environments with limited bandwidth. The protocol uses a publish/subscribe communication pattern with a unit publishing data to a topic that others are subscribing to.

**MAIN DESIGN PRINCIPLE:** <br>
Try to minimize work by creating extensions in a general way, but that also works with the existing system. This so smaller refactoring and changes need to be done in the existing system to adapt. However, this does **not** mean to disallow the general optimal solution simply to accomodate the existing system. But start with some hard coding or assumptions of default just to be able to test and close the loop. <br>
**Do not freeze unnecessarily, be AGILE!**<br>

**Some design decisions:**<br>
• Agents/robots are to send regular heartbeat messages with some information on a topic which allows for registering the availability of the agent to the rest of the system. <br>
• Communication requiring a response should be asynchronous<br>
• UUID version 4 shall be used to identify a communication message<br>
• Unreliable communication is handled by resending commands with the same UUID until we give up or a response has arrived.<br>