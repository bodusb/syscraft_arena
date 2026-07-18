import React, { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { createRoot } from "react-dom/client";
import maplibregl, { Map as MapLibreMap, Marker, StyleSpecification, type GeoJSONSource } from "maplibre-gl";
import type { FeatureCollection, Point, Polygon } from "geojson";
import {
  Activity,
  CircleDot,
  Eye,
  EyeOff,
  Globe2,
  Pause,
  Play,
  Plus,
  RadioTower,
  RefreshCw,
  Trash2,
} from "lucide-react";
import "maplibre-gl/dist/maplibre-gl.css";
import "./styles.css";

type TrackingArea = {
  id: string;
  label: string;
  latitude: number;
  longitude: number;
  radiusKm: number;
  enabled: boolean;
  coneVisible: boolean;
};

type MqttSettings = {
  protocol: "ws" | "wss";
  host: string;
  port: number;
  path: string;
  rootTopic: string;
  username: string;
  password: string;
};

type Aircraft = {
  icao24: string;
  callsign: string;
  latitude: number;
  longitude: number;
  geoAltitudeMeters?: number;
  baroAltitudeMeters?: number;
  velocityMetersPerSecond?: number;
  trueTrackDegrees?: number;
  sourceAreaLabel: string;
  distanceFromAreaKm: number;
};

type PublishResult = {
  aircraft: Aircraft[];
  published?: number;
  topics?: string[];
  fetchedAt: number;
  error?: string;
};

const defaultView = {
  latitude: 29.1886,
  longitude: -81.0487,
  zoom: 8,
};

const mapStyle: StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "OpenStreetMap contributors",
      maxzoom: 19,
    },
  },
  layers: [
    {
      id: "osm-base",
      type: "raster",
      source: "osm",
      minzoom: 0,
      maxzoom: 19,
    },
  ],
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function circlePolygon(area: TrackingArea, points = 80) {
  const coordinates: number[][] = [];
  const earthRadiusKm = 6371;
  const lat = area.latitude * Math.PI / 180;
  const lon = area.longitude * Math.PI / 180;
  const angularDistance = area.radiusKm / earthRadiusKm;

  for (let index = 0; index <= points; index += 1) {
    const bearing = 2 * Math.PI * index / points;
    const pointLat = Math.asin(
      Math.sin(lat) * Math.cos(angularDistance) +
      Math.cos(lat) * Math.sin(angularDistance) * Math.cos(bearing),
    );
    const pointLon = lon + Math.atan2(
      Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(lat),
      Math.cos(angularDistance) - Math.sin(lat) * Math.sin(pointLat),
    );
    coordinates.push([pointLon * 180 / Math.PI, pointLat * 180 / Math.PI]);
  }

  return coordinates;
}

function areasToGeoJson(areas: TrackingArea[]): FeatureCollection<Polygon> {
  return {
    type: "FeatureCollection",
    features: areas
      .filter((area) => area.enabled && area.coneVisible)
      .map((area) => ({
        type: "Feature",
        properties: {
          id: area.id,
          label: area.label,
          radiusKm: area.radiusKm,
        },
        geometry: {
          type: "Polygon",
          coordinates: [circlePolygon(area)],
        },
      })),
  };
}

function aircraftToGeoJson(aircraft: Aircraft[]): FeatureCollection<Point> {
  return {
    type: "FeatureCollection",
    features: aircraft.map((item) => ({
      type: "Feature",
      properties: {
        id: item.icao24,
        label: item.callsign || item.icao24,
      },
      geometry: {
        type: "Point",
        coordinates: [item.longitude, item.latitude],
      },
    })),
  };
}

function mqttOutputUrl(settings: MqttSettings) {
  const normalizedPath = settings.path.startsWith("/") ? settings.path : `/${settings.path}`;
  return `${settings.protocol}://${settings.host}:${settings.port}${normalizedPath}`;
}

function createAreaMarker(area: TrackingArea) {
  const element = document.createElement("div");
  element.className = "area-marker";
  element.textContent = area.label.slice(0, 2).toUpperCase();
  return new maplibregl.Marker({ element }).setLngLat([area.longitude, area.latitude]);
}

