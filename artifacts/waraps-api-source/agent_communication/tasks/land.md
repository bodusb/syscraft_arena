# land

**Description:** Causes the platform to land.

**Tags:** vehicle

**Task Parameters:**<br>
• **p (geopoint):** The position at which the platform should land, if land-at-current-position-flag is false.<br>
• **land-at-current-position-flag (bool):** If this flag is true, land at the current position of the aircraft. Otherwise, land at the position given by p<br>
• **z (float64):** The offset from the default landing altitude to use in simula tions. Default value is 0.0<br>
• **heading (float64):** Specify this for fixed-wing platforms that require a heading in order to land. Helicopters may ignore this parameter.