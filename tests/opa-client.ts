export type OpaClientOptions = {
    baseUrl: string; // e.g. http://localhost:8181
    token?: string;  // if you enabled auth
};

export class OpaClient {
    constructor(private opts: OpaClientOptions) {}

    private async req(path: string, init?: RequestInit) {
        const headers: Record<string, string> = {
            "content-type": "application/json",
            ...(init?.headers as any)
        };
        if (this.opts.token) headers.authorization = `Bearer ${this.opts.token}`;

        const res = await fetch(`${this.opts.baseUrl}${path}`, { ...init, headers });
        const text = await res.text();
        let json: any = undefined;
        try { json = text ? JSON.parse(text) : undefined; } catch { /* ignore */ }

        if (!res.ok) {
            throw new Error(`OPA ${res.status} ${res.statusText} for ${path}\n${text}`);
        }
        return json;
    }

    async health(): Promise<boolean> {
        // OPA provides health endpoints (varies by config); /health is common, /health?bundles etc.
        try {
            const res = await fetch(`${this.opts.baseUrl}/health`);
            return res.ok;
        } catch {
            return false;
        }
    }

    async upsertPolicy(id: string, rego: string) {
        // PUT /v1/policies/<id> with raw rego text body is supported by OPA REST API
        const res = await fetch(`${this.opts.baseUrl}/v1/policies/${encodeURIComponent(id)}`, {
            method: "PUT",
            headers: {
                "content-type": "text/plain",
                ...(this.opts.token ? { authorization: `Bearer ${this.opts.token}` } : {})
            },
            body: rego
        });
        const body = await res.text();
        if (!res.ok) throw new Error(`OPA policy upload failed: ${res.status}\n${body}`);
    }

    async upsertPolicyText(id: string, rego: string) {
        const res = await fetch(`${this.opts.baseUrl}/v1/policies/${encodeURIComponent(id)}`, {
            method: "PUT",
            headers: {
                "content-type": "text/plain",
                ...(this.opts.token ? { authorization: `Bearer ${this.opts.token}` } : {})
            },
            body: rego
        });
        const body = await res.text();
        if (!res.ok) throw new Error(`OPA policy upload failed: ${res.status}\n${body}`);
    }


    async deletePolicy(id: string) {
        // DELETE /v1/policies/<id>
        await this.req(`/v1/policies/${encodeURIComponent(id)}`, { method: "DELETE" });
    }

    async queryData<T = unknown>(path: string, input: unknown): Promise<T> {
        // POST /v1/data/<path> with {"input": ...}
        const r = await this.req(`/v1/data/${path}`, {
            method: "POST",
            body: JSON.stringify({ input })
        });
        return r?.result as T;
    }
}
