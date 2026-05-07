# Remote Catalog Design

## Goal

Move kits and features discovery out of `knitto-create` source code and into a repo-level manifest in `httpsgabv/knitto-templates`, so new kits and features can be published through the templates repository without requiring a new `knitto-create` release.

## Problem

Today, adding a new kit or feature requires two coordinated changes:

1. Add or update the template inside `knitto-templates`.
2. Add or update the static catalog entry inside `knitto-create`.

This couples template publishing to CLI publishing. The templates repository already contains the real template contents and per-template `knitto.json` manifests, but `knitto-create` still hardcodes kit and feature discovery in `src/catalog/kits.ts` and `src/catalog/features.ts`.

## Scope

This design covers:

1. Adding a repo-level catalog manifest to `knitto-templates`.
2. Loading that manifest at runtime in `knitto-create`.
3. Falling back to the bundled static catalog when the remote manifest cannot be used.
4. Keeping the current template composition flow based on per-template `knitto.json` files.

This design does not cover:

1. Disk caching of the remote manifest.
2. Automatic generation of the repo-level catalog manifest.
3. Replacing per-template `knitto.json` manifests.

## Existing Architecture

The current catalog flow is synchronous and static:

1. `src/catalog/kits.ts` exports the hardcoded kit list.
2. `src/catalog/features.ts` exports the hardcoded feature list.
3. `src/catalog/official-catalog.ts` validates those arrays with `CatalogSchema` and exposes lookup methods through the `Catalog` interface.
4. `src/cli/bootstrap.ts` constructs `new OfficialCatalog()` and injects it into prompts, list commands, feature resolution, and project creation.

Template discovery and template execution are already separate concerns:

1. The catalog selects a kit and features.
2. `CreateProjectUseCase` resolves template sources from the selected catalog entries.
3. The template provider downloads the selected template directories.
4. The manifest loader reads each template's own `knitto.json`.
5. The planner and composer generate the project from those template manifests.

That separation should be preserved.

## Chosen Approach

Use a single repo-level catalog manifest as the source of truth for discoverable kits and features, and load it at CLI startup with a local bundled fallback.

### Why this approach

1. It removes the need to publish `knitto-create` for catalog-only changes.
2. It keeps runtime behavior reliable when GitHub is unavailable or the manifest is temporarily invalid.
3. It reuses the existing `CatalogSchema` and `OfficialCatalog` validation path.
4. It keeps prompts, feature resolution, and project generation mostly unchanged.

### Alternatives considered

1. Live manifest only.
   This is simpler but makes the CLI depend entirely on GitHub availability and manifest correctness.
2. Live manifest plus disk cache.
   This improves resilience and startup speed, but adds TTL, invalidation, and cache corruption concerns that are unnecessary for the first iteration.

## Remote Manifest

### File location

Add a repo-level file named `knitto-catalog.json` at the root of `httpsgabv/knitto-templates`.

This file should not be named `knitto.json`, because that filename already means a template-local generation manifest everywhere else in the project.

### Shape

The file should reuse the current catalog schema shape:

```json
{
  "kits": [
    {
      "slug": "nestjs",
      "name": "NestJS",
      "description": "A NestJS starter for building modular APIs.",
      "source": {
        "type": "github",
        "repo": "httpsgabv/knitto-templates",
        "path": "/kits/",
        "name": "nest-api"
      },
      "compatibleFeatures": [
        "pino-logging",
        "sentry-nest",
        "scalar-nest",
        "helmet-nest",
        "throttler-nest",
        "husky-git-hooks"
      ]
    }
  ],
  "features": [
    {
      "slug": "pino-logging",
      "name": "Pino Logging",
      "description": "Add a basic Pino logging setup.",
      "source": {
        "type": "github",
        "repo": "httpsgabv/knitto-templates",
        "path": "/features/",
        "name": "feature-pino"
      },
      "supports": ["nestjs"],
      "requires": [],
      "conflictsWith": []
    }
  ]
}
```

### Ownership boundary

`knitto-catalog.json` is the source of truth for:

1. Which kits and features are visible to users.
2. The slugs, labels, descriptions, compatibility, and source locations used by the CLI.

Per-template `knitto.json` remains the source of truth for:

