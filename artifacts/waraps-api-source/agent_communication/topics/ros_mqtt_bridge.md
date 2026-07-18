# ROS-MQTT Bridge/Communication
If you want to plug in a robot using ROS you can talk with tommy.persson@liu.se for more details. 

**Main methods**:<br>
• *Plugin in C++ using the available libraries.* This will be available for people asking for this. It is not possible to describe meaningfully here. You need to check out some code and look at some examples. In the repo lrs examples there are code examples for this.<br>
• *Use an action interface.* This is work in progress with SMARC. A first prototype exists. More documentation later.
<br>
• *Using the JSON messages provided on ROS topics via a MQTT Bridge.* <br>


To get the sensor data to the MQTT broker and coded in JSON, a bridge program has to be used. The one available can be started with the following docker-compose.yml file:

```docker-compose.yml
---
version: ’3.3’
services:
    json-api:
        image: gitlab.liu.se:5000/lrs/waraps_docker_images/lrs-json-api-bridge:latest
        command: roslaunch lrs_json_api_bridge json_api.launch mqtt_host:=broker.waraps.org mqtt_user:=mqtt mqtt_passwd:=Check mqtt_tls:=true mqtt_prefix1:="waraps" mqtt_prefix2:="unit" mqtt_prefix3:="ground" mqtt_prefix4:="real" ns:=${NS} json_api_unit:=true --wait
        network_mode: host
        security_opt:
            - "apparmor:unconfined"
        environment:
            - ROS_MASTER_URI=http://localhost:11311
            - ROS_IP=127.0.0.1
```

Do remember to **change the prefix flags to the correct value.** "NS" is the namespace for the robot. So for example: ”/dji0”, ”/leo1”, ...
