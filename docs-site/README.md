# CAP Upgrade Docs — VitePress Site

VitePress documentation site for the CAP Comprehensive Upgrade Tooling. Consumes `changes.json` from the repo root and renders three pages for two audiences.

## Pages

| Route | Component | Audience |
|---|---|---|
| `/migration-tool` | `MigrationTool.vue` | Developers — filter, scan, identify applicable breaking changes |
| `/admin-list` | `AdminList.vue` | Admins — plain-language steps, grouped by version/runtime |
| `/developer-list` | `DeveloperList.vue` | Developers — technical detail, code blocks, auto-fix scripts |

## Quick start

```bash
# from repo root
cd docs-site
npm install
npm run dev       # syncs changes.json, then starts dev server at http://localhost:5173
```

## Build

```bash
npm run build     # syncs changes.json, then builds to docs/.vitepress/dist/
npm run preview   # preview the production build locally
```

## Data sync

`npm run sync-data` copies `../changes.json` → `docs/public/changes.json`.  
`dev` and `build` both run this automatically, so the site always reflects the latest data without a manual copy step.

`changes.json` is served as a static asset at `/changes.json` and fetched at runtime — it is **not** bundled into the JS, so updating the data file does **not** require a rebuild.

## Adding entries

Use the **Admin UI** (`../admin-ui/`) to create or edit entries, then download the updated `changes.json` and open a PR to replace `../changes.json` in this repo. The next `dev`/`build` run will pick it up automatically.
