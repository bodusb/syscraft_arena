# take-off

**Description:** This node ensures that the platform is in the air. If this is already true, nothing will happen. If the platform is on the ground, it will take off to a vehicle-specific altitude.

**Tags:** vehicle

**Task Parameters:**<br>
• **height-above-takeoff (float64):** If specified, then climb to the specified altitude after taking off (the value is relative to the takeoff position). Otherwise, the altitude after take-off is unspecified and platform-specific.<br>
• **path (geopoints):** Used in proposal and execution. A sequence of waypoints to fly through or to.<br>