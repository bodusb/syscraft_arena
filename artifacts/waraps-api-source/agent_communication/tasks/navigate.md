# navigate

**Description:** Navigate through or to a sequence of waypoints. Depending on parameter flags repeat the sequence or end in a holding pattern or just end. Currently there is just one speed, that will be changed to one start speed and one speed per waypoint.

**Tags:** None

**Task Parameters:**<br>
• **waypoints (geopoints):** Way points to navigate through or to.<br>
• **commanded-speed (float64s):** If the commanded-speed parameter is specified use the value in the list for commanded speed for the corresponding waypoint.<br>
• **speed (strings):** Qualitative speed level. Possible values are "fast", "standard" and "slow", and the meaning of these parameters is platform-dependent.<br>
• **continue-flag (bool):** If true and loop flag is false and hold flag is false then continue straight ahead after reaching the end waypoint.<br>
• **loop-flag (bool):** If true the loop the waypoints.<br>
• **hold-flag (bool):** If true then do a holding pattern after the waypoints are finished or the TST have been enough:ed.<br>
• **straight-line-flag (bool):** If true then try to follow the line between waypoints. Not used from start position to first waypoint.