export function asString(x: unknown): string | undefined {
    if (typeof x === "string") return x;
    return undefined;
}

export function regoStringLiteral(s: string): string {
    // minimal escaping
    const escaped = s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    return `"${escaped}"`;
}

export function safeRuleIdent(name: string): string {
    // Rego identifiers: [a-zA-Z_][a-zA-Z0-9_]*
    const cleaned = name.replace(/[^a-zA-Z0-9_]/g, "_");
    return /^[a-zA-Z_]/.test(cleaned) ? cleaned : `r_${cleaned}`;
}

export function indent(lines: string, spaces = 2): string {
    const pad = " ".repeat(spaces);
    return lines
        .split("\n")
        .map((l) => (l.trim().length ? pad + l : l))
        .join("\n");
}
