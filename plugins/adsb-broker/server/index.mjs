import express from "express";
import mqtt from "mqtt";
import path from "node:path";
import { fileURLToPath } from "node:url";

const app = express();
const port = Number(process.env.ADSB_PLUGIN_API_PORT ?? 5175);
const openskyBaseUrl = process.env.OPENSKY_BASE_URL ?? "https://opensky-network.org/api";
const defaultMqtt = {
  protocol: process.env.SYSCRAFT_MQTT_PROTOCOL ?? "ws",
  host: process.env.SYSCRAFT_MQTT_HOST ?? "mqtt.conceptio.cloud",
  port: Number(process.env.SYSCRAFT_MQTT_PORT ?? 8083),
  path: process.env.SYSCRAFT_MQTT_PATH ?? "/mqtt",
  rootTopic: process.env.SYSCRAFT_MQTT_ROOT_TOPIC ?? "syscraft/arena",
  username: process.env.SYSCRAFT_MQTT_USERNAME ?? "chris",
  password: process.env.SYSCRAFT_MQTT_PASSWORD ?? "",
};

app.use(express.json({ limit: "1mb" }));

function numberFrom(value) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : undefined;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function toRadians(value) {
  return value * Math.PI / 180;
}

function distanceKm(a, b) {
  const earthRadiusKm = 6371;
  const deltaLat = toRadians(b.latitude - a.latitude);
  const deltaLon = toRadians(b.longitude - a.longitude);
  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);
  const h =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2;
  return 2 * earthRadiusKm * Math.asin(Math.min(1, Math.sqrt(h)));
}

function areaBounds(area) {
  const latitude = clamp(numberFrom(area.latitude) ?? 0, -85, 85);
  const longitude = clamp(numberFrom(area.longitude) ?? 0, -180, 180);
  const radiusKm = clamp(numberFrom(area.radiusKm) ?? 25, 1, 250);
  const deltaLat = radiusKm / 111.32;
  const longitudeScale = Math.max(0.18, Math.cos(toRadians(latitude)));
  const deltaLon = radiusKm / (111.32 * longitudeScale);

  return {
    lamin: clamp(latitude - deltaLat, -90, 90),
    lamax: clamp(latitude + deltaLat, -90, 90),
    lomin: clamp(longitude - deltaLon, -180, 180),
    lomax: clamp(longitude + deltaLon, -180, 180),
  };
}

function normalizeArea(area) {
  const latitude = numberFrom(area.latitude);
  const longitude = numberFrom(area.longitude);
  const radiusKm = numberFrom(area.radiusKm);

  if (latitude === undefined || longitude === undefined || radiusKm === undefined) {
    return null;
  }

  return {
    id: String(area.id ?? `${latitude.toFixed(4)}-${longitude.toFixed(4)}-${radiusKm}`),
    label: String(area.label ?? "ADS-B area"),
    latitude: clamp(latitude, -85, 85),
    longitude: clamp(longitude, -180, 180),
    radiusKm: clamp(radiusKm, 1, 250),
    enabled: area.enabled !== false,
  };
}

function normalizeAircraft(state, area) {
  const [
    icao24,
    callsign,
    originCountry,
    timePosition,
    lastContact,
    longitude,
    latitude,
    baroAltitude,
    onGround,
    velocity,
    trueTrack,
    verticalRate,
    ,
    geoAltitude,
    squawk,
    spi,
    positionSource,
    category,
  ] = state;

  const lat = numberFrom(latitude);
  const lon = numberFrom(longitude);
  if (lat === undefined || lon === undefined) {
    return null;
  }

  const distanceFromAreaKm = distanceKm(
    { latitude: area.latitude, longitude: area.longitude },
    { latitude: lat, longitude: lon },
  );

  if (distanceFromAreaKm > area.radiusKm) {
    return null;
  }

  const normalizedCallsign = String(callsign ?? icao24 ?? "unknown").trim() || icao24;

  return {
    icao24,
    callsign: normalizedCallsign,
    originCountry,
    timePosition,
    lastContact,
    latitude: lat,
    longitude: lon,
    baroAltitudeMeters: numberFrom(baroAltitude),
    geoAltitudeMeters: numberFrom(geoAltitude),
    onGround: Boolean(onGround),
    velocityMetersPerSecond: numberFrom(velocity),
    trueTrackDegrees: numberFrom(trueTrack),
    verticalRateMetersPerSecond: numberFrom(verticalRate),
    squawk,
    spi,
    positionSource,
    category,
    sourceAreaId: area.id,
    sourceAreaLabel: area.label,
    distanceFromAreaKm: Number(distanceFromAreaKm.toFixed(2)),
  };
}

