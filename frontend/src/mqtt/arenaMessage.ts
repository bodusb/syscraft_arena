import { ArenaEntity, EntityAffiliation, EntityDomain, EntityRenderMode } from "../types/entities";

const domains = new Set<EntityDomain>(["surface", "ground", "air", "space", "cyber", "social"]);
const affiliations = new Set<EntityAffiliation>(["friend", "hostile", "neutral", "unknown"]);
const renderModes = new Set<EntityRenderMode>(["mil-symbol", "generic-3d", "scaled-3d-model"]);

type ArenaEntityExtension = Partial<Omit<ArenaEntity, "id" | "name" | "lastSeenAt" | "topic" | "rawPayload">> & {
  id?: string;
  displayName?: string;
  latitude?: number;
  longitude?: number;
  altitudeMeters?: number;
  headingDegrees?: number;
};

type SensorInfoPayload = {
  name?: string;
  rate?: number;
  stamp?: number;
  type?: string;
  "sensor-data-provided"?: string[];
  "arena-entity"?: ArenaEntityExtension;
};

type HeartbeatPayload = {
  name?: string;
  stamp?: number;
  type?: string;
};

export type ArenaMqttUpdate =
  | { kind: "snapshot"; entity: ArenaEntity }
  | { kind: "heartbeat"; id: string; lastSeenAt: number };

function numberFrom(value: unknown) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : undefined;
}

function parseJsonPayload(payload: Uint8Array) {
  const text = new TextDecoder().decode(payload);
  if (!text.trim()) {
    return null;
  }

  return { message: JSON.parse(text) as Record<string, unknown>, text };
}

function topicDetails(topic: string, rootTopic: string) {
  const root = rootTopic.replace(/^\/+|\/+$/g, "");
  const normalizedTopic = topic.replace(/^\/+|\/+$/g, "");
  const relative = root && normalizedTopic.startsWith(`${root}/`)
    ? normalizedTopic.slice(root.length + 1)
    : normalizedTopic;
  const parts = relative.split("/");
  const endpoint = parts.at(-1);

  // After removing the configured prefix, WARA-PS is:
  // unit/{domain}/{real|simulation|playback}/{UNIT}/{endpoint}
  return {
    domain: parts[1],
    unitName: parts[3],
    endpoint,
    isWarapsUnitTopic: parts.length === 5 && parts[0] === "unit" && ["air", "ground", "surface", "subsurface"].includes(parts[1]),
  };
}

function timestampFrom(stamp: unknown, fallback: number) {
  const seconds = numberFrom(stamp);
  return seconds === undefined ? fallback : seconds * 1000;
}

function snapshotFromSensorInfo(
  topic: string,
  message: SensorInfoPayload,
  text: string,
  rootTopic: string,
  receivedAt: number,
): ArenaEntity | null {
  const { domain: topicDomain, unitName } = topicDetails(topic, rootTopic);
  const extension = message["arena-entity"];
  const latitude = numberFrom(extension?.latitude);
  const longitude = numberFrom(extension?.longitude);
  if (!extension || latitude === undefined || longitude === undefined) {
    return null;
  }

  const id = extension.id ?? message.name ?? unitName ?? topic;
  const domain = domains.has(extension.domain as EntityDomain)
    ? extension.domain as EntityDomain
    : domains.has(topicDomain as EntityDomain)
      ? topicDomain as EntityDomain
      : "ground";

  return {
    id,
    name: extension.displayName ?? message.name ?? id,
    latitude,
    longitude,
    altitudeMeters: numberFrom(extension.altitudeMeters),
    headingDegrees: numberFrom(extension.headingDegrees),
    sidc: extension.sidc ?? "130310001412110000000000000000",
    symbology: extension.symbology,
    affiliation: affiliations.has(extension.affiliation as EntityAffiliation)
      ? extension.affiliation as EntityAffiliation
      : "unknown",
    domain,
    systemType: extension.systemType ?? "asset",
    assetType: extension.assetType ?? "asset",
    topic,
    rawPayload: text,
    lastSeenAt: timestampFrom(message.stamp, receivedAt),
    visible: extension.visible ?? true,
    renderMode: renderModes.has(extension.renderMode as EntityRenderMode)
      ? extension.renderMode as EntityRenderMode
      : "mil-symbol",
    modelUri: extension.modelUri,
  };
}

/** Parses only the WARA-PS topics consumed by the Arena: sensor_info and heartbeat. */
export function arenaMqttUpdateFromMessage(
  topic: string,
  payload: Uint8Array,
  rootTopic: string,
  receivedAt = Date.now(),
): ArenaMqttUpdate | null {
  let parsedPayload: ReturnType<typeof parseJsonPayload>;
  try {
    parsedPayload = parseJsonPayload(payload);
  } catch {
    return null;
  }
  if (!parsedPayload) {
    return null;
  }

  const { message, text } = parsedPayload;
  const { endpoint, unitName, isWarapsUnitTopic } = topicDetails(topic, rootTopic);
  if (!isWarapsUnitTopic) {
    return null;
  }
  if (endpoint === "sensor_info" && message.type === "SensorInfo") {
    const entity = snapshotFromSensorInfo(topic, message as SensorInfoPayload, text, rootTopic, receivedAt);
    return entity ? { kind: "snapshot", entity } : null;
  }
  if (endpoint === "heartbeat" && message.type === "HeartBeat") {
    const name = (message as HeartbeatPayload).name ?? unitName;
    return name ? { kind: "heartbeat", id: name, lastSeenAt: timestampFrom((message as HeartbeatPayload).stamp, receivedAt) } : null;
  }
  return null;
}
