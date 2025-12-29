export type OdrlAny = Record<string, unknown>;

/**
 * Minimal ODRL shapes we rely on.
 * You can tighten these as your node-odrl typings mature.
 */
export type OdrlPolicy = {
    uid?: string;
    "@type"?: string;
    permission?: OdrlRule[];      // ODRL: permission
    prohibition?: OdrlRule[];     // ODRL: prohibition
    obligation?: OdrlRule[];      // ODRL: obligation/duty (not fully supported yet)
} & OdrlAny;

export type OdrlRule = {
    target?: string;
    assignee?: string;
    assigner?: string;
    action?: string | { "rdf:value"?: { "@id"?: string } | string; refinement?: unknown[] };
    constraint?: OdrlConstraint[]; // ODRL: constraint/refinement
} & OdrlAny;

export type OdrlConstraint = {
    leftOperand?: string;
    operator?: string;  // eq/gt/...
    rightOperand?: unknown;
} & OdrlAny;

export type RegoModule = {
    path: string;   // e.g. "policy.rego" or "helpers/action.rego"
    content: string;
};

export type GenerateOptions = {
    packageName?: string;         // rego package
    moduleName?: string;          // influences rule names
    mapping?: MappingSpec;
    includeHelpers?: boolean;
};

export type MappingSpec = Record<
    string,
    {
        regoPackage: string;
        method: string;
        args: string[]; // e.g. ["input.action", "%s"]
    }
>;
