import { Activity, Boxes, Cable, Clock3, PlugZap, RadioTower } from "lucide-react";
import { Edge, Node } from "@xyflow/react";

export type RuntimeNodeKind =
  | "kernel"
  | "model"
  | "plugin"
  | "bus"
  | "gateway"
  | "visual"
  | "simulator"
  | "physical"
  | "agent"
  | "thread"
  | "time"
  | "layer";

export type RuntimeNodeData = {
  label: string;
  type: string;
  kind: RuntimeNodeKind;
  description: string;
};

export const runtimeFacts = [
  { label: "Authority", value: "Arena Kernel", icon: Boxes },
  { label: "State Flow", value: "Events", icon: RadioTower },
  { label: "Extensibility", value: "Plugins", icon: PlugZap },
  { label: "Execution", value: "Fixed Step", icon: Clock3 },
  { label: "Clients", value: "Non-authoritative", icon: Cable },
  { label: "Replay", value: "Digital Thread", icon: Activity },
] as const;

export const arenaLayers = [
  { name: "Physical", color: "#42d1a7" },
  { name: "Cyber", color: "#4fa6ff" },
  { name: "Human", color: "#f0c96a" },
  { name: "Information", color: "#f27d72" },
  { name: "Electromagnetic", color: "#b488ff" },
  { name: "Environmental", color: "#77c16b" },
] as const;

export const initialNodes: Node<RuntimeNodeData>[] = [
  {
    id: "kernel",
    type: "runtime",
    position: { x: 420, y: 230 },
    data: {
      label: "Arena Runtime Kernel",
      type: "Authoritative Core",
      kind: "kernel",
      description: "Owns time, entity registry, interaction rules, event generation, and world state.",
    },
  },
  {
    id: "time",
    type: "runtime",
    position: { x: 430, y: 30 },
    data: {
      label: "Simulation Clock",
      type: "Temporal Control",
      kind: "time",
      description: "Coordinates deterministic ticks, replay boundaries, and scheduler cadence.",
    },
  },
  {
    id: "model",
    type: "runtime",
    position: { x: 90, y: 120 },
    data: {
      label: "Executable Model",
      type: "OPM-Native Path",
      kind: "model",
      description: "Turns objects, processes, relationships, and events into runtime instructions.",
    },
  },
  {
    id: "plugins",
    type: "runtime",
    position: { x: 90, y: 360 },
    data: {
      label: "Plugin Host",
      type: "Domain Extension",
      kind: "plugin",
      description: "Loads entity types, behaviors, UI panels, visual assets, and configuration.",
    },
  },
  {
    id: "layers",
    type: "runtime",
    position: { x: 430, y: 465 },
    data: {
      label: "Composable Layers",
      type: "Multi-Domain World",
      kind: "layer",
      description: "Represents physical, cyber, human, information, electromagnetic, and environmental layers.",
    },
  },
  {
    id: "event-bus",
    type: "runtime",
    position: { x: 760, y: 220 },
    data: {
      label: "Event Bus",
      type: "Messaging Surface",
      kind: "bus",
      description: "Carries entity updates, authoritative state, collisions, interactions, and scenario commands.",
    },
  },
  {
    id: "gateway",
    type: "runtime",
    position: { x: 1050, y: 130 },
    data: {
      label: "Gateway API",
      type: "Client Bridge",
      kind: "gateway",
      description: "Exposes runtime state to web, XR, telemetry, and external orchestration clients.",
    },
  },
  {
    id: "visual-clients",
    type: "runtime",
    position: { x: 1330, y: 70 },
    data: {
      label: "Visualization Clients",
      type: "Non-Authoritative",
      kind: "visual",
      description: "Render the state without becoming the source of truth.",
    },
  },
  {
    id: "external-sims",
    type: "runtime",
    position: { x: 1060, y: 350 },
    data: {
      label: "External Simulators",
      type: "Federated Inputs",
      kind: "simulator",
      description: "Publish observations that Arena accepts, validates, and resolves into authoritative state.",
    },
  },
  {
    id: "physical-assets",
    type: "runtime",
    position: { x: 1325, y: 325 },
    data: {
      label: "Physical Assets",
      type: "Live World Inputs",
      kind: "physical",
      description: "Represent drones, vehicles, labs, sensors, and field systems.",
    },
  },
  {
    id: "ai-agents",
    type: "runtime",
    position: { x: 760, y: 20 },
    data: {
      label: "AI Agents",
      type: "Runtime Participants",
      kind: "agent",
      description: "Observe, plan, command, and explain behavior through controlled runtime interfaces.",
    },
  },
  {
    id: "digital-thread",
    type: "runtime",
    position: { x: 760, y: 470 },
    data: {
      label: "Digital Thread",
      type: "Replay and Trace",
      kind: "thread",
      description: "Preserves state evolution, event provenance, and execution history for triplets.",
    },
  },
];

export const initialEdges: Edge[] = [
  { id: "time-kernel", source: "time", target: "kernel", label: "ticks" },
  { id: "model-kernel", source: "model", target: "kernel", label: "executes" },
  { id: "plugins-kernel", source: "plugins", target: "kernel", label: "extends" },
  { id: "layers-kernel", source: "layers", target: "kernel", label: "composes" },
  { id: "kernel-bus", source: "kernel", target: "event-bus", label: "publishes" },
  { id: "bus-kernel", source: "event-bus", target: "kernel", label: "commands" },
  { id: "bus-gateway", source: "event-bus", target: "gateway", label: "streams" },
  { id: "gateway-visual", source: "gateway", target: "visual-clients", label: "renders" },
  { id: "external-bus", source: "external-sims", target: "event-bus", label: "observes" },
  { id: "physical-bus", source: "physical-assets", target: "event-bus", label: "telemetry" },
  { id: "agents-kernel", source: "ai-agents", target: "kernel", label: "plans" },
  { id: "bus-thread", source: "event-bus", target: "digital-thread", label: "records" },
];
