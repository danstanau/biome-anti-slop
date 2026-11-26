# Biome Anti-Slop

Opinionated Biome lint rules for low-evidence JavaScript and TypeScript
patterns, inspired by [dmmulroy/anti-slop](https://github.com/dmmulroy/anti-slop).
It includes generic rules and an opt-in Effect preset, implemented with
Biome's JavaScript plugin API.

> [!WARNING]
> Biome JavaScript plugins are currently a developer-preview feature. This
> package targets Biome 2.6.9 and may need updates for later Biome versions.

## Install

The package has not been published to npm yet. Until it is, clone this
repository and run its installer from the repository that will use the plugin:

```sh
node /path/to/biome-anti-slop/skills/install-biome-anti-slop/scripts/install.mjs
pnpm add -D @biomejs/biome@2.6.9 @biomejs/runtime@2.6.9
```

Add `./tools/biome/anti-slop/src/rules/generic.ts` to the consuming project's
Biome `plugins` array. Effect projects can also add
`./tools/biome/anti-slop/src/effect/index.ts`. Preserve any existing entries.
The installer refuses to overwrite an existing destination; see the
[installation skill](skills/install-biome-anti-slop/SKILL.md) for updates.

After an npm release is available, install the package instead:

```sh
pnpm add -D @biomejs/biome@2.6.9 @danstanau/biome-anti-slop@0.1.0
```

Enable the generic preset in `biome.json`:

```json
{
  "$schema": "https://biomejs.dev/schemas/2.6.9/schema.json",
  "plugins": ["@danstanau/biome-anti-slop/presets/recommended"]
}
```

Projects that directly depend on Effect can additionally enable its opt-in
rules:

```json
{
  "plugins": [
    "@danstanau/biome-anti-slop/presets/recommended",
    "@danstanau/biome-anti-slop/presets/effect"
  ]
}
```

The named presets above require the installed npm package; direct vendored
plugin paths do not use the package manifest.

## Generic rules

The `recommended` preset enables:

| Rule                                                              | Purpose                                                 |
| ----------------------------------------------------------------- | ------------------------------------------------------- |
| `noArrayFilterMap`                                                | Reject adjacent eager array `filter`/`map` passes.      |
| `noReduceAccumulatorCopy`                                         | Reject common accumulator-copy patterns in reducers.    |
| `noChainedTypeAssertions`                                         | Reject chained TypeScript assertions.                   |
| `noConditionalEmptyObjectSpread`                                  | Reject conditional spreads with an empty-object branch. |
| `noKnownValueWidening`                                            | Catch common explicit widenings of known values.        |
| `noModuleMocking`                                                 | Reject Vitest/Jest module-mocking calls.                |
| `noObjectParameters`                                              | Reject parameters annotated as `object`.                |
| `noReflectApply`, `noReflectGet`                                  | Prefer ordinary typed calls and property access.        |
| `noRuntimeTypeof`                                                 | Prefer boundary parsing over ad hoc `typeof` narrowing. |
| `noShapeInSymbolNames`                                            | Disallow `shape` in locally declared symbol names.      |
| `noUnknownParameters`, `noUnknownReturns`, `noUnknownTypeAliases` | Keep `unknown` at explicit parsing boundaries.          |
| `noUnsafeDictionaryType`                                          | Reject unsafe open dictionary value types.              |
| `noWidenThenAssert`                                               | Catch common local flows that widen and then re-assert. |

Rules operate on Biome's syntax tree, not the TypeScript type checker. They
intentionally avoid claiming cross-file type inference. Some complex Oxlint
scope analysis has narrower syntax-only coverage here:

- `noArrayFilterMap` currently requires a direct array-literal receiver; it
  does not infer array aliases or imported factory return types.
- `noReduceAccumulatorCopy` recognizes common copies of the inline reducer's
  first parameter and does not analyze named callbacks or indirect helpers.
- `noModuleMocking` and the `Reflect` rules match the unqualified global names
  syntactically; locally shadowed bindings are not resolved.
- `noKnownValueWidening` and `noWidenThenAssert` cover common same-file local
  declarations, not type aliases or cross-file flows.
- Effect rules match direct syntax and do not resolve aliased imports or prove
  that an API with the same name came from Effect.

Review rule source and tests before adopting these policies in a repository.

## Effect rules

The separate `effect` preset contains:

- `noManualEffectErrorTag` — prefer tagged Effect error handlers to manual tag
  branching inside broad catch handlers.
- `noManualTagComparison` — prefer `Match` or `Predicate.isTagged` to `_tag`
  comparisons and switches.
- `noManualTaggedConstruction` — prefer tagged constructors to literal `_tag`
  objects.
- `noServiceConstructorImports` — prefer the owning Layer to relative
  `make<Capability>` imports in application code.
- `preferEffectMatch` — prefer Effect `Match` over chained literal ternaries.

These are syntactic checks and do not resolve aliased imports or prove that a
same-named API belongs to Effect. Service constructor detection is limited to
relative imports and skips test/spec files.

## Biome-specific limitations

Biome's JavaScript plugin runtime does not currently expose source offsets or
comment trivia to plugin rules. Consequently, these Oxlint rules are omitted
rather than approximated:

- `require-readable-spacing`: use Biome's formatter for consistent layout.
- `require-safety-comment-for-type-assertion`: review assertions and require
  invariant comments through code review or a separate source-aware check.

Biome has a native equivalent for the upstream Oxlint
`no-accumulating-spread` rule. Enable `performance/noAccumulatingSpread` along
with this plugin's `noReduceAccumulatorCopy` to cover spread and common
non-spread accumulator copies.

```json
{
  "linter": {
    "rules": {
      "performance": {
        "noAccumulatingSpread": "error"
      }
    }
  }
}
```

## Development

```sh
pnpm install
pnpm check
```

`src/` is canonical. Integration tests run the installed Biome CLI against a
temporary consumer project so the package manifest and preset resolution are
exercised, not just the rule functions.

## Publishing

The GitHub repository being public does not publish the package to npm. A
maintainer with access to the `@danstanau` npm scope can run `pnpm check`, then
`npm publish` from a clean release checkout. The package is configured for
public access. Review the release contents with `npm pack --dry-run` first.

## License and provenance

MIT. The project is a port of the rule ideas and behavior in
[`dmmulroy/anti-slop`](https://github.com/dmmulroy/anti-slop); see
[UPSTREAM.md](UPSTREAM.md) for the reviewed source revision and deviations.
