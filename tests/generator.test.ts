import { describe, it, expect } from "vitest";
import { generateRegoModule } from "../src";
import type { OdrlPolicy } from "../src";

describe("generateRegoModule", () => {
    it("generates stable rego for a simple permission", () => {
        const policy: OdrlPolicy = {
            uid: "simple-read-policy",
            permission: [
                {
                    assignee: "urn:user:alice",
                    target: "urn:data:dataset1",
                    action: "read"
                }
            ]
        };

        const rego = generateRegoModule(policy, { packageName: "odrl.generated" });
        expect(rego).toMatchSnapshot();
    });

    it("generates deny rule for prohibition", () => {
        const policy: OdrlPolicy = {
            uid: "deny-delete",
            prohibition: [
                {
                    assignee: "urn:user:alice",
                    target: "urn:data:dataset1",
                    action: "delete"
                }
            ]
        };

        const rego = generateRegoModule(policy, { packageName: "odrl.generated" });
        expect(rego).toContain("deny_");
    });
});
