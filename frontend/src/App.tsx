import { useEffect, useMemo, useState, type FormEvent } from "react";
import mqtt, { MqttClient } from "mqtt";
import {
  ChevronLeft,
  Cpu,
  Eye,
  EyeOff,
  FileSearch,
  LandPlot,
  LocateFixed,
  Map,
  Orbit,
  PanelRightOpen,
  Plane,
  RadioTower,
  Search,
  Settings2,
  Ship,
  Users,
  Waypoints,
  X,
} from "lucide-react";
import { ArenaMap } from "./components/ArenaMap";
import { arenaMqttConfig } from "./config/mqtt";
import { embryRiddleDaytonaView } from "./data/demoEntities";
import { arenaMqttUpdateFromMessage } from "./mqtt/arenaMessage";
import { ArenaEntity, EntityDomain } from "./types/entities";
import { MapMode, MapSettings } from "./types/map";
import { MqttConnectionStatus, MqttSettings } from "./types/mqtt";

type ConfigKey = "map" | "mqtt";

type DomainVisibility = Record<EntityDomain, boolean>;

const configItems = [
  { key: "map", label: "Map", icon: Map },
  { key: "mqtt", label: "MQTT", icon: RadioTower },
] as const;

const assetDomains = [
  { key: "surface", label: "Surface", detail: "Water", icon: Ship },
  { key: "ground", label: "Ground", detail: "Land assets", icon: LandPlot },
  { key: "air", label: "Air", detail: "Aircraft and airborne nodes", icon: Plane },
  { key: "space", label: "Space", detail: "Orbital and space tracks", icon: Orbit },
  { key: "cyber", label: "Cyber", detail: "Network and cyber nodes", icon: Cpu },
  { key: "social", label: "Social", detail: "People and human cells", icon: Users },
] satisfies Array<{ key: EntityDomain; label: string; detail: string; icon: typeof Ship }>;

const defaultDomainVisibility = assetDomains.reduce((visibility, domain) => {
  visibility[domain.key] = true;
  return visibility;
}, {} as DomainVisibility);

const defaultMqttSettings: MqttSettings = {
  enabled: false,
  ...arenaMqttConfig,
  username: "",
  password: "",
  subscribeRefreshSeconds: 1,
};

const mqttSettingsStorageKey = "syscraft-arena:last-mqtt-settings";

function loadSavedMqttSettings(): MqttSettings {
  if (typeof window === "undefined") {
    return defaultMqttSettings;
  }

  try {
    const saved = window.localStorage.getItem(mqttSettingsStorageKey);
    if (!saved) {
      return defaultMqttSettings;
    }

    const parsedSettings = JSON.parse(saved) as Pick<MqttSettings, "subscribeRefreshSeconds">;

    return {
      ...defaultMqttSettings,
      subscribeRefreshSeconds: Math.min(60, Math.max(0.1, Number(parsedSettings.subscribeRefreshSeconds) || 1)),
      enabled: false,
    };
  } catch {
    return defaultMqttSettings;
  }
}

const mapModes = [
  { key: "2d", label: "2D", description: "Flat operational map for overview and planning." },
  { key: "3d", label: "3D", description: "Globe projection with terrain and OSM-derived buildings." },
] satisfies Array<{ key: MapMode; label: string; description: string }>;

type NominatimResult = {
  display_name: string;
  lat: string;
  lon: string;
};

async function geocodeLocation(query: string): Promise<NominatimResult | null> {
  const params = new URLSearchParams({
    q: query,
    format: "jsonv2",
    limit: "1",
  });

  const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Location search is unavailable.");
  }

  const results = (await response.json()) as NominatimResult[];
  return results[0] ?? null;
}

function ArenaLogo() {
  return (
    <div className="arena-logo" aria-label="SysCraft Arena">
      <div className="arena-logo__mark" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
        <Waypoints size={22} strokeWidth={1.8} />
      </div>
      <div>
        <strong>SysCraft Arena</strong>
        <span>System-of-Systems runtime</span>
      </div>
    </div>
  );
}

function getAssetAgeSeconds(entity: ArenaEntity, now: number) {
  return Math.max(0, Math.floor((now - entity.lastSeenAt) / 1000));
}

function isEntityRetained(entity: ArenaEntity, now: number, heartbeatSeconds: number) {
  return getAssetAgeSeconds(entity, now) <= heartbeatSeconds;
}

