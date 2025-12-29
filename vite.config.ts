import { defineConfig } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";

export default defineConfig({
    build: {
        lib: {
            entry: {
                index: "src/index.ts",
                cli: "src/cli.ts"
            },
            formats: ["es"],
            fileName: (format, entryName) => `${entryName}.js`
        },
        rollupOptions: {
            // Ensure external deps are not bundled (normal library behavior)
            external: ["node-odrl", "@open-policy-agent/opa-wasm", "node:url", "node:fs", "node:path"],
            output: {
                // Add a shebang to the CLI build output
                banner: (chunk) => (chunk.name === "cli" ? "#!/usr/bin/env node" : "")
            }
        }
    },
    plugins: [
        viteStaticCopy({
            targets: [
                { src: "mapping.json", dest: "." },
                { src: "helpers", dest: "." }
            ]
        })
    ]
});