1. Template-local file selection rules.
2. Manifest operations.
3. Template composition behavior.

## Runtime Architecture

### New loading boundary

Add a catalog loading layer that runs before the CLI starts using a catalog instance.

Responsibilities:

1. Fetch `knitto-catalog.json` from the templates repository default branch.
2. Parse the JSON payload.
3. Validate it with the existing `CatalogSchema`.
4. Return validated `kits` and `features`.
5. Fall back to the bundled local snapshot if remote loading fails.

### Catalog composition

Keep `OfficialCatalog` as the validated in-memory catalog implementation.

The new loader should feed `OfficialCatalog` with either:

1. Remote `kits` and `features` when the remote manifest is valid.
2. Bundled `kits` and `features` when remote loading fails.

This keeps lookup behavior in one place and avoids spreading fallback logic across the app.

### Bootstrap change

`createApp()` should become asynchronous so startup can await catalog loading once and share the resulting catalog instance across the whole command execution.

Every consumer in the current process should use that same resolved catalog instance:

1. Interactive prompts.
2. `list kits`.
3. `list features`.
4. `FeatureResolver`.
5. `CreateProjectUseCase`.

## Failure Handling

Fallback to the bundled snapshot when any of the following happens:

1. Network failure.
2. GitHub non-success response.
3. Missing remote file.
4. Invalid JSON.
5. Schema validation failure.

The fallback should be silent in terms of behavior but visible in diagnostics. The CLI should emit a short non-blocking notice such as:

`Using bundled catalog snapshot because remote catalog could not be loaded.`

The process should continue normally after fallback.

## Data Flow

The end-to-end flow should look like this:

1. CLI bootstrap starts.
2. The catalog loader tries to fetch and validate `knitto-catalog.json`.
3. If successful, bootstrap creates `OfficialCatalog` from the remote data.
4. If unsuccessful, bootstrap creates `OfficialCatalog` from the bundled data and emits a fallback notice.
5. User selects a kit and features from that resolved catalog.
6. Project creation fetches the selected template directories.
7. Template-local `knitto.json` files are loaded and used for planning and composition.

The catalog manifest controls discovery. Template manifests control generation.

## File Structure

The work should introduce focused units with one clear responsibility each.

Likely changes in `knitto-create`:

1. Keep `src/catalog/kits.ts` and `src/catalog/features.ts` as the bundled fallback snapshot.
2. Keep `src/catalog/official-catalog.ts` as the validated in-memory implementation.
3. Add a remote catalog fetcher/loader in a new adapter or catalog-specific module.
4. Add a small bootstrap-facing service that coordinates remote load and fallback.
5. Update `src/cli/bootstrap.ts` and any startup path that assumes synchronous app construction.

Likely changes in `knitto-templates`:

1. Add `knitto-catalog.json` at repo root.
2. Document that new kits/features must be added there when introduced.

## Testing Strategy

Add coverage for:

1. Successful remote load.
2. Remote 404 or non-success response.
3. Network error.
4. Invalid JSON response.
5. Schema validation failure.
6. Bootstrap wiring with remote data.
7. Bootstrap wiring with fallback data.
8. At least one end-to-end style flow proving a remotely loaded kit or feature is visible to prompts and feature resolution.

Existing `OfficialCatalog` tests should remain mostly valid because lookup and validation behavior stay in that class.

## Rollout

### Phase 1

Add `knitto-catalog.json` to `knitto-templates` with the same data currently hardcoded in `knitto-create`.

### Phase 2

Implement remote catalog loading with local fallback in `knitto-create`.

### Phase 3

Update documentation to say that adding new kits and features only requires updating `knitto-templates` unless the CLI itself needs new behavior.

## Non-Goals For This Iteration

1. Disk cache.
2. Automatic synchronization between template-local manifests and the root catalog manifest.
3. Runtime branch selection.
4. Replacing the current template download mechanism.

## Success Criteria

This design is successful when:

1. A newly added kit or feature can appear in `knitto` without publishing a new `knitto-create` version.
2. `knitto` still works when the remote catalog cannot be loaded.
3. The rest of the project creation pipeline remains unchanged for consumers of the `Catalog` interface.
4. Discovery and generation stay cleanly separated between `knitto-catalog.json` and per-template `knitto.json`.
