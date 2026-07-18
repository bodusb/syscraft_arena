# Multi-Domain Simulation Arena --- Initial Development Plan

## Goal

Build the first working prototype of a web-based, plugin-driven
multi-domain simulation arena.

The system should separate:

1.  **Simulation engine** --- authoritative world state, entity loop,
    interactions.
2.  **Map/visualizer** --- renders entities, maps, tracks, and
    interactions.
3.  **Message bus** --- connects distributed simulators and services.
4.  **Plugin system** --- allows new domains, entities, behaviors, and
    UI tools to be added.

------------------------------------------------------------------------

## Phase 1 --- Minimal Docker Architecture

Create a Docker Compose project with these services:

``` text
frontend        React + TypeScript + CesiumJS
gateway         FastAPI backend
sim-core        Python simulation engine
mqtt            Eclipse Mosquitto broker
db              PostgreSQL + PostGIS
```

Suggested structure:

``` text
multidomain-arena/
  docker-compose.yml
  README.md

  frontend/
    package.json
    src/

  gateway/
    app/
      main.py
      schemas.py
      mqtt_client.py
      api.py

  sim-core/
    app/
      main.py
      engine.py
      entities.py
      systems.py
      plugins.py
      mqtt_client.py

  plugins/
    air-domain/
      manifest.json
      entities.json
    terrain-domain/
      manifest.json
      entities.json
    maritime-domain/
      manifest.json
      entities.json

  db/
    init.sql
```

------------------------------------------------------------------------

## Phase 2 --- Core Entity Model

Use a generic entity schema with identity, domain, type, position,
velocity, status, and metadata. The simulation engine maintains the
authoritative state.

------------------------------------------------------------------------

## Phase 3 --- Simulation Loop

Every simulation tick:

1.  Read inbound MQTT messages.
2.  Update entity states.
3.  Move internally simulated entities.
4.  Check proximity and simple collisions.
5.  Generate interaction events.
6.  Publish the authoritative world state.

Start with a 1--5 Hz fixed timestep.

------------------------------------------------------------------------

## Phase 4 --- MQTT Topics

    arena/entities/update
    arena/entities/state
    arena/events/interaction
    arena/events/collision
    arena/scenario/command
    arena/sim/status

Flow:

    External simulator → arena/entities/update → sim-core
    sim-core → arena/entities/state → gateway/frontend
    sim-core → arena/events/* → gateway/frontend
    frontend → arena/scenario/command → sim-core

------------------------------------------------------------------------

## Phase 5 --- Collision and Interaction Logic

Initially:

-   Proximity events based on configurable distance thresholds.
-   Collision events when entities overlap.
-   Approximate geodesic calculations are sufficient.

Later migrate to PostGIS and more advanced spatial indexing.

------------------------------------------------------------------------

## Phase 6 --- Plugin System

Each plugin provides:

-   Entity types
-   Visual assets
-   Simulation systems
-   UI panels
-   MQTT topics
-   Configuration

Initially, plugins may only contribute metadata. Later they will load
executable behavior.

------------------------------------------------------------------------

## Phase 7 --- Web Visualizer

Using CesiumJS:

-   Display the world map.
-   Subscribe to live entity updates.
-   Render moving entities.
-   Draw interaction links.
-   Show an event log.
-   Provide basic scenario controls.

------------------------------------------------------------------------

## Phase 8 --- Demonstration Scenario

Include:

-   1 drone
-   1 ground vehicle
-   1 boat
-   1 point of interest

Generate proximity and interaction events as entities move.

------------------------------------------------------------------------

## Phase 9 --- Documentation

The README should explain:

-   How to start the stack.
-   MQTT topic usage.
-   How to add a plugin.
-   How to create a new scenario.

------------------------------------------------------------------------

## Initial Development Priorities

1.  Docker Compose.
2.  MQTT broker.
3.  Simulation core.
4.  Cesium frontend.
5.  MQTT/WebSocket bridge.
6.  Collision events.
7.  Plugin loader.

Avoid implementing full physics, HLA, authentication, or cloud
deployment until the arena kernel is stable.

------------------------------------------------------------------------

## First Milestone

Running:

``` bash
docker compose up --build
```

should launch a browser-accessible arena that displays live moving
entities on a Cesium map, receives updates through MQTT, and visualizes
interactions and collision events.
