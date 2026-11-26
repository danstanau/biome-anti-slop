#!/usr/bin/env node
import { cpSync, existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../../..",
);
const sourceFiles = ["biome-manifest.json", "LICENSE", "UPSTREAM.md", "src"];
const destination = resolve(
  process.cwd(),
  process.argv[2] ?? "tools/biome/anti-slop",
);

if (existsSync(destination)) {
  console.error(
    `Refusing to overwrite ${destination}. Review and merge existing files first.`,
  );
  process.exit(1);
}

mkdirSync(dirname(destination), { recursive: true });
mkdirSync(destination);
for (const path of sourceFiles) {
  cpSync(resolve(repositoryRoot, path), resolve(destination, path), {
    recursive: true,
  });
}
console.log(`Copied the Biome anti-slop plugin to ${destination}`);
