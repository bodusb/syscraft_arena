# QoS

When using MQTT as the network protocol for communication, there are three QoS (Quality of Service) levels; QoS 0, QoS 1 and QoS 2. <br>
For the most part the messages sent in the Core Sysytem are sent with QoS 0. This level does not ensure that the message is delivered to the broker, but it is enough for most applications in the system since the information that is published from the agents/services almost always are published using a set rate (for example tree times per second). <br>
The choice of using the QoS 0 keeps the amount of TCP/IP packets sent over the network to a minimum and thus requires a lower bandwidth.

If information is not published with a set rate, in the case where a value is only published once and never changed, the standard practice is then to use a "retained" tag for the message. This ensures that the message is saved to the broker, even when the connection to the broker fails. In these cases, be aware that the message is deleted from the broker when it is no longer of use, by publishing an empty string to the same topic. <br>