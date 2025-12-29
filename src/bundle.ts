import type { GenerateOptions, OdrlPolicy, RegoModule } from "./types.js";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { generateRegoModule } from "./generator.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readHelper(rel: string): string {
    const p = path.resolve(__dirname, "..", "helpers", rel);
    return fs.readFileSync(p, "utf8");
}

export function buildBundle(policy: OdrlPolicy, opts: GenerateOptions = {}): RegoModule[] {
    const includeHelpers = opts.includeHelpers ?? true;

    const modules: RegoModule[] = [];
    modules.push({
        path: "policy.rego",
        content: generateRegoModule(policy, opts)
    });

    if (includeHelpers) {
        const helperFiles = ["action.rego", "assignee.rego", "target.rego", "operator.rego", "time.rego"];
        for (const f of helperFiles) {
            modules.push({
                path: `helpers/${f}`,
                content: readHelper(f)
            });
        }
    }

    return modules;
}

export function writeBundleToDir(modules: RegoModule[], outDir: string): void {
    for (const m of modules) {
        const full = path.join(outDir, m.path);
        fs.mkdirSync(path.dirname(full), { recursive: true });
        fs.writeFileSync(full, m.content, "utf8");
    }
}
