# Architecture Decision Record 0001

## Title

Arena Runtime is the Authoritative World State

## Decision

The visualization layer is never authoritative.

External simulators publish observations.

The Arena Runtime owns:

-   simulation time
-   entity registry
-   interaction rules
-   collision detection
-   event generation
-   authoritative world state

Visualization clients only render the state.

## Rationale

This enables:

-   deterministic execution
-   replay
-   distributed simulation
-   multiple synchronized visualizers
-   future AI orchestration
-   Digital Triplets
