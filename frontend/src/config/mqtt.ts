const env = import.meta.env;

function portFromEnv(value: string | undefined, fallback: number) {
  const port = Number(value);
  return Number.isInteger(port) && port > 0 && port <= 65535 ? port : fallback;
}

// Configure these VITE_MQTT_* build variables when building the VPS image.
// They are intentionally not editable from the Arena UI.
export const arenaMqttConfig = {
  protocol: env.VITE_MQTT_PROTOCOL === "wss" ? "wss" as const : "ws" as const,
  host: env.VITE_MQTT_HOST || "mqtt.conceptio.cloud",
  port: portFromEnv(env.VITE_MQTT_PORT, 8083),
  path: env.VITE_MQTT_PATH || "/mqtt",
  clientId: env.VITE_MQTT_CLIENT_ID || "syscraft_arena",
  rootTopic: env.VITE_MQTT_ROOT_TOPIC || "syscraft/arena",
};