function aircraftToArenaEntity(aircraft, rootTopic) {
  const id = `opensky-${aircraft.icao24}`;
  const altitudeMeters = aircraft.geoAltitudeMeters ?? aircraft.baroAltitudeMeters;
  const headingDegrees = aircraft.trueTrackDegrees;

  return {
    topic: `${rootTopic.replace(/\/+$/g, "")}/air/aircraft/${id}`,
    payload: {
      id,
      name: aircraft.callsign ? `ADS-B ${aircraft.callsign}` : `ADS-B ${aircraft.icao24}`,
      domain: "air",
      assetType: "aircraft",
      systemType: "adsb-aircraft",
      lat: aircraft.latitude,
      lon: aircraft.longitude,
      latitude: aircraft.latitude,
      longitude: aircraft.longitude,
      altitudeMeters,
      altitude: altitudeMeters,
      headingDegrees,
      heading: headingDegrees,
      sidc: "130301000011010000000000000000",
      affiliation: "neutral",
      renderMode: "mil-symbol",
      visible: true,
      source: "opensky",
      sourceAreaId: aircraft.sourceAreaId,
      sourceAreaLabel: aircraft.sourceAreaLabel,
      callsign: aircraft.callsign,
      icao24: aircraft.icao24,
      velocityMetersPerSecond: aircraft.velocityMetersPerSecond,
      verticalRateMetersPerSecond: aircraft.verticalRateMetersPerSecond,
      onGround: aircraft.onGround,
      lastContact: aircraft.lastContact,
    },
  };
}

function validateArenaPayload(topic, payload, rootTopic) {
  const validDomains = new Set(["surface", "ground", "air", "space", "cyber", "social"]);
  const validAffiliations = new Set(["friend", "hostile", "neutral", "unknown"]);
  const validRenderModes = new Set(["mil-symbol", "generic-3d", "scaled-3d-model"]);
  const normalizedRoot = rootTopic.replace(/^\/+|\/+$/g, "");
  const normalizedTopic = topic.replace(/^\/+|\/+$/g, "");
  const relative = normalizedRoot && normalizedTopic.startsWith(`${normalizedRoot}/`)
    ? normalizedTopic.slice(normalizedRoot.length + 1)
    : normalizedTopic;
  const [topicDomain, topicAssetType, topicId] = relative.split("/");
  const latitude = numberFrom(payload.latitude ?? payload.lat);
  const longitude = numberFrom(payload.longitude ?? payload.lon);

  return {
    accepted: latitude !== undefined && longitude !== undefined,
    derived: {
      id: payload.id ?? topicId ?? topic,
      domain: validDomains.has(payload.domain) ? payload.domain : topicDomain,
      assetType: payload.assetType ?? topicAssetType ?? "asset",
      latitude,
      longitude,
      altitudeMeters: numberFrom(payload.altitudeMeters ?? payload.altitude),
      headingDegrees: numberFrom(payload.headingDegrees ?? payload.heading),
      affiliation: validAffiliations.has(payload.affiliation) ? payload.affiliation : "unknown",
      renderMode: validRenderModes.has(payload.renderMode) ? payload.renderMode : "mil-symbol",
    },
  };
}

async function fetchAreaAircraft(area) {
  const bounds = areaBounds(area);
  const params = new URLSearchParams({
    lamin: bounds.lamin.toFixed(5),
    lomin: bounds.lomin.toFixed(5),
    lamax: bounds.lamax.toFixed(5),
    lomax: bounds.lomax.toFixed(5),
    extended: "1",
  });

  const response = await fetch(`${openskyBaseUrl}/states/all?${params.toString()}`, {
    headers: {
      Accept: "application/json",
      "User-Agent": "SysCraft ADS-B Broker Plugin/0.1",
    },
  });

  if (!response.ok) {
    throw new Error(`OpenSky request failed with ${response.status}`);
  }

  const data = await response.json();
  const states = Array.isArray(data.states) ? data.states : [];
  return states
    .map((state) => normalizeAircraft(state, area))
    .filter(Boolean);
}

