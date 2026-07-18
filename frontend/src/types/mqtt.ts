export type MqttConnectionStatus = "idle" | "connecting" | "connected" | "error";

export type MqttSettings = {
  enabled: boolean;
  protocol: "ws" | "wss";
  host: string;
  port: number;
  path: string;
  username: string;
  password: string;
  clientId: string;
  rootTopic: string;
  subscribeRefreshSeconds: number;
};
