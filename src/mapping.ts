import type { MappingSpec } from "./types";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** Load the default mapping.json shipped with the package. */
export function loadDefaultMapping(): MappingSpec {
    const mappingPath = path.resolve(__dirname, "..", "mapping.json");
    const raw = fs.readFileSync(mappingPath, "utf8");
    return JSON.parse(raw) as MappingSpec;
}
