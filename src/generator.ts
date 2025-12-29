import type { GenerateOptions, OdrlPolicy, OdrlRule, MappingSpec } from "./types";
import { loadDefaultMapping } from "./mapping";
import { asString, regoStringLiteral, safeRuleIdent, indent } from "./utils";

type EmitCtx = {
    mapping: MappingSpec;
    imports: Set<string>;
};

function callMapped(ctx: EmitCtx, key: string, placeholderValue: string): string {
    const m = ctx.mapping[key];
    if (!m) throw new Error(`Missing mapping entry for "${key}"`);

    ctx.imports.add(m.regoPackage);

    const args = m.args.map((a) => (a === "%s" ? placeholderValue : a)).join(", ");
    // imported as: import data.<regoPackage>
    // invoke via: <regoPackage>.<method>(...)
    return `${m.regoPackage}.${m.method}(${args})`;
}

function extractActionValue(rule: OdrlRule): string | undefined {
    const a = rule.action;
    if (typeof a === "string") return a;

    // handle pattern: { "rdf:value": { "@id": "duc:KillJob" }, refinement: [...] }
    if (a && typeof a === "object") {
        const anyA = a as Record<string, any>;
        const rdfVal = anyA["rdf:value"];
        if (typeof rdfVal === "string") return rdfVal;
        if (rdfVal && typeof rdfVal === "object" && typeof rdfVal["@id"] === "string") return rdfVal["@id"];
    }
    return undefined;
}

function emitDecisionOr(ruleName: "allow" | "deny", refs: string[]): string {
    // If no refs, rely on default rule only.
    if (refs.length === 0) return "";
    return refs.map((r) => `${ruleName} if {\n  ${r}\n}`).join("\n\n");
}

function emitRuleBody(ctx: EmitCtx, rule: OdrlRule): string[] {
    const body: string[] = [];

    const action = extractActionValue(rule);
    if (action) body.push(callMapped(ctx, "action", regoStringLiteral(action)));

    const target = asString(rule.target);
    if (target) body.push(callMapped(ctx, "target", regoStringLiteral(target)));

    const assignee = asString(rule.assignee);
    if (assignee) body.push(callMapped(ctx, "assignee", regoStringLiteral(assignee)));

    // constraints (very minimal starter): convert constraint entries into operator.eval(left, op, right)
    // You will likely extend this heavily for ODS profile refinements.
    if (Array.isArray(rule.constraint)) {
        for (const c of rule.constraint) {
            const left = asString((c as any).leftOperand);
            const op = asString((c as any).operator);
            const right = (c as any).rightOperand;

            if (!left || !op || right === undefined) continue;

            // left operand maps into input by convention: input.context.<leftOperand>
            const leftExpr = `input.context.${safeRuleIdent(left)}`;

            const opLit = regoStringLiteral(op);
            const rightExpr =
                typeof right === "string"
                    ? regoStringLiteral(right)
                    : Array.isArray(right)
                        ? JSON.stringify(right)
                        : typeof right === "number" || typeof right === "boolean"
                            ? String(right)
                            : JSON.stringify(right);

            ctx.imports.add(ctx.mapping.constraint?.regoPackage ?? "odrl.helpers.operator");

            // mapping uses %s placeholders with [left, op, right]
            const m = ctx.mapping.constraint;
            if (!m) throw new Error(`Missing mapping entry for "constraint"`);

            const args = m.args
                .map((a) => {
                    if (a === "%s") return "__PLACEHOLDER__";
                    return a;
                })
                .join(", ");

            // Replace placeholders in order
            let placeholderArgs = [leftExpr, opLit, rightExpr];
            const actualArgs = args.split(", ").map((a) => (a === "__PLACEHOLDER__" ? placeholderArgs.shift()! : a));

            body.push(`${m.regoPackage}.${m.method}(${actualArgs.join(", ")})`);
        }
    }

    return body;
}

function emitRuleBlock(ruleName: string, body: string[]): string {
    if (body.length === 0) {
        return `${ruleName} if {\n  true\n}`;
    }
    return `${ruleName} if {\n${indent(body.join("\n"), 2)}\n}`;
}

export function generateRegoModule(policy: OdrlPolicy, options: GenerateOptions = {}): string {
    const mapping = options.mapping ?? loadDefaultMapping();
    const pkg = options.packageName ?? "odrl.generated";
    const moduleName = options.moduleName ?? (policy.uid ? safeRuleIdent(String(policy.uid)) : "policy");

    const ctx: EmitCtx = { mapping, imports: new Set<string>() };

    const allowRules: string[] = [];
    const denyRules: string[] = [];

    const perms = Array.isArray(policy.permission) ? policy.permission : [];
    perms.forEach((r, i) => {
        const body = emitRuleBody(ctx, r);
        allowRules.push(emitRuleBlock(`allow_${moduleName}_${i}`, body));
    });

    const prohibitions = Array.isArray(policy.prohibition) ? policy.prohibition : [];
    prohibitions.forEach((r, i) => {
        const body = emitRuleBody(ctx, r);
        denyRules.push(emitRuleBlock(`deny_${moduleName}_${i}`, body));
    });

    const importLines = Array.from(ctx.imports)
        .sort()
        .map((p) => `import data.${p}`)
        .join("\n");

    const allowRefs = allowRules.map((_, i) => `allow_${moduleName}_${i}`);
    const denyRefs = denyRules.map((_, i) => `deny_${moduleName}_${i}`);


    // Export a single allow/deny decision as well (simple aggregator)
    const decision = `
default allow = false
default deny = false

${emitDecisionOr("deny", denyRefs)}

${emitDecisionOr("allow", allowRefs)}
`.trim();

    // The “decision” block above is intentionally simplistic.
    // Many teams instead define:
    // allow { allow_rule_0 } ... and use `allow` directly. You can refine later.

    return `
package ${pkg}

${importLines}

# Generated from ODRL policy uid=${policy.uid ?? "unknown"}

${denyRules.join("\n\n")}

${allowRules.join("\n\n")}

${decision}
`.trim();
}