async function publishArenaEntities(entities, mqttSettings) {
  if (!entities.length) {
    return { published: 0 };
  }

  const settings = {
    ...defaultMqtt,
    ...mqttSettings,
    username: mqttSettings.username || defaultMqtt.username,
    password: mqttSettings.password || defaultMqtt.password,
    path: mqttSettings.path || defaultMqtt.path,
    protocol: mqttSettings.protocol || defaultMqtt.protocol,
  };
  const protocol = settings.protocol === "wss" ? "wss" : settings.protocol === "mqtt" ? "mqtt" : "ws";
  const pathSuffix = protocol === "mqtt" ? "" : settings.path || "/mqtt";
  const brokerUrl = `${protocol}://${settings.host}:${settings.port}${pathSuffix}`;

  if (settings.username && !settings.password) {
    throw new Error(`MQTT password is missing for user ${settings.username}. Add it in the plugin MQTT Output panel or set SYSCRAFT_MQTT_PASSWORD before starting Docker.`);
  }

  const client = mqtt.connect(brokerUrl, {
    username: settings.username || undefined,
    password: settings.password || undefined,
    protocolVersion: 5,
    clean: true,
    reconnectPeriod: 0,
    connectTimeout: 8000,
  });

  await new Promise((resolve, reject) => {
    client.once("connect", resolve);
    client.once("error", reject);
  });

  await Promise.all(
    entities.map((entity) =>
      new Promise((resolve, reject) => {
        client.publish(entity.topic, JSON.stringify(entity.payload), { qos: 0 }, (error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      }),
    ),
  );

  client.end(true);
  console.log(`Published ${entities.length} ADS-B entities to ${settings.rootTopic ?? defaultMqtt.rootTopic}/# via ${brokerUrl}`);
  return { published: entities.length };
}

async function collectAreas(areas) {
  const normalizedAreas = areas.map(normalizeArea).filter(Boolean).filter((area) => area.enabled);
  const areaResults = await Promise.all(
    normalizedAreas.map(async (area) => ({
      area,
      aircraft: await fetchAreaAircraft(area),
    })),
  );

  const dedupedAircraft = new Map();
  areaResults.forEach(({ aircraft }) => {
    aircraft.forEach((item) => {
      if (item.icao24) {
        dedupedAircraft.set(item.icao24, item);
      }
    });
  });

  return {
    areaResults,
    aircraft: Array.from(dedupedAircraft.values()),
  };
}

app.get("/api/health", (_request, response) => {
  response.json({
    ok: true,
    openskyBaseUrl,
    defaultMqtt,
  });
});

app.get("/api/debug/arena-contract", (_request, response) => {
  const sampleAircraft = {
    icao24: "sample01",
    callsign: "SAMPLE1",
    latitude: 29.1886,
    longitude: -81.0487,
    geoAltitudeMeters: 1200,
    trueTrackDegrees: 92,
    velocityMetersPerSecond: 82,
    verticalRateMetersPerSecond: 0,
    onGround: false,
    sourceAreaId: "sample-area",
    sourceAreaLabel: "Sample ADS-B Area",
    lastContact: Math.floor(Date.now() / 1000),
  };
  const entity = aircraftToArenaEntity(sampleAircraft, defaultMqtt.rootTopic);

  response.json({
    rootTopic: defaultMqtt.rootTopic,
    subscription: `${defaultMqtt.rootTopic.replace(/\/+$/g, "")}/#`,
    topic: entity.topic,
    payload: entity.payload,
    arenaParserCheck: validateArenaPayload(entity.topic, entity.payload, defaultMqtt.rootTopic),
  });
});

app.post("/api/opensky/preview", async (request, response) => {
  try {
    const areas = Array.isArray(request.body?.areas) ? request.body.areas : [];
    const result = await collectAreas(areas);
    response.json({
      aircraft: result.aircraft,
      areaCounts: result.areaResults.map(({ area, aircraft }) => ({
        id: area.id,
        label: area.label,
        count: aircraft.length,
      })),
      fetchedAt: Date.now(),
    });
  } catch (error) {
    response.status(502).json({ error: error.message ?? "OpenSky preview failed" });
  }
});

app.post("/api/opensky/publish", async (request, response) => {
  try {
    const areas = Array.isArray(request.body?.areas) ? request.body.areas : [];
    const mqttSettings = request.body?.mqtt ?? {};
    const rootTopic = mqttSettings.rootTopic || defaultMqtt.rootTopic;
    const result = await collectAreas(areas);
    const entities = result.aircraft.map((aircraft) => aircraftToArenaEntity(aircraft, rootTopic));
    const publishResult = await publishArenaEntities(entities, mqttSettings);

    response.json({
      aircraft: result.aircraft,
      published: publishResult.published,
      topics: entities.map((entity) => entity.topic),
      fetchedAt: Date.now(),
    });
  } catch (error) {
    response.status(502).json({ error: error.message ?? "OpenSky publish failed" });
  }
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.resolve(__dirname, "../dist");

app.use(express.static(distPath));
app.get("*", (_request, response) => {
  response.sendFile(path.join(distPath, "index.html"));
});

app.listen(port, "0.0.0.0", () => {
  console.log(`SysCraft ADS-B Broker API listening on ${port}`);
});
