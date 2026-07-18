export type MapMode = "2d" | "3d";

export type MapNavigationTarget = {
  id: number;
  latitude: number;
  longitude: number;
  zoom: number;
};

export type MapSettings = {
  mode: MapMode;
  buildingsEnabled: boolean;
  terrainEnabled: boolean;
  navigationTarget?: MapNavigationTarget;
};
