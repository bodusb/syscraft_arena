import fs from "node:fs";
import path from "node:path";
import ms from "../frontend/node_modules/milsymbol/dist/milsymbol.js";

const outputDir = path.resolve("docs/assets/domain-catalog-icons");
fs.mkdirSync(outputDir, { recursive: true });

const symbols = {
  air: "130301000011010000000000000000",
  ground: "130315000016040000000000000000",
  surface: "130330000012050100000000000000",
  space: "130305000011070000000000000000",
  cyber: "130360000014010000000000000000",
  social: "130327000011010100000000000000",
};

for (const [domain, sidc] of Object.entries(symbols)) {
  const symbol = new ms.Symbol(sidc, { size: 96, outlineColor: "#071017", outlineWidth: 3 });
  fs.writeFileSync(path.join(outputDir, `${domain}.svg`), symbol.asSVG());
}
