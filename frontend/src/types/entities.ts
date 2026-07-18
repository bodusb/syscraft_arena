import type { SymbolOptions } from "milsymbol";

export type EntityRenderMode = "mil-symbol" | "generic-3d" | "scaled-3d-model";

export type EntityAffiliation = "friend" | "hostile" | "neutral" | "unknown";

export type EntityDomain = "surface" | "ground" | "air" | "space" | "cyber" | "social";

export type ArenaEntity = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  /** Single supported vertical datum: altitude above mean sea level (ASL), in meters. */
  altitudeMeters?: number;
  headingDegrees?: number;
  sidc: string;
  symbology?: SymbolOptions;
  affiliation: EntityAffiliation;
  domain: EntityDomain;
  systemType: string;
  assetType: string;
  topic: string;
  rawPayload?: string;
  lastSeenAt: number;
  visible: boolean;
  renderMode: EntityRenderMode;
  modelUri?: string;
};
