# Architecture Decisions

## Data format: JSON over Markdown/frontmatter

**Decision:** `changes.json` remains the single source of truth. Per-entry `.md` files with frontmatter were considered and rejected.

**Pros of staying with JSON**
- Admin UI and docs site both consume one file directly — no build-time compilation step
- Schema validation (`ajv-cli`) and VS Code autocomplete work out of the box
- Structured fields (arrays, booleans, nested objects) map naturally; no escaping or serialization edge cases

**Cons / what we give up**
- Editing a single entry on GitHub requires navigating a large array rather than opening one small file
- Diffs are noisier for prose-heavy fields like `steps.developer`
