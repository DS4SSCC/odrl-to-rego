# @ds4sscc/odrl-to-rego

Translate ODRL policies to Rego modules for Open Policy Agent (OPA), using a mapping-based generator and reusable helper
Rego functions (ODRL-PAP inspired).

## Install

```bash
npm i @ds4sscc/odrl-to-rego
# plus your ODRL typings
npm i node-odrl
````

## CLI

```bash
odrl-to-rego policy.json > policy.rego
odrl-to-rego policy.json --out policy.rego
odrl-to-rego policy.json --bundle --out ./bundle
```

## Library

```ts
import {generateRegoModule, buildBundle, writeBundleToDir} from "@ds4sscc/odrl-to-rego";

const policy = JSON.parse(fs.readFileSync("policy.json", "utf8"));

const rego = generateRegoModule(policy, {packageName: "odrl.generated"});

const bundle = buildBundle(policy, {includeHelpers: true});
writeBundleToDir(bundle, "./bundle");
```

## Input shape (starter)

This generator currently supports:

* `permission[]` and `prohibition[]`
* `target`, `assignee`, `action`
* `constraint[]` (minimal starter)

It is designed to be extended for ODRL profile-dataspaces constructs (refinements, duties, consequences).

## Mapping & helpers

* `mapping.json` maps ODRL fields to helper calls.
* `helpers/*.rego` are shipped inside the npm package and imported by generated modules.

## License

Apache 2
