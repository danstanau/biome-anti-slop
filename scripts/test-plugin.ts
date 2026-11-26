import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const temporaryDirectory = mkdtempSync(join(tmpdir(), "biome-anti-slop-"));
const packageDirectory = join(
  temporaryDirectory,
  "node_modules",
  "@danstanau",
  "biome-anti-slop",
);
const biome = resolve(root, "node_modules/.bin/biome");

try {
  mkdirSync(join(temporaryDirectory, "node_modules", "@danstanau"), {
    recursive: true,
  });
  symlinkSync(root, packageDirectory, "dir");
  cpSync(
    join(root, "tests/fixtures"),
    join(temporaryDirectory, "tests/fixtures"),
    { recursive: true },
  );
  writeFileSync(
    join(temporaryDirectory, "biome.json"),
    JSON.stringify({
      $schema: "https://biomejs.dev/schemas/2.6.9/schema.json",
      plugins: [
        "@danstanau/biome-anti-slop/presets/recommended",
        "@danstanau/biome-anti-slop/presets/effect",
      ],
    }),
  );

  const generic = spawnSync(
    biome,
    ["lint", "tests/fixtures/generic-violations.ts"],
    { cwd: temporaryDirectory, encoding: "utf8" },
  );
  const genericOutput = `${generic.stdout}\n${generic.stderr}`;
  assert.notEqual(generic.status, 0, "generic preset should report violations");
  assert.match(genericOutput, /Avoid `Reflect\.get`/u);
  assert.match(genericOutput, /Avoid `Reflect\.apply`/u);
  assert.match(genericOutput, /Avoid adjacent eager array filter\/map passes/u);
  assert.match(genericOutput, /Avoid chained type assertions/u);
  assert.match(genericOutput, /conditional object spreads/u);
  assert.match(genericOutput, /copying reducer state/u);
  assert.match(genericOutput, /Preserve the known value's inferred type/u);
  assert.match(
    genericOutput,
    /Avoid widening a known value and asserting it back/u,
  );
  assert.match(genericOutput, /Avoid module mocking/u);
  assert.match(genericOutput, /Avoid broad object parameters/u);
  assert.match(genericOutput, /Keep `unknown` at the parsing boundary/u);
  assert.match(genericOutput, /explicit `unknown` return contracts/u);
  assert.match(genericOutput, /aliases that only rename `unknown`/u);
  assert.match(genericOutput, /unsafe open dictionary values/u);
  assert.match(genericOutput, /Avoid `shape` in locally owned symbol names/u);

  const effect = spawnSync(
    biome,
    ["lint", "tests/fixtures/effect-violations.ts"],
    { cwd: temporaryDirectory, encoding: "utf8" },
  );
  const effectOutput = `${effect.stdout}\n${effect.stderr}`;
  assert.notEqual(effect.status, 0, "Effect preset should report violations");
  assert.match(effectOutput, /Use Effect `Match` or `Predicate\.isTagged`/u);
  assert.match(effectOutput, /Use the existing Schema/u);
  assert.match(effectOutput, /Use a tagged Effect catch operator/u);
  assert.match(effectOutput, /Import the owning Effect Layer/u);
  assert.match(
    effectOutput,
    /Use Effect `Match` instead of chained literal ternaries/u,
  );

  const serviceTest = spawnSync(
    biome,
    ["lint", "tests/fixtures/effect-service.test.ts"],
    { cwd: temporaryDirectory, encoding: "utf8" },
  );
  assert.equal(
    serviceTest.status,
    0,
    "test files should allow service factories",
  );
  const effectValid = spawnSync(
    biome,
    ["lint", "tests/fixtures/effect-valid.ts"],
    { cwd: temporaryDirectory, encoding: "utf8" },
  );
  assert.equal(
    effectValid.status,
    0,
    "Effect Match object patterns should be allowed",
  );

  const vendorDirectory = join(temporaryDirectory, "installer-consumer");
  mkdirSync(vendorDirectory);
  const installer = join(
    root,
    "skills/install-biome-anti-slop/scripts/install.mjs",
  );
  const install = spawnSync(process.execPath, [installer], {
    cwd: vendorDirectory,
    encoding: "utf8",
  });
  assert.equal(install.status, 0, install.stderr);
  assert.equal(
    existsSync(
      join(vendorDirectory, "tools/biome/anti-slop/biome-manifest.json"),
    ),
    true,
  );
  assert.equal(
    existsSync(
      join(vendorDirectory, "tools/biome/anti-slop/src/rules/generic.ts"),
    ),
    true,
  );
  const overwrite = spawnSync(process.execPath, [installer], {
    cwd: vendorDirectory,
    encoding: "utf8",
  });
  assert.notEqual(
    overwrite.status,
    0,
    "installer should preserve existing copies",
  );

  const runtimeDirectory = join(vendorDirectory, "node_modules/@biomejs");
  mkdirSync(runtimeDirectory, { recursive: true });
  symlinkSync(
    resolve(root, "node_modules/@biomejs/runtime"),
    join(runtimeDirectory, "runtime"),
    "dir",
  );
  cpSync(
    join(root, "tests/fixtures"),
    join(vendorDirectory, "tests/fixtures"),
    { recursive: true },
  );
  writeFileSync(
    join(vendorDirectory, "biome.json"),
    JSON.stringify({
      $schema: "https://biomejs.dev/schemas/2.6.9/schema.json",
      plugins: [
        "./tools/biome/anti-slop/src/rules/generic.ts",
        "./tools/biome/anti-slop/src/effect/index.ts",
      ],
    }),
  );
  const vendored = spawnSync(
    biome,
    ["lint", "tests/fixtures/generic-violations.ts"],
    { cwd: vendorDirectory, encoding: "utf8" },
  );
  const vendoredOutput = `${vendored.stdout}\n${vendored.stderr}`;
  assert.notEqual(vendored.status, 0, "vendored TS plugins should run");
  assert.match(vendoredOutput, /Avoid `Reflect\.get`/u);

  console.log(
    "Biome plugin presets report expected generic and Effect diagnostics.",
  );
} finally {
  rmSync(temporaryDirectory, { recursive: true, force: true });
}
