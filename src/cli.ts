import fs from "node:fs";
import path from "node:path";
import { buildBundle, writeBundleToDir } from "./bundle.js";
import { generateRegoModule } from "./generator.js";
import type { OdrlPolicy } from "./types.js";

function usage(): never {
    console.error(`
Usage:
  odrl-to-rego <policy.json> [--out <path>] [--bundle]

Examples:
  odrl-to-rego policy.json
  odrl-to-rego policy.json --out policy.rego
  odrl-to-rego policy.json --bundle --out ./bundle
`);
    process.exit(1);
}

const args = process.argv.slice(2);
if (args.length === 0) usage();

const inputFile = args[0];
let outPath = "";
let bundle = false;

for (let i = 1; i < args.length; i++) {
    const a = args[i];
    if (a === "--out") {
        outPath = args[++i] ?? "";
    } else if (a === "--bundle") {
        bundle = true;
    } else {
        usage();
    }
}

const raw = fs.readFileSync(inputFile, "utf8");
const policy = JSON.parse(raw) as OdrlPolicy;

if (bundle) {
    const dir = outPath || "./bundle";
    const modules = buildBundle(policy, { includeHelpers: true });
    writeBundleToDir(modules, dir);
    console.log(`Wrote OPA bundle to ${path.resolve(dir)}`);
} else {
    const rego = generateRegoModule(policy, {});
    if (outPath) {
        fs.writeFileSync(outPath, rego, "utf8");
        console.log(`Wrote Rego module to ${path.resolve(outPath)}`);
    } else {
        process.stdout.write(rego + "\n");
    }
}