function AssetManagement({
  entities,
  domainVisibility,
  heartbeatSeconds,
  now,
  selectedEntityId,
  onDomainVisibilityChange,
  onEntityInspect,
  onEntityVisibilityChange,
  onHeartbeatSecondsChange,
}: {
  entities: ArenaEntity[];
  domainVisibility: DomainVisibility;
  heartbeatSeconds: number;
  now: number;
  selectedEntityId: string | null;
  onDomainVisibilityChange: (domain: EntityDomain, visible: boolean) => void;
  onEntityInspect: (entityId: string) => void;
  onEntityVisibilityChange: (entityId: string, visible: boolean) => void;
  onHeartbeatSecondsChange: (seconds: number) => void;
}) {
  const activeEntities = entities.filter((entity) => isEntityRetained(entity, now, heartbeatSeconds));
  const selectedEntity = activeEntities.find((entity) => entity.id === selectedEntityId) ?? null;

  function assetInspectorPayload(entity: ArenaEntity) {
    if (entity.rawPayload) {
      try {
        return JSON.stringify(JSON.parse(entity.rawPayload), null, 2);
      } catch {
        return entity.rawPayload;
      }
    }

    return JSON.stringify(
      {
        id: entity.id,
        name: entity.name,
        domain: entity.domain,
        assetType: entity.assetType,
        systemType: entity.systemType,
        latitude: entity.latitude,
        longitude: entity.longitude,
        altitudeMeters: entity.altitudeMeters,
        headingDegrees: entity.headingDegrees,
        sidc: entity.sidc,
        affiliation: entity.affiliation,
        renderMode: entity.renderMode,
        visible: entity.visible,
      },
      null,
      2,
    );
  }

  return (
    <div className={`drawer-content drawer-content--assets ${selectedEntity ? "has-inspector" : ""}`}>
      <div className="asset-list-pane">
        <h2>Asset Management</h2>
        <div className="asset-heartbeat">
          <label>
            <span>Heartbeat TTL</span>
            <input
              type="number"
              min={5}
              max={300}
              step={5}
              value={heartbeatSeconds}
              onChange={(event) => onHeartbeatSecondsChange(Number(event.currentTarget.value))}
            />
          </label>
          <strong>{activeEntities.length}</strong>
          <small>active / {entities.length} tracked</small>
        </div>

        <div className="asset-domain-list">
          {assetDomains.map((domain) => {
            const domainEntities = activeEntities.filter((entity) => entity.domain === domain.key);
            const domainVisible = domainVisibility[domain.key];

            return (
              <section className="asset-domain" key={domain.key}>
                <header>
                  <div>
                    <domain.icon size={16} />
                    <span>
                      <strong>{domain.label}</strong>
                      <small>{domainEntities.length} active</small>
                    </span>
                  </div>
                  <button
                    className={`asset-icon-button ${domainVisible ? "" : "is-muted"}`}
                    type="button"
                    aria-label={`${domainVisible ? "Hide" : "Show"} ${domain.label} domain`}
                    aria-pressed={domainVisible}
                    onClick={() => onDomainVisibilityChange(domain.key, !domainVisible)}
                  >
                    {domainVisible ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>
                </header>

                <div className="asset-topic-list">
                  {domainEntities.length > 0 ? (
                    domainEntities.map((entity) => {
                      const age = getAssetAgeSeconds(entity, now);
                      const entityVisible = entity.visible;
                      const mapVisible = domainVisible && entityVisible;

                      return (
                        <article className={mapVisible ? "" : "is-hidden"} key={entity.id}>
                          <div className="asset-row-main">
                            <strong>{entity.name}</strong>
                            <small>
                              {entity.assetType} / {entity.systemType}
                              {entity.altitudeMeters !== undefined ? ` / ${entity.altitudeMeters.toLocaleString()} m ASL` : ""}
                            </small>
                          </div>
                          <span className="asset-age">{age}s</span>
                          <div className="asset-row-actions">
                            <button
                              className={`asset-icon-button ${entityVisible ? "" : "is-muted"}`}
                              type="button"
                              aria-label={`${entityVisible ? "Hide" : "Show"} ${entity.name}`}
                              aria-pressed={entityVisible}
                              onClick={() => onEntityVisibilityChange(entity.id, !entityVisible)}
                            >
                              {entityVisible ? <Eye size={15} /> : <EyeOff size={15} />}
                            </button>
                            <button
                              className="asset-inspect-button"
                              type="button"
                              aria-label={`Inspect ${entity.name}`}
                              aria-pressed={selectedEntityId === entity.id}
                              onClick={() => onEntityInspect(entity.id)}
                            >
                              <FileSearch size={14} />
                            </button>
                          </div>
                        </article>
                      );
                    })
                  ) : (
                    <p className="asset-empty">No heartbeat</p>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </div>

      {selectedEntity ? (
        <aside className="asset-inspector" aria-label="Asset inspector">
          <p>Asset Inspector</p>
          <h2>{selectedEntity.name}</h2>
          <dl>
            <div>
              <dt>Topic</dt>
              <dd>{selectedEntity.topic}</dd>
            </div>
            <div>
              <dt>Domain</dt>
              <dd>{selectedEntity.domain}</dd>
            </div>
            <div>
              <dt>Last heartbeat</dt>
              <dd>{getAssetAgeSeconds(selectedEntity, now)}s ago</dd>
            </div>
            <div>
              <dt>Map visibility</dt>
              <dd>{domainVisibility[selectedEntity.domain] && selectedEntity.visible ? "Visible" : "Hidden"}</dd>
            </div>
          </dl>
          <pre className="asset-editor" aria-label={`${selectedEntity.name} MQTT payload`}>
            {assetInspectorPayload(selectedEntity)}
          </pre>
        </aside>
      ) : null}
    </div>
  );
}

function mqttUrl(settings: MqttSettings) {
  const normalizedPath = settings.path.startsWith("/") ? settings.path : `/${settings.path}`;
  return `${settings.protocol}://${settings.host}:${settings.port}${normalizedPath}`;
}

function mqttSubscription(settings: MqttSettings) {
  return `${settings.rootTopic.replace(/\/+$/g, "")}/#`;
}

function describeMqttSubscribeError(error: Error, subscription: string) {
  const reason = error.message || "subscription rejected";
  return `Connected to broker, but subscription ${subscription} failed: ${reason}. Check EMQX ACL/topic permissions for this user.`;
}

function MqttConfiguration({
  settings,
  status,
  error,
  receivedCount,
  acceptedCount,
  rejectedCount,
  lastTopic,
  subscribePulse,
  onSettingsChange,
}: {
  settings: MqttSettings;
  status: MqttConnectionStatus;
  error: string;
  receivedCount: number;
  acceptedCount: number;
  rejectedCount: number;
  lastTopic: string;
  subscribePulse: boolean;
  onSettingsChange: (settings: MqttSettings) => void;
}) {
  return (
    <div className="drawer-content">
      <h2>MQTT Configuration</h2>
      <div className={`mqtt-status mqtt-status--${status}`}>
        <strong>{status}</strong>
        <span>{settings.enabled ? mqttUrl(settings) : "Subscriber disabled"}</span>
        <small>{receivedCount} packets received · {acceptedCount} accepted · {rejectedCount} ignored</small>
        {lastTopic ? <small>Last packet: {lastTopic}</small> : null}
        <small className="mqtt-refresh-status"><i className={subscribePulse ? "is-pulsing" : ""} /> subscription refresh {settings.subscribeRefreshSeconds}s</small>
        {error ? <em>{error}</em> : null}
      </div>

      <div className="mqtt-form">
        <label>
          <span>Subscription refresh (seconds)</span>
          <input
            type="number"
            min={0.1}
            max={60}
            step={0.1}
            value={settings.subscribeRefreshSeconds}
            onChange={(event) => onSettingsChange({ ...settings, subscribeRefreshSeconds: Math.min(60, Math.max(0.1, Number(event.currentTarget.value) || 0.1)) })}
          />
        </label>
      </div>

      <h2>Subscription</h2>
      <pre className="mqtt-subscription">{mqttSubscription(settings)}</pre>
      <pre className="asset-editor" aria-label="Expected MQTT payload example">
{`{
  "name": "mqtt-contract-test-01",
  "rate": 0.0333,
  "sensor-data-provided": ["position", "heading"],
  "stamp": 1763241600.125,
  "type": "SensorInfo",
  "arena-entity": {
    "id": "mqtt-contract-test-01",
    "displayName": "MQTT Contract Test",
    "domain": "air",
    "latitude": 29.1886,
    "longitude": -81.0487
  }
}`}
      </pre>
    </div>
  );
}

function MapConfiguration({
  activeConfig,
  mapSettings,
  mqttSettings,
  mqttStatus,
  mqttError,
  mqttReceivedCount,
  mqttAcceptedCount,
  mqttRejectedCount,
  mqttLastTopic,
  subscribePulse,
  onMapSettingsChange,
  onMqttSettingsChange,
}: {
  activeConfig: ConfigKey;
  mapSettings: MapSettings;
  mqttSettings: MqttSettings;
  mqttStatus: MqttConnectionStatus;
  mqttError: string;
  mqttReceivedCount: number;
  mqttAcceptedCount: number;
  mqttRejectedCount: number;
  mqttLastTopic: string;
  subscribePulse: boolean;
  onMapSettingsChange: (settings: MapSettings) => void;
  onMqttSettingsChange: (settings: MqttSettings) => void;
}) {
  const [locationInput, setLocationInput] = useState("");
  const [latitudeInput, setLatitudeInput] = useState("");
  const [longitudeInput, setLongitudeInput] = useState("");
  const [navigationError, setNavigationError] = useState("");
  const [searchMessage, setSearchMessage] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  function navigateTo(latitude: number, longitude: number, zoom: number) {
    onMapSettingsChange({
      ...mapSettings,
      navigationTarget: {
        id: Date.now(),
        latitude,
        longitude,
        zoom,
      },
    });
  }

  async function handleLocationSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const query = locationInput.trim();
    if (!query) {
      setSearchMessage("Enter a place, address, or landmark.");
      return;
    }

    setIsSearching(true);
    setNavigationError("");
    setSearchMessage("");

    try {
      const result = await geocodeLocation(query);

      if (!result) {
        setSearchMessage("No matching location found.");
        return;
      }

      const latitude = Number(result.lat);
      const longitude = Number(result.lon);

      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        setSearchMessage("The search result did not include valid coordinates.");
        return;
      }

      setLatitudeInput(latitude.toFixed(6));
      setLongitudeInput(longitude.toFixed(6));
      setSearchMessage(result.display_name);
      navigateTo(latitude, longitude, mapSettings.buildingsEnabled ? 15 : 11.5);
    } catch {
      setSearchMessage("Location search failed. Try coordinates instead.");
    } finally {
      setIsSearching(false);
    }
  }

  function handleLocationSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const latitude = Number(latitudeInput);
    const longitude = Number(longitudeInput);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      setNavigationError("Enter numeric latitude and longitude values.");
      return;
    }

    if (latitude < -85 || latitude > 85 || longitude < -180 || longitude > 180) {
      setNavigationError("Latitude must be between -85 and 85. Longitude must be between -180 and 180.");
      return;
    }

    setNavigationError("");
    setSearchMessage("");
    navigateTo(latitude, longitude, mapSettings.buildingsEnabled ? 15.5 : 11.5);
  }

  if (activeConfig === "mqtt") {
    return (
      <MqttConfiguration
        settings={mqttSettings}
        status={mqttStatus}
        error={mqttError}
        receivedCount={mqttReceivedCount}
        acceptedCount={mqttAcceptedCount}
        rejectedCount={mqttRejectedCount}
        lastTopic={mqttLastTopic}
        subscribePulse={subscribePulse}
        onSettingsChange={onMqttSettingsChange}
      />
    );
  }

  return (
    <div className="drawer-content">
      <h2>Map Configuration</h2>
      <div className="map-source-summary">
        <span>Source</span>
        <strong>MapLibre GL JS</strong>
        <small>OpenStreetMap base tiles with optional terrain elevation and building extrusions.</small>
      </div>
      <div className="map-source-list" aria-label="Map display mode">
        {mapModes.map((mode) => (
          <button
            type="button"
            className={mapSettings.mode === mode.key ? "is-active" : ""}
            key={mode.key}
            onClick={() => onMapSettingsChange({ ...mapSettings, mode: mode.key })}
          >
            <Map size={18} />
            <span>
              <strong>{mode.label}</strong>
              <small>{mode.description}</small>
            </span>
          </button>
        ))}
      </div>

      <h2>Surface Options</h2>
      <div className="map-config-list">
        <label>
          <input
            type="checkbox"
            checked={mapSettings.buildingsEnabled}
            onChange={(event) =>
              onMapSettingsChange({ ...mapSettings, buildingsEnabled: event.currentTarget.checked })
            }
          />
          <span>Buildings</span>
        </label>
        <label>
          <input
            type="checkbox"
            checked={mapSettings.terrainEnabled}
            onChange={(event) =>
              onMapSettingsChange({ ...mapSettings, terrainEnabled: event.currentTarget.checked })
            }
          />
          <span>Terrain altitude</span>
        </label>
      </div>

      <h2>Quick Navigation</h2>
      <form className="location-search" onSubmit={handleLocationSearch}>
        <label>
          <span>Search position</span>
          <input
            placeholder="City, address, landmark"
            value={locationInput}
            onChange={(event) => setLocationInput(event.currentTarget.value)}
          />
        </label>
        <button type="submit" disabled={isSearching}>
          <Search size={17} />
          <span>{isSearching ? "Searching" : "Search"}</span>
        </button>
        {searchMessage ? <p>{searchMessage}</p> : null}
      </form>
      <form className="quick-navigation" onSubmit={handleLocationSubmit}>
        <label>
          <span>Latitude</span>
          <input
            inputMode="decimal"
            placeholder="40.7128"
            value={latitudeInput}
            onChange={(event) => setLatitudeInput(event.currentTarget.value)}
          />
        </label>
        <label>
          <span>Longitude</span>
          <input
            inputMode="decimal"
            placeholder="-74.0060"
            value={longitudeInput}
            onChange={(event) => setLongitudeInput(event.currentTarget.value)}
          />
        </label>
        <button type="submit">
          <LocateFixed size={17} />
          <span>Go</span>
        </button>
        {navigationError ? <p role="alert">{navigationError}</p> : null}
      </form>
    </div>
  );
}

function LoginScreen({
  settings,
  status,
  error,
  onSettingsChange,
  onConnect,
}: {
  settings: MqttSettings;
  status: MqttConnectionStatus;
  error: string;
  onSettingsChange: (settings: MqttSettings) => void;
  onConnect: () => void;
}) {
  function updateCredentials(key: "username" | "password", value: string) {
    onSettingsChange({ ...settings, [key]: value });
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onConnect();
  }

  return (
    <main className="login-screen">
      <section className="login-card" aria-labelledby="login-title">
        <ArenaLogo />
        <p className="login-eyebrow">Arena access</p>
        <h1 id="login-title">Connect to MQTT</h1>
        <p>Authenticate with the EMQX WebSocket broker to enter the arena and view its tracked topic entities.</p>
        <form onSubmit={submit} className="login-form">
          <label><span>Username</span><input autoComplete="username" value={settings.username} onChange={(event) => updateCredentials("username", event.currentTarget.value)} /></label>
          <label><span>Password</span><input autoComplete="current-password" type="password" value={settings.password} onChange={(event) => updateCredentials("password", event.currentTarget.value)} /></label>
          <small>Client name: <strong>syscraft_arena</strong></small>
          {error ? <p className="login-error" role="alert">{error}</p> : null}
          <button type="submit" disabled={status === "connecting"}>{status === "connecting" ? "Connecting…" : "Connect and enter arena"}</button>
        </form>
      </section>
    </main>
  );
}

export function App() {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isAssetsPanelOpen, setIsAssetsPanelOpen] = useState(false);
  const [hasEnteredArena, setHasEnteredArena] = useState(false);
  const [isLoginPending, setIsLoginPending] = useState(false);
  const [activeConfig, setActiveConfig] = useState<ConfigKey>("map");
  const [now, setNow] = useState(() => Date.now());
  const [entities, setEntities] = useState<ArenaEntity[]>([]);
  const [domainVisibility, setDomainVisibility] = useState<DomainVisibility>(defaultDomainVisibility);
  const [heartbeatSeconds, setHeartbeatSeconds] = useState(90);
  const [mqttSettings, setMqttSettings] = useState<MqttSettings>(() => loadSavedMqttSettings());
  const [mqttStatus, setMqttStatus] = useState<MqttConnectionStatus>("idle");
  const [mqttError, setMqttError] = useState("");
  const [mqttReceivedCount, setMqttReceivedCount] = useState(0);
  const [mqttAcceptedCount, setMqttAcceptedCount] = useState(0);
  const [mqttRejectedCount, setMqttRejectedCount] = useState(0);
  const [mqttLastTopic, setMqttLastTopic] = useState("");
  const [subscribePulse, setSubscribePulse] = useState(false);
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [mapSettings, setMapSettings] = useState<MapSettings>({
    mode: "2d",
    buildingsEnabled: true,
    terrainEnabled: true,
  });

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    setEntities((current) => {
      const active = current.filter((entity) => isEntityRetained(entity, now, heartbeatSeconds));
      return active.length === current.length ? current : active;
    });
  }, [heartbeatSeconds, now]);

  useEffect(() => {
    if (selectedEntityId && !entities.some((entity) => entity.id === selectedEntityId)) {
      setSelectedEntityId(null);
    }
  }, [entities, selectedEntityId]);

  useEffect(() => {
    window.localStorage.setItem(
      mqttSettingsStorageKey,
      JSON.stringify({
        subscribeRefreshSeconds: mqttSettings.subscribeRefreshSeconds,
      }),
    );
  }, [mqttSettings]);

  useEffect(() => {
    if (!mqttSettings.enabled) {
      setMqttStatus("idle");
      setMqttError("");
      return;
    }

    let disposed = false;
    const subscription = mqttSubscription(mqttSettings);

    setMqttStatus("connecting");
    setMqttError("");

    const client: MqttClient = mqtt.connect(mqttUrl(mqttSettings), {
      clientId: mqttSettings.clientId,
      username: mqttSettings.username || undefined,
      password: mqttSettings.password || undefined,
      clean: true,
      protocolVersion: 5,
      reconnectPeriod: 3000,
      connectTimeout: 8000,
    });

    client.on("connect", () => {
      if (disposed || !client) {
        return;
      }

      setMqttStatus("connected");
      setMqttError("");
      const refreshSubscription = () => client.subscribe(subscription, (error, granted) => {
        if (error) {
          disposed = true;
          setMqttStatus("error");
          setMqttError(describeMqttSubscribeError(error, subscription));
          client.end(true);
          return;
        }
        if (granted?.some((grant) => grant.qos === 128)) {
          disposed = true;
          setMqttStatus("error");
          setMqttError(`Broker denied subscription to ${subscription}. Check EMQX ACL/topic permissions.`);
          client.end(true);
          return;
        }
        setSubscribePulse(true);
        window.setTimeout(() => setSubscribePulse(false), 160);
      });
      refreshSubscription();
      const refreshInterval = window.setInterval(refreshSubscription, Math.max(100, mqttSettings.subscribeRefreshSeconds * 1000));
      client.once("close", () => window.clearInterval(refreshInterval));
    });

    client.on("reconnect", () => {
      if (!disposed) {
        setMqttStatus("connecting");
      }
    });

    client.on("message", (topic, payload) => {
      setMqttReceivedCount((count) => count + 1);
      setMqttLastTopic(topic);
      const update = arenaMqttUpdateFromMessage(topic, payload, mqttSettings.rootTopic);
      if (!update) {
        setMqttRejectedCount((count) => count + 1);
        return;
      }

      setMqttAcceptedCount((count) => count + 1);

      setEntities((current) => {
        if (update.kind === "heartbeat") {
          return current.map((entity) => entity.id === update.id
            ? { ...entity, lastSeenAt: update.lastSeenAt }
            : entity);
        }
        const existing = current.find((candidate) => candidate.id === update.entity.id);
        const next = current.filter((candidate) => candidate.id !== update.entity.id);
        return [...next, { ...update.entity, visible: existing?.visible ?? update.entity.visible }];
      });
    });

    client.on("error", (error) => {
      if (!disposed) {
        setMqttStatus("error");
        setMqttError(error.message);
      }
    });

    client.on("close", () => {
      if (!disposed) {
        setMqttStatus((status) => status === "error" ? "error" : "connecting");
      }
    });

    return () => {
      disposed = true;
      client.end(true);
    };
  }, [mqttSettings]);

  useEffect(() => {
    if (isLoginPending && mqttStatus === "connected") {
      setHasEnteredArena(true);
      setIsLoginPending(false);
    }
  }, [isLoginPending, mqttStatus]);

  const activeConfigLabel = useMemo(
    () => configItems.find((item) => item.key === activeConfig)?.label ?? "Map",
    [activeConfig],
  );

  const visibleEntities = useMemo(
    () =>
      entities.filter(
        (entity) =>
          entity.visible &&
          domainVisibility[entity.domain] &&
          isEntityRetained(entity, now, heartbeatSeconds),
      ),
    [domainVisibility, entities, heartbeatSeconds, now],
  );

  function handleDomainVisibilityChange(domain: EntityDomain, visible: boolean) {
    setDomainVisibility((current) => ({
      ...current,
      [domain]: visible,
    }));
  }

  function handleEntityVisibilityChange(entityId: string, visible: boolean) {
    setEntities((current) =>
      current.map((entity) => entity.id === entityId ? { ...entity, visible } : entity),
    );
  }

  function handleEntityInspect(entityId: string) {
    setSelectedEntityId((current) => current === entityId ? null : entityId);
  }

  function handleHeartbeatSecondsChange(seconds: number) {
    if (!Number.isFinite(seconds)) {
      return;
    }

    setHeartbeatSeconds(Math.min(300, Math.max(5, seconds)));
  }

  if (!hasEnteredArena) {
    return <LoginScreen settings={mqttSettings} status={mqttStatus} error={mqttError} onSettingsChange={setMqttSettings} onConnect={() => { setIsLoginPending(true); setMqttSettings((current) => ({ ...current, enabled: true })); }} />;
  }

  return (
    <main className={`arena-map-shell ${isPanelOpen ? "is-config-open" : ""}`}>
      <ArenaMap
        settings={mapSettings}
        entities={visibleEntities}
        defaultView={embryRiddleDaytonaView}
      />

      <button
        className="icon-button edge-trigger edge-trigger--config"
        type="button"
        aria-label="Open map and MQTT configurations"
        aria-expanded={isPanelOpen}
        onClick={() => setIsPanelOpen(true)}
      >
        <Settings2 size={22} strokeWidth={1.8} />
      </button>
      <button
        className="icon-button edge-trigger edge-trigger--assets"
        type="button"
        aria-label="Open MQTT asset inspector"
        aria-expanded={isAssetsPanelOpen}
        onClick={() => setIsAssetsPanelOpen(true)}
      >
        <PanelRightOpen size={22} strokeWidth={1.8} />
      </button>

      <aside className={`configuration-drawer ${isPanelOpen ? "is-open" : ""}`} aria-label={`${activeConfigLabel} configuration`}>
        <div className="drawer-header">
          <button
            className="drawer-collapse"
            type="button"
            aria-label="Close configurations"
            onClick={() => setIsPanelOpen(false)}
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <p>Configurations</p>
            <h2>{activeConfigLabel}</h2>
          </div>
          <button
            className="drawer-close"
            type="button"
            aria-label="Close configurations"
            onClick={() => setIsPanelOpen(false)}
          >
            <X size={18} />
          </button>
        </div>

        <div className="drawer-tabs" role="tablist" aria-label="Configuration types">
          {configItems.map((item) => (
            <button
              type="button"
              role="tab"
              aria-selected={activeConfig === item.key}
              className={activeConfig === item.key ? "is-active" : ""}
              key={item.key}
              onClick={() => setActiveConfig(item.key)}
            >
              <item.icon size={17} />
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        <MapConfiguration
          activeConfig={activeConfig}
          mapSettings={mapSettings}
          mqttSettings={mqttSettings}
          mqttStatus={mqttStatus}
          mqttError={mqttError}
          mqttReceivedCount={mqttReceivedCount}
          mqttAcceptedCount={mqttAcceptedCount}
          mqttRejectedCount={mqttRejectedCount}
          mqttLastTopic={mqttLastTopic}
          subscribePulse={subscribePulse}
          onMapSettingsChange={setMapSettings}
          onMqttSettingsChange={setMqttSettings}
        />
      </aside>

      {isAssetsPanelOpen ? (
        <aside className="asset-drawer is-open" aria-label="Asset management">
          <div className="drawer-header">
            <button className="drawer-collapse" type="button" aria-label="Close asset management" onClick={() => setIsAssetsPanelOpen(false)}><ChevronLeft size={20} /></button>
            <div><p>Tracked MQTT topics</p><h2>Assets</h2></div>
            <button className="drawer-close" type="button" aria-label="Close asset management" onClick={() => setIsAssetsPanelOpen(false)}><X size={18} /></button>
          </div>
          <AssetManagement entities={entities} domainVisibility={domainVisibility} heartbeatSeconds={heartbeatSeconds} now={now} selectedEntityId={selectedEntityId} onDomainVisibilityChange={handleDomainVisibilityChange} onEntityInspect={handleEntityInspect} onEntityVisibilityChange={handleEntityVisibilityChange} onHeartbeatSecondsChange={handleHeartbeatSecondsChange} />
        </aside>
      ) : null}

    </main>
  );
}
