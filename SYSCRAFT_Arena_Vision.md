# SysCraft Arena Runtime Vision

## Vision

SysCraft Arena is **not just a simulator**. It is an operating system
for distributed System-of-Systems simulation.

Its purpose is to execute model-based descriptions of complex systems
using a plugin-driven runtime capable of federating multiple simulators,
physical assets, AI agents, and visualization clients.

The long-term goal is to make the model itself executable.

## Architectural Philosophy

The ecosystem consists of:

-   SysCraft Studio --- modeling, DSLs, editors, AI assistance.
-   SysCraft Runtime --- messaging, digital thread, APIs.
-   SysCraft Arena Runtime --- authoritative execution engine.
-   XR, web, and physical laboratories as visualization and interaction
    clients.

## Core Principles

The Arena kernel understands only:

-   Entity
-   Component
-   Event
-   Relationship
-   Time
-   Plugin

Everything else is implemented as plugins.

## Layered World Model

Instead of fixed simulation domains, Arena supports composable layers:

-   Physical (terrain, water, air, space)
-   Cyber
-   Human
-   Information
-   Electromagnetic
-   Environmental

Each layer is independently extensible.

## OPM-Native Execution

Arena should ultimately execute OPM concepts directly.

Objects become executable entities.

Processes become executable behaviors.

Relationships become runtime constraints.

Events drive simulation time.

The modeling language becomes the authoritative source of execution.

## Long-Term Objective

Create the first model-native distributed simulation platform where an
OPM model is simultaneously:

-   the design model,
-   the execution model,
-   the digital thread,
-   the visualization source,
-   and the foundation for Digital Triplets.
