import ms from "milsymbol";
import { ArenaEntity } from "../types/entities";

const affiliationColors: Record<ArenaEntity["affiliation"], string> = {
  friend: "#42d1a7",
  hostile: "#f27d72",
  neutral: "#f0c96a",
  unknown: "#9fb0bf",
};

export function createMilSymbolElement(entity: ArenaEntity) {
  const symbol = new ms.Symbol(entity.sidc, {
    size: 38,
    direction: entity.symbology?.direction ?? entity.headingDegrees,
    outlineColor: "#071017",
    outlineWidth: 4,
    ...entity.symbology,
  });

  const element = document.createElement("button");
  element.className = "mil-symbol-marker";
  element.type = "button";
  element.ariaLabel = `${entity.name}, ${entity.domain}, ${entity.affiliation}`;
  element.dataset.entityId = entity.id;
  element.dataset.topic = entity.topic;
  element.style.setProperty("--entity-color", affiliationColors[entity.affiliation]);
  element.innerHTML = symbol.asSVG();

  const anchor = symbol.getAnchor();
  const size = symbol.getSize();

  return {
    element,
    offset: [size.width / 2 - anchor.x, size.height / 2 - anchor.y] as [number, number],
  };
}
