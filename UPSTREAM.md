# Upstream and port notes

- Source project: <https://github.com/dmmulroy/anti-slop>
- Source revision reviewed: `63dbb09f73438e550a6991dc6d778f979ffbf183`
- License: MIT; the upstream copyright notice is retained in `LICENSE` alongside
  the copyright notice for this Biome implementation.
- Biome API target: `@biomejs/biome` and `@biomejs/runtime` 2.6.9.

This repository is a Biome implementation, not a byte-for-byte vendoring of the
Oxlint plugin. Generic rules are implemented with Biome's JavaScript plugin
runtime. Effect rules are opt-in. The Biome plugin API does not expose source
positions or comment trivia to plugin rules, so `require-readable-spacing` and
`require-safety-comment-for-type-assertion` are not ported. Several syntax-only
checks are deliberately narrower than Oxlint's ESTree/scope implementations;
their boundaries are documented in the README and rule messages.

Biome JavaScript plugins are currently a developer-preview feature. This
package pins both the Biome CLI peer dependency and runtime to 2.6.9; review
plugin compatibility and update both pins together when upgrading Biome.