export function App() {
  const [areas, setAreas] = useState<TrackingArea[]>([
    {
      id: "daytona",
      label: "Daytona ADS-B",
      latitude: defaultView.latitude,
      longitude: defaultView.longitude,
      radiusKm: 35,
      enabled: true,
      coneVisible: true,
    },
  ]);
  const [draft, setDraft] = useState({ label: "ADS-B area", latitude: "29.1886", longitude: "-81.0487", radiusKm: "35" });
  const [mqttSettings, setMqttSettings] = useState<MqttSettings>({
    protocol: "ws",
    host: "mqtt.conceptio.cloud",
    port: 8083,
    path: "/mqtt",
    rootTopic: "syscraft/arena",
    username: "chris",
    password: "",
  });
  const [aircraft, setAircraft] = useState<Aircraft[]>([]);
  const [lastResult, setLastResult] = useState<PublishResult | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [pollIntervalSeconds, setPollIntervalSeconds] = useState(5);
  const [isWorking, setIsWorking] = useState(false);
  const [message, setMessage] = useState("Click the map or type coordinates to define OpenSky ADS-B intake areas.");
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const areaMarkersRef = useRef<Map<string, Marker>>(new Map());
  const areaCountRef = useRef(areas.length);
  const draftRadiusRef = useRef(draft.radiusKm);

  const enabledAreas = useMemo(() => areas.filter((area) => area.enabled), [areas]);

  useEffect(() => {
    let ignore = false;

    async function loadDefaultMqttSettings() {
      try {
        const response = await fetch("/api/health");
        const data = await response.json() as { defaultMqtt?: Partial<MqttSettings> };
        if (!ignore && data.defaultMqtt) {
          const defaultMqtt = data.defaultMqtt;
          setMqttSettings((current) => ({
            ...current,
            ...defaultMqtt,
            protocol: defaultMqtt.protocol === "wss" ? "wss" : "ws",
            port: Number(defaultMqtt.port ?? current.port),
            path: defaultMqtt.path || current.path,
            username: defaultMqtt.username || current.username,
            password: defaultMqtt.password || current.password,
          }));
        }
      } catch {
        // Keep the built-in defaults if the API is not reachable yet.
      }
    }

    void loadDefaultMqttSettings();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    areaCountRef.current = areas.length;
  }, [areas.length]);

  useEffect(() => {
    draftRadiusRef.current = draft.radiusKm;
  }, [draft.radiusKm]);

  const addArea = useCallback((label: string, latitude: number, longitude: number, radiusKm: number) => {
    const nextArea: TrackingArea = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
      label: label.trim() || "ADS-B area",
      latitude: clamp(latitude, -85, 85),
      longitude: clamp(longitude, -180, 180),
      radiusKm: clamp(radiusKm, 1, 250),
      enabled: true,
      coneVisible: true,
    };

    setAreas((current) => [...current, nextArea]);
    mapRef.current?.easeTo({
      center: [nextArea.longitude, nextArea.latitude],
      zoom: Math.max(mapRef.current.getZoom(), 7.4),
      duration: 550,
    });
  }, []);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) {
      return;
    }

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: mapStyle,
      center: [defaultView.longitude, defaultView.latitude],
      zoom: defaultView.zoom,
    });

    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-right");
    map.on("load", () => {
      map.addSource("areas", {
        type: "geojson",
        data: areasToGeoJson([]),
      });
      map.addLayer({
        id: "areas-fill",
        type: "fill",
        source: "areas",
        paint: {
          "fill-color": "#f4f8fb",
          "fill-opacity": 0.22,
        },
      });
      map.addLayer({
        id: "areas-outline",
        type: "line",
        source: "areas",
        paint: {
          "line-color": "#42d1a7",
          "line-width": 2,
          "line-opacity": 0.82,
        },
      });
      map.addSource("aircraft", {
        type: "geojson",
        data: aircraftToGeoJson([]),
      });
      map.addLayer({
        id: "aircraft-dots",
        type: "circle",
        source: "aircraft",
        paint: {
          "circle-color": "#4fa6ff",
          "circle-radius": 5,
          "circle-stroke-color": "#f5f9fb",
          "circle-stroke-width": 1,
        },
      });
    });
    map.on("click", (event) => {
      const radiusKm = Number(draftRadiusRef.current);
      const label = `Area ${areaCountRef.current + 1}`;
      setDraft({
        label,
        latitude: event.lngLat.lat.toFixed(5),
        longitude: event.lngLat.lng.toFixed(5),
        radiusKm: draftRadiusRef.current,
      });
      addArea(label, event.lngLat.lat, event.lngLat.lng, Number.isFinite(radiusKm) ? radiusKm : 35);
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [addArea]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map?.isStyleLoaded()) {
      return;
    }

    const source = map.getSource("areas") as GeoJSONSource | undefined;
    source?.setData(areasToGeoJson(areas));

    areaMarkersRef.current.forEach((marker) => marker.remove());
    areaMarkersRef.current.clear();
    areas.forEach((area) => {
      if (!area.enabled) {
        return;
      }
      const marker = createAreaMarker(area).addTo(map);
      areaMarkersRef.current.set(area.id, marker);
    });
  }, [areas]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map?.isStyleLoaded()) {
      return;
    }

    const source = map.getSource("aircraft") as GeoJSONSource | undefined;
    source?.setData(aircraftToGeoJson(aircraft));
  }, [aircraft]);

  function handleAddArea(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const latitude = Number(draft.latitude);
    const longitude = Number(draft.longitude);
    const radiusKm = Number(draft.radiusKm);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || !Number.isFinite(radiusKm)) {
      setMessage("Enter valid latitude, longitude, and radius values.");
      return;
    }

    addArea(draft.label, latitude, longitude, radiusKm);
    setMessage("Tracking area added.");
  }

  function updateArea(id: string, patch: Partial<TrackingArea>) {
    setAreas((current) =>
      current.map((area) => area.id === id ? { ...area, ...patch } : area),
    );
  }

  function removeArea(id: string) {
    setAreas((current) => current.filter((area) => area.id !== id));
  }

  const requestOpenSky = useCallback(async (path: "preview" | "publish") => {
    setIsWorking(true);
    setMessage(path === "publish" ? "Fetching OpenSky and publishing to MQTT..." : "Fetching OpenSky preview...");

    try {
      const response = await fetch(`/api/opensky/${path}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          areas: enabledAreas,
          mqtt: mqttSettings,
        }),
      });

      const result = await response.json() as PublishResult;
      if (!response.ok) {
        throw new Error(result.error ?? "OpenSky request failed.");
      }

      setAircraft(result.aircraft ?? []);
      setLastResult(result);
      setMessage(
        path === "publish"
          ? `Published ${result.published ?? 0} aircraft across ${enabledAreas.length} active areas.`
          : `Preview loaded ${result.aircraft?.length ?? 0} aircraft across ${enabledAreas.length} active areas.`,
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Request failed.");
    } finally {
      setIsWorking(false);
    }
  }, [enabledAreas, mqttSettings]);

  const runPreview = useCallback(async () => {
    await requestOpenSky("preview");
  }, [requestOpenSky]);

  const runPublish = useCallback(async () => {
    await requestOpenSky("publish");
  }, [requestOpenSky]);

  useEffect(() => {
    if (!isPolling) {
      return;
    }

    let disposed = false;
    let timeoutId: number | undefined;
    const intervalMs = clamp(pollIntervalSeconds, 5, 300) * 1000;

    async function poll() {
      await runPublish();
      if (!disposed) {
        timeoutId = window.setTimeout(() => {
          void poll();
        }, intervalMs);
      }
    }

    void poll();

    return () => {
      disposed = true;
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [isPolling, pollIntervalSeconds, runPublish]);

  return (
    <main className="adsb-shell">
      <section className="map-panel">
        <div className="map-toolbar">
          <div>
            <strong>SysCraft ADS-B Broker</strong>
            <span>OpenSky intake areas to MQTT arena entities</span>
          </div>
          <div className="map-toolbar__actions">
            <button type="button" onClick={runPreview} disabled={isWorking || enabledAreas.length === 0}>
              <RefreshCw size={15} />
              <span>Preview</span>
            </button>
            <button type="button" onClick={() => setIsPolling((current) => !current)} disabled={enabledAreas.length === 0}>
              {isPolling ? <Pause size={15} /> : <Play size={15} />}
              <span>{isPolling ? "Stop" : `Poll ${pollIntervalSeconds}s`}</span>
            </button>
          </div>
        </div>
        <div className="adsb-map" ref={mapContainerRef} />
      </section>

      <aside className="control-panel">
        <div className="status-strip">
          <div>
            <Activity size={18} />
            <span>{aircraft.length}</span>
            <small>aircraft</small>
          </div>
          <div>
            <CircleDot size={18} />
            <span>{enabledAreas.length}</span>
            <small>active areas</small>
          </div>
          <div>
            <RadioTower size={18} />
            <span>{lastResult?.published ?? 0}</span>
            <small>last publish</small>
          </div>
        </div>

        <form className="area-form" onSubmit={handleAddArea}>
          <h2>Tracking Area</h2>
          <label>
            <span>Label</span>
            <input value={draft.label} onChange={(event) => setDraft({ ...draft, label: event.currentTarget.value })} />
          </label>
          <div className="form-grid">
            <label>
              <span>Latitude</span>
              <input inputMode="decimal" value={draft.latitude} onChange={(event) => setDraft({ ...draft, latitude: event.currentTarget.value })} />
            </label>
            <label>
              <span>Longitude</span>
              <input inputMode="decimal" value={draft.longitude} onChange={(event) => setDraft({ ...draft, longitude: event.currentTarget.value })} />
            </label>
          </div>
          <label>
            <span>Radius {draft.radiusKm} km</span>
            <input
              type="range"
              min={1}
              max={250}
              value={draft.radiusKm}
              onChange={(event) => setDraft({ ...draft, radiusKm: event.currentTarget.value })}
            />
          </label>
          <button type="submit">
            <Plus size={15} />
            <span>Add area</span>
          </button>
        </form>

        <section className="area-list">
          <h2>Tracked Areas</h2>
          {areas.map((area) => (
            <article key={area.id} className={area.enabled ? "" : "is-muted"}>
              <div>
                <strong>{area.label}</strong>
                <small>{area.latitude.toFixed(4)}, {area.longitude.toFixed(4)} / {area.radiusKm} km</small>
              </div>
              <button
                type="button"
                aria-label={`${area.enabled ? "Disable" : "Enable"} ${area.label}`}
                onClick={() => updateArea(area.id, { enabled: !area.enabled })}
              >
                {area.enabled ? <Play size={14} /> : <Pause size={14} />}
              </button>
              <button
                type="button"
                aria-label={`${area.coneVisible ? "Hide" : "Show"} ${area.label} cone`}
                onClick={() => updateArea(area.id, { coneVisible: !area.coneVisible })}
              >
                {area.coneVisible ? <Eye size={14} /> : <EyeOff size={14} />}
              </button>
              <button type="button" aria-label={`Remove ${area.label}`} onClick={() => removeArea(area.id)}>
                <Trash2 size={14} />
              </button>
            </article>
          ))}
        </section>

        <section className="mqtt-panel">
          <h2>MQTT Output</h2>
          <div className="mqtt-target">
            <span>{mqttOutputUrl(mqttSettings)}</span>
            <small>{mqttSettings.rootTopic.replace(/\/+$/g, "")}/#</small>
          </div>
          {mqttSettings.username && !mqttSettings.password ? (
            <p className="mqtt-warning">Password required for user {mqttSettings.username} before publish.</p>
          ) : null}
          <div className="form-grid">
            <label>
              <span>Protocol</span>
              <select
                value={mqttSettings.protocol}
                onChange={(event) =>
                  setMqttSettings({
                    ...mqttSettings,
                    protocol: event.currentTarget.value as MqttSettings["protocol"],
                    port: event.currentTarget.value === "wss" ? 8084 : 8083,
                  })
                }
              >
                <option value="ws">ws</option>
                <option value="wss">wss</option>
              </select>
            </label>
            <label>
              <span>Host</span>
              <input value={mqttSettings.host} onChange={(event) => setMqttSettings({ ...mqttSettings, host: event.currentTarget.value })} />
            </label>
            <label>
              <span>Port</span>
              <input
                type="number"
                min={1}
                max={65535}
                value={mqttSettings.port}
                onChange={(event) => setMqttSettings({ ...mqttSettings, port: Number(event.currentTarget.value) })}
              />
            </label>
            <label>
              <span>Path</span>
              <input value={mqttSettings.path} onChange={(event) => setMqttSettings({ ...mqttSettings, path: event.currentTarget.value })} />
            </label>
          </div>
          <label>
            <span>Root topic</span>
            <input value={mqttSettings.rootTopic} onChange={(event) => setMqttSettings({ ...mqttSettings, rootTopic: event.currentTarget.value })} />
          </label>
          <label>
            <span>Polling rate {pollIntervalSeconds}s</span>
            <input
              type="range"
              min={5}
              max={300}
              step={5}
              value={pollIntervalSeconds}
              onChange={(event) => setPollIntervalSeconds(Number(event.currentTarget.value))}
            />
          </label>
          <label>
            <span>Polling seconds</span>
            <input
              type="number"
              min={5}
              max={300}
              step={5}
              value={pollIntervalSeconds}
              onChange={(event) => setPollIntervalSeconds(clamp(Number(event.currentTarget.value), 5, 300))}
            />
          </label>
          <div className="form-grid">
            <label>
              <span>Username</span>
              <input
                autoComplete="username"
                value={mqttSettings.username}
                onChange={(event) => setMqttSettings({ ...mqttSettings, username: event.currentTarget.value })}
              />
            </label>
            <label>
              <span>Password</span>
              <input
                autoComplete="current-password"
                type="password"
                value={mqttSettings.password}
                onChange={(event) => setMqttSettings({ ...mqttSettings, password: event.currentTarget.value })}
              />
            </label>
          </div>
          <button type="button" onClick={runPublish} disabled={isWorking || enabledAreas.length === 0}>
            <Globe2 size={15} />
            <span>{isWorking ? "Working" : "Publish now"}</span>
          </button>
        </section>

        <section className="aircraft-list">
          <h2>Latest Aircraft</h2>
          {aircraft.slice(0, 12).map((item) => (
            <article key={item.icao24}>
              <strong>{item.callsign || item.icao24}</strong>
              <span>{item.distanceFromAreaKm} km / {Math.round(item.geoAltitudeMeters ?? item.baroAltitudeMeters ?? 0).toLocaleString()} m</span>
            </article>
          ))}
          {!aircraft.length ? <p>{message}</p> : <p>{message}</p>}
        </section>
      </aside>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
