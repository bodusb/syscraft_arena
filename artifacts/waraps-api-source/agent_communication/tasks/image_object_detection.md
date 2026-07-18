# image-object-detection
**Description:** Run detection on an image input stream. Result is put out as a sensor. Send **$enough** to stop the current detection process. Also the result can be seen in an image stream whose address is found using sensors.

**Tags:** None

**Task Parameters:**<br>
• **image-input-url (string):** If non empty the URL for the image stream to do the detections on.<br>
• **image-input-ros-topic (string):** The ROS topic for the input image stream. if given it overrides the image-input-url<br>
• **score (float64):** The minimum sore 0-1 to output a detection.<br>
• **annotation (string):** The values: debug, standard<br>
• **detections-sensor-topic (string):** The ROS topic name for the sensor. Given as full path or relative to the namespace. Example: sensor/detections<br>
• **object-types (strings):** A list of the object types to detect.<br>
• **wanted-detection-rate (int32):** The wanted detection rate.<br>
• **salient-points-topic (string):** The ROS topic name for the sensor. Given as full path or relative to the namespace. Example: sensor/detections<br>
• **salient-score (float64):** The minimum sore 0-1 to output a salient point.

<!-- tabs:start -->
## **JSON example**

## **ROS example**

<!-- tabs:end -->