---

name: install-biome-anti-slop
description: Install, configure, or update the Biome anti-slop rule plugin in a repository.
---

# Install Biome Anti-Slop

Anti-Slop is an opinionated set of rules, not a universal coding standard.
Preserve the target repository's existing Biome settings and local policy.

## Assess the target first

Read repository instructions and `git status`. Identify the Biome version,
package manager, `biome.json`, and any existing anti-slop plugin or vendored
copy. Preserve existing configuration; do not overwrite an existing plugin
directory.

## Vendor the source

1. Use the included `scripts/install.mjs` with the default path
   `tools/biome/anti-slop`, or another target-relative destination. It refuses
   to overwrite an existing directory.
2. Add `@biomejs/runtime` at the same exact version as the target Biome CLI.
   The plugin currently targets 2.6.9.
3. Merge `./tools/biome/anti-slop/src/rules/generic.ts` into the repository's
   `plugins` array in `biome.json`. For projects directly depending on Effect,
   also add `./tools/biome/anti-slop/src/effect/index.ts`.
4. Run the repository's Biome lint, formatter, and typecheck commands. Report
   existing source violations; do not weaken rules to silence them.

## Install as a package

1. This package has not been published yet. When a release is available, use
   Biome 2.6.9, the exact version supported by this package. JavaScript plugins
   are a developer-preview feature.
2. Install `@danstanau/biome-anti-slop@0.1.0` as a development dependency.
3. Merge `@danstanau/biome-anti-slop/presets/recommended` into the existing
   `plugins` list in `biome.json`.
4. If the repository directly depends on Effect, also add
   `@danstanau/biome-anti-slop/presets/effect`.
5. Run the repository's Biome lint, formatter, and typecheck commands. Report
   existing source violations; do not weaken rules to silence them.

Do not silently replace an existing vendored installation. Review upstream
changes against local customizations and preserve local policy.
