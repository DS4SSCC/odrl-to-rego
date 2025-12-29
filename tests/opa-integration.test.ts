import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { OpaClient } from "./opa-client";
import { generateRegoModule } from "../src";
import type { OdrlPolicy } from "../src";

const OPA_BASE_URL = process.env.OPA_BASE_URL ?? "http://localhost:8181";
const OPA_TOKEN = process.env.OPA_TOKEN; // optional if you secured OPA

import fs from "node:fs";
import path from "node:path";

async function loadHelper(name: string) {
    return fs.readFileSync(path.join(process.cwd(), "helpers", name), "utf8");
}



describe("OPA integration (HTTP)", async () => {
    const opa = new OpaClient({ baseUrl: OPA_BASE_URL, token: OPA_TOKEN });
    const policyId = "odrl-to-rego-test-policy";


    await opa.upsertPolicyText("odrl-helper-action", await loadHelper("action.rego"));
    await opa.upsertPolicyText("odrl-helper-target", await loadHelper("target.rego"));
    await opa.upsertPolicyText("odrl-helper-assignee", await loadHelper("assignee.rego"));
    await opa.upsertPolicyText("odrl-helper-operator", await loadHelper("operator.rego"));

    beforeAll(async () => {
        // Wait a bit for docker to be ready
        for (let i = 0; i < 20; i++) {
            if (await opa.health()) return;
            await new Promise((r) => setTimeout(r, 500));
        }
        throw new Error(`OPA not reachable at ${OPA_BASE_URL}`);
    });

    afterAll(async () => {
        // Cleanup policy (best-effort)
        try { await opa.deletePolicy(policyId); } catch {}
    });

    it("allows matching permission", async () => {
        const policy: OdrlPolicy = {
            uid: "simple-read-policy",
            permission: [
                { assignee: "urn:user:alice", target: "urn:data:dataset1", action: "read" }
            ]
        };

        const rego = generateRegoModule(policy, { packageName: "odrl.generated" });

        await opa.upsertPolicy(policyId, rego);

        const input = {
            subject: "urn:user:alice",
            action: "read",
            resource: "urn:data:dataset1",
            context: {}
        };

        const allow = await opa.queryData<boolean>("odrl/generated/allow", input);
        expect(allow).toBe(true);
    });

    it("denies prohibition", async () => {
        const policy: OdrlPolicy = {
            uid: "deny-delete-policy",
            prohibition: [
                { assignee: "urn:user:alice", target: "urn:data:dataset1", action: "delete" }
            ]
        };

        const rego = generateRegoModule(policy, { packageName: "odrl.generated" });

        await opa.upsertPolicy(policyId, rego);

        const input = {
            subject: "urn:user:alice",
            action: "delete",
            resource: "urn:data:dataset1",
            context: {}
        };

        const deny = await opa.queryData<boolean>("odrl/generated/deny", input);
        expect(deny).toBe(true);
    });
});
