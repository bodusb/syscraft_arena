import { useEffect, useRef } from "react";
import maplibregl, { Map as MapLibreMap, Marker, StyleSpecification } from "maplibre-gl";
import { createMilSymbolElement } from "../symbology/milSymbol";
import { ArenaEntity } from "../types/entities";
import { MapSettings } from "../types/map";

type MapView = {
  latitude: number;
  longitude: number;
  zoom: number;
};

const DEFAULT_VIEW: MapView = {
  latitude: 29.1886,
  longitude: -81.0487,
  zoom: 15.35,
};

const ARENA_STYLE: StyleSpecification = {
  version: 8,
  projection: {
    type: "mercator",
  },
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "OpenStreetMap contributors",
      maxzoom: 19,
    },
    terrainDem: {
      type: "raster-dem",
      tiles: ["https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png"],
      tileSize: 256,
      maxzoom: 15,
      encoding: "terrarium",
      attribution: "Mapzen terrain tiles",
    },
    openfreemapBuildings: {
      type: "vector",
      url: "https://tiles.openfreemap.org/planet",
      attribution: "OpenFreeMap",
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

function ensureTerrainLayer(map: MapLibreMap) {
  if (map.getLayer("terrain-hillshade")) {
    return;
  }

  map.addLayer(
    {
      id: "terrain-hillshade",
      type: "hillshade",
      source: "terrainDem",
      paint: {
        "hillshade-shadow-color": "#172331",
        "hillshade-highlight-color": "#f5f3ea",
        "hillshade-accent-color": "#3f5b68",
      },
    },
    map.getLayer("osm-buildings-3d") ? "osm-buildings-3d" : undefined,
  );
}

function ensureBuildingLayer(map: MapLibreMap) {
  if (map.getLayer("osm-buildings-3d")) {
    return;
  }

  map.addLayer({
    id: "osm-buildings-3d",
    type: "fill-extrusion",
    source: "openfreemapBuildings",
    "source-layer": "building",
    minzoom: 14,
    filter: ["!=", ["get", "hide_3d"], true],
    paint: {
      "fill-extrusion-color": [
        "interpolate",
        ["linear"],
        ["coalesce", ["get", "render_height"], ["get", "height"], 12],
        0,
        "#87939b",
        200,
        "#4f8fce",
        400,
        "#9ed2f1",
      ],
      "fill-extrusion-height": [
        "interpolate",
        ["linear"],
        ["zoom"],
        15,
        0,
        16,
        ["coalesce", ["get", "render_height"], ["get", "height"], 12],
      ],
      "fill-extrusion-base": [
        "interpolate",
        ["linear"],
        ["zoom"],
        15,
        0,
        16,
        ["coalesce", ["get", "render_min_height"], 0],
      ],
      "fill-extrusion-opacity": 0.72,
    },
  });
}

function applyMapSettings(map: MapLibreMap, settings: MapSettings) {
  if (!map.isStyleLoaded()) {
    map.once("styledata", () => applyMapSettings(map, settings));
    return;
  }

  if (settings.mode === "3d") {
    map.setProjection({ type: "globe" });
  } else {
    map.setProjection({ type: "mercator" });
  }

  if (settings.terrainEnabled) {
    if (!map.getTerrain()) {
      map.setTerrain({ source: "terrainDem", exaggeration: 1.4 });
    }
    ensureTerrainLayer(map);
  } else {
    if (map.getLayer("terrain-hillshade")) {
      map.removeLayer("terrain-hillshade");
    }
    if (map.getTerrain()) {
      map.setTerrain(null);
    }
  }

  if (settings.buildingsEnabled) {
    ensureBuildingLayer(map);
  } else if (map.getLayer("osm-buildings-3d")) {
    map.removeLayer("osm-buildings-3d");
  }
}

function applyModeInteractionLock(map: MapLibreMap, mode: MapSettings["mode"]) {
  if (mode === "2d") {
    map.setMaxPitch(0);
    map.dragRotate.disable();
    map.touchZoomRotate.disableRotation();
    map.touchPitch.disable();
    map.setPitch(0);
    map.setBearing(0);
    return;
  }

  map.setMaxPitch(75);
  map.dragRotate.enable();
  map.touchZoomRotate.enableRotation();
  map.touchPitch.enable();
}

function applyModeCamera(map: MapLibreMap, mode: MapSettings["mode"], view: MapView, duration = 700) {
  if (mode === "3d") {
    map.easeTo({
      center: [view.longitude, view.latitude],
      zoom: Math.max(view.zoom, 15.6),
      pitch: 58,
      bearing: -18,
      duration,
    });
    return;
  }

  map.easeTo({
    center: [view.longitude, view.latitude],
    zoom: view.zoom,
    pitch: 0,
    bearing: 0,
    duration: 700,
  });
}

function createEntityBallElement(entity: ArenaEntity) {
  const element = document.createElement("button");
  element.type = "button";
  element.className = "entity-ball-marker";
  element.setAttribute("aria-label", `${entity.name}, heading ${Math.round(entity.headingDegrees ?? 0)} degrees`);
  const direction = document.createElement("span");
  direction.className = "entity-ball-marker__heading";
  element.append(direction);
  return element;
}

function altitudeOffset(map: MapLibreMap, entity: ArenaEntity): [number, number] {
  if (!entity.altitudeMeters || map.getPitch() === 0) {
    return [0, 0];
  }

  const terrainMetersAsl = map.queryTerrainElevation([entity.longitude, entity.latitude]) ?? 0;
  const heightAboveSurface = Math.max(0, entity.altitudeMeters - terrainMetersAsl);
  const metersPerPixel =
    (40075016.686 * Math.cos((map.getCenter().lat * Math.PI) / 180)) /
    (2 ** (map.getZoom() + 8));
  const verticalPixels =
    (heightAboveSurface / Math.max(metersPerPixel, 0.01)) * Math.sin((map.getPitch() * Math.PI) / 180);

  return [0, -Math.min(verticalPixels, 560)];
}

function syncEntityMarkers(
  map: MapLibreMap,
  entities: ArenaEntity[],
  markers: globalThis.Map<string, Marker>,
  mode: MapSettings["mode"],
) {
  markers.forEach((marker) => marker.remove());
  markers.clear();

  entities
    .filter((entity) => entity.visible && (mode === "3d" || entity.renderMode === "mil-symbol"))
    .forEach((entity) => {
      const is3d = mode === "3d";
      const symbol = is3d ? null : createMilSymbolElement(entity);
      const element = symbol?.element ?? createEntityBallElement(entity);
      const popupContent = document.createElement("div");
      popupContent.className = "mil-symbol-popup";
      const popupTitle = document.createElement("strong");
      popupTitle.textContent = entity.name;
      const popupTopic = document.createElement("span");
      popupTopic.textContent = entity.topic;
      popupContent.append(popupTitle, popupTopic);
      if (entity.altitudeMeters !== undefined) {
        const popupAltitude = document.createElement("span");
        popupAltitude.textContent = `Altitude ${entity.altitudeMeters.toLocaleString()} m ASL`;
        popupContent.append(popupAltitude);
      }
      const popup = new maplibregl.Popup({ closeButton: false, offset: 18 }).setDOMContent(popupContent);

      const marker = new maplibregl.Marker({
        element,
        offset: symbol?.offset ?? altitudeOffset(map, entity),
        rotation: is3d ? entity.headingDegrees ?? 0 : 0,
        rotationAlignment: is3d ? "map" : "auto",
        pitchAlignment: "viewport",
      })
        .setLngLat([entity.longitude, entity.latitude])
        .addTo(map);

      element.addEventListener("click", (event) => {
        event.stopPropagation();
        popup.setLngLat([entity.longitude, entity.latitude]).addTo(map);
      });
      markers.set(entity.id, marker);
    });
}

export function ArenaMap({
  settings,
  entities = [],
  defaultView = DEFAULT_VIEW,
}: {
  settings: MapSettings;
  entities?: ArenaEntity[];
  defaultView?: MapView;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const entityMarkersRef = useRef<globalThis.Map<string, Marker>>(new globalThis.Map());
  const initialSettingsRef = useRef(settings);
  const initialEntitiesRef = useRef(entities);
  const currentEntitiesRef = useRef(entities);
  const initialModeRef = useRef(settings.mode);
  const currentModeRef = useRef(settings.mode);
  const initialViewRef = useRef(defaultView);
  const previousModeRef = useRef(settings.mode);
  const previousNavigationTargetRef = useRef<number | null>(settings.navigationTarget?.id ?? null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) {
      return;
    }

    const markerStore = entityMarkersRef.current;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: ARENA_STYLE,
      center: [initialViewRef.current.longitude, initialViewRef.current.latitude],
      zoom: initialViewRef.current.zoom,
      pitch: initialModeRef.current === "3d" ? 58 : 0,
      bearing: initialModeRef.current === "3d" ? -18 : 0,
      attributionControl: { compact: true },
      logoPosition: "bottom-right",
      maxPitch: 75,
    });

    mapRef.current = map;

    map.once("load", () => {
      applyMapSettings(map, initialSettingsRef.current);
      applyModeInteractionLock(map, initialModeRef.current);
      applyModeCamera(map, initialModeRef.current, initialViewRef.current, 900);
      syncEntityMarkers(map, initialEntitiesRef.current, markerStore, initialModeRef.current);
      map.on("moveend", () => {
        syncEntityMarkers(map, currentEntitiesRef.current, markerStore, currentModeRef.current);
      });
    });

    return () => {
      markerStore.forEach((marker) => marker.remove());
      markerStore.clear();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current) {
      return;
    }

    currentEntitiesRef.current = entities;
    currentModeRef.current = settings.mode;
    applyMapSettings(mapRef.current, settings);
    applyModeInteractionLock(mapRef.current, settings.mode);

    if (previousModeRef.current !== settings.mode) {
      applyModeCamera(mapRef.current, settings.mode, defaultView);
      previousModeRef.current = settings.mode;
    }
    syncEntityMarkers(mapRef.current, entities, entityMarkersRef.current, settings.mode);
  }, [defaultView, entities, settings]);

  useEffect(() => {
    if (!mapRef.current) {
      return;
    }

    currentEntitiesRef.current = entities;
    currentModeRef.current = settings.mode;
    syncEntityMarkers(mapRef.current, entities, entityMarkersRef.current, settings.mode);
  }, [entities, settings.mode]);

  useEffect(() => {
    if (!mapRef.current || !settings.navigationTarget) {
      return;
    }

    if (previousNavigationTargetRef.current === settings.navigationTarget.id) {
      return;
    }

    previousNavigationTargetRef.current = settings.navigationTarget.id;
    mapRef.current.flyTo({
      center: [settings.navigationTarget.longitude, settings.navigationTarget.latitude],
      zoom: settings.navigationTarget.zoom,
      pitch: settings.mode === "3d" ? 48 : 0,
      bearing: settings.mode === "3d" ? -18 : 0,
      duration: 1200,
      essential: true,
    });
  }, [settings.navigationTarget, settings.mode]);

  return (
    <section className="map-stage maplibre-map-stage" aria-label="MapLibre arena map">
      <div ref={containerRef} className="maplibre-map-canvas" />
      <div className="map-vignette" aria-hidden="true" />
    </section>
  );
}
