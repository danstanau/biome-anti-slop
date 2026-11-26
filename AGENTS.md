# Repository guidance

- `src/` is the canonical plugin implementation.
- Biome JavaScript plugins are developer preview; keep `@biomejs/biome` and
  `@biomejs/runtime` aligned at the pinned version.
- Add integration coverage in `tests/fixtures/` for rule behavior and preset
  loading; `pnpm test` exercises package and vendored installation paths.
- Do not approximate rules that require comment trivia or source offsets.
- Run `pnpm check` before publishing changes.
