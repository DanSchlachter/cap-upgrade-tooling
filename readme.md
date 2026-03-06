# general objective

  - Breaking changes in CAP should be documented, identifyable and fixable
  - so that an upgrade (minor or major version) runs smoothly
  - upgrades are done by a system administrator who doesn't necessarily have developer knowledge (adjusting code or even running npm stuff)
  - two sets of mitigation steps are required then: one for AI/ a developer -> technical and one for admins -> different language and clearer explanations
  - or if possible: a script / bash commands that can be run to auto fix


# Tooling

## Input / Administration
### List View
  - Display all changes in a list
  - edit button to go to the Object edit page
  - 

 ### Object Edit Page
  - Create a new entry for a breaking change

## Output / Users
 - all views are generated from the data source

### Vitepress page - Migration Tool
 - vue component with filters for versions

### Vitepress page - Admin List View
 - 

### Vitepress page - Developer List View
 - 



# Data Source
a simple json stored in the vitepress directory (on github)



# Flow 
 - CAP developer identifies a breaking change, opens the Input Tooling, goes to the edit page, enters the changes, downloads the json and uploads it to the vitepress repo.
  - once merged, all the output views will be automatically reading from the updated list


# Fields

Each breaking change entry in the JSON data source has the following structure:

```json
{
  "id": "cds9-transactional-event-queues",
  "sourceVersion": "8.0",
  "targetVersion": "9.0",
  "title": "Transactional Event Queues Enabled by Default",
  "category": "Breaking Change",
  "severity": "high",
  "runtime": "both",
  "description": "Event queues are enabled by default. A database deployment is required when migrating to cds9/CAP Java 4 if the persistent outbox was not yet used.",
  "actionRequired": true,
  "applicable": "grep -r 'cds.outboxed' .",
  "affects": ["custom-handlers", "configuration"],
  "tags": ["messaging", "database"],
  "effort": "low",
  "affectedFiles": ["**/*.cds", "**/package.json"],
  "author": "github-handle",
  "lastUpdated": "2026-03-06",
  "steps": {
    "admin": [
      "Ask your development team or basis team to run a database deployment before completing the upgrade.",
      "If event queues are causing issues after the upgrade, ask a developer to disable them by setting `cds.requires.queue = false` in the project configuration."
    ],
    "developer": [
      "Run a database deployment before migrating to cds9/CAP Java 4 if the persistent outbox was not yet used.",
      "To opt out, add `cds.requires.queue = false` in your project configuration (applies to both Node.js and Java).",
      "Note that the table name remains `cds.outbox.Messages` for compatibility.",
      "`cds.outboxed(srv)` is kept as a synonym for the new `cds.queued(srv)`."
    ]
  },
  "needsRedeployment": true,
  "autoFix": {
    "available": false,
    "script": null
  },
  "supersededBy": null,
  "references": [
    "https://cap.cloud.sap/docs/releases/archive/2025/may25#enabled-by-default",
    "https://cap.cloud.sap/docs/guides/messaging/task-queues"
  ]
}
```

| Field | Type | Description |
|---|---|---|
| `id` | string | Unique identifier for the entry, used for linking and referencing |
| `sourceVersion` | string | The version being upgraded *from* |
| `targetVersion` | string \| null | The version being upgraded *to*. `null` means the change applies to all future versions from `sourceVersion` onwards |
| `title` | string | Short human-readable title of the breaking change |
| `category` | string | Top-level classification — see [Categories](#categories) below |
| `severity` | string | Impact level: `"high"`, `"medium"`, or `"low"` |
| `runtime` | string | Affected runtime: `"nodejs"`, `"java"`, or `"both"` |
| `description` | string | Full description of the change and its impact |
| `actionRequired` | boolean | Whether the user must take action or can safely ignore |
| `applicable` | string \| `true` | `true` if this entry always applies. Otherwise a shell command (e.g. a `grep`) to run in the user's project — if it returns results, the entry is relevant. Future stretch goal: invoke automatically from the Migration Tool. |
| `affects` | string[] | Parts of a CAP project impacted — see [Affects](#affects) below |
| `tags` | string[] | Free-text topics for additional filtering (e.g. `"messaging"`, `"database"`, `"auth"`) |
| `effort` | string | Estimated effort to apply the fix: `"low"`, `"medium"`, or `"high"`. Distinct from `severity` which describes impact, not work required. |
| `affectedFiles` | string[] | Glob patterns hinting which files are likely relevant (e.g. `["**/*.cds", "**/package.json"]`). Useful for AI agents scoping their analysis. |
| `author` | string | GitHub handle of the person who created the entry |
| `lastUpdated` | string | ISO 8601 date of the last edit to this entry |
| `steps.admin` | string[] | Plain-language mitigation steps for admins/basis teams (no coding assumed) |
| `steps.developer` | string[] | Technical mitigation steps for developers and AI agents (markdown supported) |
| `needsRedeployment` | boolean | Whether a database redeployment is required as part of this change (e.g. new or changed tables like the outbox) |
| `autoFix.available` | boolean | Whether an automated fix script exists |
| `autoFix.script` | string \| null | Raw shell command string the user can copy and paste into their project to auto-fix the issue. `null` if not available. Future stretch goal: invoke directly from the Migration Tool UI. |
| `supersededBy` | string \| null | ID of a newer entry that replaces this one. Used to chain entries across version paths — e.g. a 7→8 entry points to an 8→9 entry so the Migration Tool can traverse the full upgrade path. `null` if this entry is current. |
| `references` | string[] | Links to relevant documentation |

## Categories

Categories are a fixed top-level enum shared across all entries:

| Value | Description |
|---|---|
| `"Breaking Change"` | Existing behavior is removed or changed in a non-backwards-compatible way |
| `"Deprecation"` | Feature is still available but will be removed in a future version |
| `"Behavior Change"` | Default behavior changes without full removal; may require action |
| `"Removal"` | A previously deprecated feature has been fully removed |

## Affects

`affects` is an array of one or more values from this enum, describing which part(s) of a CAP project are impacted:

| Value | Description |
|---|---|
| `"data-model"` | Changes to CDS entity definitions, associations, or schema |
| `"custom-handlers"` | Changes affecting service event handlers written in Node.js or Java |
| `"configuration"` | Changes to `cds` configuration in `package.json`, `.cdsrc.json`, or `application.yaml` |
| `"database"` | Changes requiring a database migration or redeployment |
| `"messaging"` | Changes to event-driven messaging, queues, or outbox behaviour |
| `"rest"` | Changes to REST protocol adapter or HTTP endpoints |
| `"odata"` | Changes to OData protocol adapter or metadata |
| `"auth"` | Changes to authentication or authorization behaviour |
| `"multitenancy"` | Changes affecting multitenant applications |
| `"dependencies"` | Changes requiring updates to `package.json` dependencies or Java POM |