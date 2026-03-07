# Desktop Settings for MCP and Skills Import

## TL;DR

> **Summary**: Add MCP and Skills management to the existing desktop Settings dialog in `packages/app`, backed by config- and runtime-owned flows in `packages/ideaspace`, with global-first scope, explicit project overrides, and local-first managed imports.
> **Deliverables**:
>
> - MCP settings tab with scope-aware config editing, import, status, connect, disconnect, and OAuth entry points
> - Skills settings tab with scope-aware managed imports, origin badges, and managed removal
> - Backend import services/routes for local-first MCP and skill imports
> - Automated app/runtime tests plus desktop-stack verification
>   **Effort**: Large
>   **Parallel**: YES - 3 waves
>   **Critical Path**: 2 → 4/5 → 6/7 → 8/9

## Context

### Original Request

Plan how to integrate desktop-app settings for managing MCPs and skills, including importing MCPs and skills, and choose the best repo-native approach.

### Interview Summary

- Use the existing Settings dialog rather than a new workspace-settings surface.
- Make persistence global-first, with explicit project overrides available in the same feature.
- Use a managed install/copy import flow, not config-reference-only imports.
- Keep v1 local-first rather than adding remote registry browsing.
- Use tests-after rather than TDD, while still requiring automated verification and agent-executed QA.

### Metis Review (gaps addressed)

- Preserved the split between persisted config state and live runtime state.
- Added explicit scope selection instead of implicit context-only behavior.
- Added duplicate-handling, removal rules, and read-only treatment for inherited/external skills.
- Accepted a minimal new backend import surface for managed-copy flows because config patching alone cannot copy local assets.
- Locked v1 import UX to native file/directory pickers already exposed through platform APIs rather than inventing a registry/browser flow.

## Work Objectives

### Core Objective

Ship a desktop-first Settings experience that lets users view, import, configure, and remove MCP servers and skills without breaking the repo’s existing config precedence, runtime lifecycle, or desktop verification path.

### Deliverables

- `packages/app` settings navigation extended with MCP and Skills tabs.
- Shared app-side settings controller for global/project scope switching and reload-safe save flows.
- MCP management UI for config editing plus runtime actions.
- Skills management UI for managed imports/removal plus origin visibility.
- `packages/ideaspace` import services/routes for local MCP config import and local skill copy/remove operations.
- App and runtime automated tests covering persistence, precedence, duplicate handling, and UI behavior.

### Definition of Done (verifiable conditions with commands)

- `cd packages/ideaspace && bun test test/config/config.test.ts test/skill/skill.test.ts test/mcp/oauth-browser.test.ts`
- `cd packages/app && bun test --preload ./happydom.ts ./src/components/settings-mcp.test.tsx ./src/components/settings-skills.test.tsx ./src/context/settings-config.test.tsx`
- `cd packages/app && bun run typecheck && bun run build`
- `cd packages/ideaspace && bun run build`
- `cd packages/desktop && bun run build`

### Must Have

- Existing `packages/app/src/components/dialog-settings.tsx` remains the primary shell.
- MCP and Skills settings both expose a visible scope selector: `Global` and `Project` when a git-backed project is active.
- MCP settings distinguish saved config from live runtime status.
- Skills settings distinguish managed items from inherited/external items.
- Local-first import uses platform-native file/directory pickers already provided by the desktop platform integration.
- Managed skill import copies assets into repo-native discovery locations:
  - global: `${Global.Path.config}/skills/<slug>/...`
  - project: `<worktree>/.ideaspace/skills/<slug>/...`
- MCP import accepts local `.json` / `.jsonc` files containing either a top-level `mcp` object or a single MCP entry object.
- All settings writes trigger the existing reload/dispose pipeline cleanly.

### Must NOT Have (guardrails, AI slop patterns, scope boundaries)

- No new settings surface outside the existing dialog.
- No registry/marketplace browser for MCPs or skills.
- No skill authoring/editor flow.
- No background sync/update system for remote skills.
- No mutation of inherited `.claude` / `.agents` / URL-discovered skills from the UI.
- No storing OAuth tokens inside config import/export payloads.
- No desktop-only implementation that bypasses `packages/app` UI ownership.

## Verification Strategy

> ZERO HUMAN INTERVENTION — all verification is agent-executed.

- Test decision: tests-after using Bun unit/integration tests in `packages/app` and `packages/ideaspace`
- QA policy: Every task includes agent-executed scenarios with explicit selectors and commands
- Evidence: `.sisyphus/evidence/task-{N}-{slug}.{ext}`

## Execution Strategy

### Parallel Execution Waves

> Target: 5-8 tasks per wave. <3 per wave (except final) = under-splitting.
> Extract shared dependencies as Wave-1 tasks for max parallelism.

Wave 1: foundation and backend seams (Tasks 1-5)

- settings navigation and selector contract
- shared scope/origin controller
- picker/import dialog contract
- backend skill import service/routes
- backend MCP import service/routes

Wave 2: feature assembly (Tasks 6-8)

- MCP settings tab
- Skills settings tab
- automated tests for UI + runtime import flows

Wave 3: integration verification (Task 9)

- desktop-stack type/build/test verification and scripted UI smoke

### Dependency Matrix (full, all tasks)

| Task | Depends On | Blocks             |
| ---- | ---------- | ------------------ |
| 1    | none       | 6, 7, 8            |
| 2    | none       | 6, 7, 8, 9         |
| 3    | 1          | 6, 7               |
| 4    | 2, 3       | 7, 8, 9            |
| 5    | 2, 3       | 6, 8, 9            |
| 6    | 1, 2, 3, 5 | 8, 9               |
| 7    | 1, 2, 3, 4 | 8, 9               |
| 8    | 4, 5, 6, 7 | 9                  |
| 9    | 2, 6, 7, 8 | Final Verification |

### Agent Dispatch Summary (wave → task count → categories)

- Wave 1 → 5 tasks → visual-engineering (1,3), deep (2,4,5)
- Wave 2 → 3 tasks → visual-engineering (6,7), unspecified-high (8)
- Wave 3 → 1 task → unspecified-high (9)

## TODOs

> Implementation + Test = ONE task. Never separate.
> EVERY task MUST have: Agent Profile + Parallelization + QA Scenarios.

- [ ] 1. Extend the Settings shell for MCP and Skills

  **What to do**: Update `packages/app/src/components/dialog-settings.tsx` to add `mcp` and `skills` tabs under the existing server section; keep the current tab layout and sticky content pattern. Add explicit `data-action` selectors that all later QA will depend on: `settings-tab-mcp`, `settings-tab-skills`, `settings-scope`, `settings-scope-global`, `settings-scope-project`. Add matching i18n keys in `packages/app/src/i18n/en.ts` and keep every other locale file compiling by adding the same keys with English fallback text where translation is unavailable.
  **Must NOT do**: Do not create a second settings surface, do not move providers/models/images, and do not hide the session-oriented portions of the app shell.

  **Recommended Agent Profile**:
  - Category: `visual-engineering` — Reason: tab-shell and selector work is app UI composition with existing styling patterns.
  - Skills: [`frontend-ui-ux`] — Reason: ensures the new tabs match the current settings IA and styling.
  - Omitted: [`playwright`] — Reason: implementation does not require browser automation during coding.

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: [3, 6, 7, 8] | Blocked By: []

  **References** (executor has NO interview context — be exhaustive):
  - Pattern: `packages/app/src/components/dialog-settings.tsx:18-77` — existing settings shell, section grouping, and `Tabs.Trigger`/`Tabs.Content` mapping.
  - Pattern: `packages/app/src/components/settings-providers.tsx:128-249` — current settings-page spacing, sticky header, and card styling.
  - Pattern: `packages/app/src/components/settings-images.tsx:139-213` — searchable settings content layout and empty/loading treatment.
  - API/Type: `packages/app/src/i18n/en.ts:1-260` — translation key organization and dict shape.

  **Acceptance Criteria** (agent-executable only):
  - [ ] `cd packages/app && bun test --preload ./happydom.ts ./src/components/dialog-settings.test.tsx` passes with assertions for MCP/Skills tab triggers and scope selector visibility.
  - [ ] `cd packages/app && bun run typecheck` passes after the new i18n keys and tab values are added.

  **QA Scenarios** (MANDATORY — task incomplete without these):

  ```
  Scenario: Settings dialog shows the new management tabs
    Tool: Playwright
    Steps: Start the backend on port 4096 and the app on port 4444; open http://localhost:4444; open Settings; click [data-action="settings-tab-mcp"] and [data-action="settings-tab-skills"].
    Expected: Both tabs render without route changes; [data-action="settings-scope"] is present inside each tab.
    Evidence: .sisyphus/evidence/task-1-settings-shell.png

  Scenario: Project scope selector stays safe when no project override is available
    Tool: Playwright
    Steps: Open Settings in a context without an active git-backed project; inspect [data-action="settings-scope-project"].
    Expected: Project option is hidden or disabled with explanatory helper text; no crash occurs.
    Evidence: .sisyphus/evidence/task-1-settings-shell-error.png
  ```

  **Commit**: NO | Message: `n/a` | Files: `packages/app/src/components/dialog-settings.tsx`, `packages/app/src/i18n/*.ts`

- [ ] 2. Add a scope-aware settings data layer and SDK contract

  **What to do**: Create `packages/ideaspace/src/server/routes/settings.ts` plus `packages/ideaspace/src/settings/index.ts` for exact-scope reads/writes rather than relying on merged config only. Implement explicit target helpers for `global` and `project` scope, where `project` always means the local override file `<worktree>/.ideaspace/ideaspace.json{c}` rather than the repo-root `ideaspace.json`. Expose read/write endpoints for scoped config plus list metadata needed by the app, regenerate the JS SDK with `./packages/sdk/js/script/build.ts`, and add an app-side controller in `packages/app/src/context/settings-config.tsx` that uses the generated client plus `useGlobalSync`, `useSync`, and `usePlatform` to manage scope state, pending saves, reload locks, and origin classification.
  **Must NOT do**: Do not reuse `Config.update()` for project override writes, because it edits the repo-root config file. Do not infer project override state from merged config alone.

  **Recommended Agent Profile**:
  - Category: `deep` — Reason: this task decides the cross-package contract and precedence semantics for the feature.
  - Skills: [] — Reason: the repo already contains the needed patterns.
  - Omitted: [`frontend-ui-ux`] — Reason: this is mostly contract and state management, not visual polish.

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: [4, 5, 6, 7, 8, 9] | Blocked By: []

  **References** (executor has NO interview context — be exhaustive):
  - Pattern: `packages/app/src/context/global-sync.tsx:340-378` — current global config save/reload behavior.
  - Pattern: `packages/app/src/context/sync.tsx:92-177` — current project-scoped store access pattern.
  - API/Type: `packages/app/src/context/platform.tsx:39-46` — platform picker API already available to shared app code.
  - Pattern: `packages/ideaspace/src/config/paths.ts:22-48` — config directory resolution and `.ideaspace` file targeting.
  - Pattern: `packages/ideaspace/src/config/config.ts:987-1083` — `Config.Info`, `skills`, and `mcp` schema definitions.
  - Pattern: `packages/ideaspace/src/config/config.ts:1294-1399` — current config update semantics and disposal behavior.
  - Pattern: `packages/ideaspace/src/cli/cmd/mcp.ts:383-417` — exact-file resolution and JSONC-preserving config patching.
  - Test: `packages/ideaspace/test/config/config.test.ts:1487-1528` — `.ideaspace` local override precedence for MCP.
  - External: `AGENTS.md` — regenerate the JS SDK after adding backend routes.

  **Acceptance Criteria** (agent-executable only):
  - [ ] `cd packages/ideaspace && bun test test/config/config.test.ts` passes with new cases proving project-scope settings writes land in `<worktree>/.ideaspace/ideaspace.json{c}` and not repo-root `ideaspace.json`.
  - [ ] `./packages/sdk/js/script/build.ts` completes successfully and the app compiles against the regenerated client.
  - [ ] `cd packages/app && bun run typecheck` passes with the new controller/hook and generated SDK types.

  **QA Scenarios** (MANDATORY — task incomplete without these):

  ```
  Scenario: Scope writes hit the correct config layer
    Tool: Bash
    Steps: Run targeted backend tests that write global and project-scoped settings; inspect the temporary fixture outputs for ~/.config/ideaspace/ideaspace.json{c} and <worktree>/.ideaspace/ideaspace.json.
    Expected: Global writes touch only the global target; project writes touch only .ideaspace override files; repo-root ideaspace.json remains unchanged.
    Evidence: .sisyphus/evidence/task-2-scoped-config.txt

  Scenario: Controller blocks concurrent saves during reload
    Tool: Bash
    Steps: Run app unit tests for the new controller with a mocked pending save followed by a second save attempt.
    Expected: The second save is rejected or queued deterministically; no duplicate request is issued.
    Evidence: .sisyphus/evidence/task-2-controller-lock.txt
  ```

  **Commit**: NO | Message: `n/a` | Files: `packages/ideaspace/src/config/**`, `packages/ideaspace/src/server/routes/**`, `packages/sdk/js/**`, `packages/app/src/context/**`

- [ ] 3. Standardize native picker-backed import dialogs in the app shell

  **What to do**: Add dedicated MCP and Skill import dialogs/components in `packages/app/src/components/` that use `usePlatform().openFilePickerDialog()` and `openDirectoryPickerDialog()` instead of adding new desktop-only bindings. Lock v1 sources to local-first only: MCP imports come from `.json`/`.jsonc` files; skills come from either a directory selection or a single `SKILL.md` file. Add deterministic selectors: `mcp-import-open`, `mcp-import-file`, `mcp-import-submit`, `skill-import-open`, `skill-import-file`, `skill-import-dir`, `skill-import-submit`, and conflict-dialog selectors for replace/cancel.
  **Must NOT do**: Do not add remote URL import UI in v1, do not add drag-and-drop, and do not bypass the platform picker APIs already exposed through the desktop host.

  **Recommended Agent Profile**:
  - Category: `visual-engineering` — Reason: dialog UX and picker wiring live in the shared app shell.
  - Skills: [`frontend-ui-ux`] — Reason: dialog ergonomics and button states need to match the rest of Settings.
  - Omitted: [`git-master`] — Reason: no git-specific work is needed in this task.

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: [4, 5, 6, 7] | Blocked By: [1]

  **References** (executor has NO interview context — be exhaustive):
  - Pattern: `packages/app/src/context/platform.tsx:39-46` — shared picker contract available to the app.
  - Pattern: `packages/desktop/src/index.tsx:87-118` — desktop implementation of file/directory/save dialogs through Tauri plugin-dialog.
  - Pattern: `packages/app/src/components/dialog-select-mcp.tsx:16-103` — dialog composition pattern and item-level loading states.
  - Pattern: `packages/app/src/components/settings-providers.tsx:196-245` — settings CTA/button placement and dialog-launch flow.

  **Acceptance Criteria** (agent-executable only):
  - [ ] `cd packages/app && bun test --preload ./happydom.ts ./src/components/dialog-import-mcp.test.tsx ./src/components/dialog-import-skill.test.tsx` passes.
  - [ ] `cd packages/app && bun run typecheck` passes with the new dialog components and selector attributes.

  **QA Scenarios** (MANDATORY — task incomplete without these):

  ```
  Scenario: MCP import dialog requests a local config file
    Tool: Bash
    Steps: Run the dialog unit test that triggers [data-action="mcp-import-open"] and stubs openFilePickerDialog() to return /tmp/mcp.jsonc.
    Expected: The dialog stores the returned path, enables [data-action="mcp-import-submit"], and forwards the selected file path to the controller callback.
    Evidence: .sisyphus/evidence/task-3-mcp-dialog.txt

  Scenario: Skill import dialog handles cancel safely
    Tool: Bash
    Steps: Run the dialog unit test with openDirectoryPickerDialog() and openFilePickerDialog() both returning null.
    Expected: No submit callback is fired and the dialog remains in a non-error idle state.
    Evidence: .sisyphus/evidence/task-3-skill-dialog-error.txt
  ```

  **Commit**: NO | Message: `n/a` | Files: `packages/app/src/components/dialog-import-*.tsx`

- [ ] 4. Implement managed Skill import and removal in the runtime

  **What to do**: Implement the managed skill import/remove operations inside `packages/ideaspace/src/settings/index.ts` and expose them from `packages/ideaspace/src/server/routes/settings.ts`. The flow must (a) inspect a local source path, (b) validate that the import target is either a single `SKILL.md` file or a directory with a root `SKILL.md`, (c) parse frontmatter with the existing markdown/config parser, (d) normalize the managed target slug from the skill `name`, (e) copy the source into `${Global.Path.config}/skills/<slug>/` for global scope or `<worktree>/.ideaspace/skills/<slug>/` for project scope, and (f) remove only managed skills from those exact targets. On duplicate slug or duplicate skill name, require an explicit `replace: true` request from the UI; v1 supports Replace or Cancel only—no rename path.
  **Must NOT do**: Do not mutate `.claude/skills`, `.agents/skills`, or URL-pulled caches. Do not accept nested archives or directories without a root `SKILL.md`. Do not partially copy on validation failure.

  **Recommended Agent Profile**:
  - Category: `deep` — Reason: this is filesystem-heavy runtime behavior with precedence and safety constraints.
  - Skills: [] — Reason: repo-native file and config utilities are sufficient.
  - Omitted: [`frontend-ui-ux`] — Reason: no visual work belongs here.

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: [7, 8, 9] | Blocked By: [2, 3]

  **References** (executor has NO interview context — be exhaustive):
  - Pattern: `packages/ideaspace/src/skill/skill.ts:45-188` — existing discovery rules, external-directory handling, and config-directory scanning.
  - Pattern: `packages/ideaspace/src/config/paths.ts:22-48` — `.ideaspace` directory targeting.
  - Pattern: `packages/ideaspace/src/global/index.ts:14-35` — `Global.Path.config` and config/data directory setup.
  - Pattern: `packages/ideaspace/src/config/config.ts:659-666` — `skills.paths` and `skills.urls` schema shape.
  - Pattern: `packages/ideaspace/test/skill/skill.test.ts:25-251` — current skill discovery expectations and fixture layout.
  - Pattern: `packages/app/src/context/platform.tsx:39-43` — source-path types that will come from the app layer.

  **Acceptance Criteria** (agent-executable only):
  - [ ] `cd packages/ideaspace && bun test test/skill/skill.test.ts test/config/config.test.ts` passes with new cases for managed global import, managed project import, replace-on-duplicate, and managed removal.
  - [ ] Importing a directory without a root `SKILL.md` fails with a deterministic validation error from the new route/service test.

  **QA Scenarios** (MANDATORY — task incomplete without these):

  ```
  Scenario: Managed project skill import becomes discoverable
    Tool: Bash
    Steps: Run a backend integration test that imports /tmp/example-skill into project scope, then call Skill.all() inside the same fixture project.
    Expected: The copied target exists at <worktree>/.ideaspace/skills/example-skill/SKILL.md and Skill.all() returns the imported skill.
    Evidence: .sisyphus/evidence/task-4-skill-import.txt

  Scenario: External skill cannot be removed through managed delete
    Tool: Bash
    Steps: Run a backend integration test with a skill discovered from .claude/skills and request removal through the new managed-delete route.
    Expected: The route returns a non-success error explaining the item is not managed by Ideaspace; the external files remain untouched.
    Evidence: .sisyphus/evidence/task-4-skill-import-error.txt
  ```

  **Commit**: NO | Message: `n/a` | Files: `packages/ideaspace/src/server/routes/**`, `packages/ideaspace/src/skill/**`, `packages/ideaspace/test/skill/**`

- [ ] 5. Implement MCP import, normalization, and scoped removal in the runtime

  **What to do**: Extend `packages/ideaspace/src/settings/index.ts` and `packages/ideaspace/src/server/routes/settings.ts` to support local MCP import from `.json` or `.jsonc` files. Accept two input shapes only: `{ "mcp": { ... } }` or a single MCP entry object that the route wraps under a provided `name`. Validate entries against `Config.Mcp`, normalize name collisions, and persist them into the selected scope file using the same JSONC-preserving strategy already used by the CLI add flow. Add scoped removal that deletes the named MCP entry from the selected scope file. Keep runtime connect/disconnect/auth as separate route calls; import/save must only touch config.
  **Must NOT do**: Do not import OAuth tokens/secrets beyond config fields already allowed by `Config.Mcp`. Do not auto-connect an MCP just because it was imported. Do not write project-scope MCP config into repo-root `ideaspace.json`.

  **Recommended Agent Profile**:
  - Category: `deep` — Reason: schema validation, scoped persistence, and collision behavior are backend-contract work.
  - Skills: [] — Reason: existing config and MCP patterns are already in-repo.
  - Omitted: [`playwright`] — Reason: implementation should be covered by integration tests, not browser tooling.

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: [6, 8, 9] | Blocked By: [2, 3]

  **References** (executor has NO interview context — be exhaustive):
  - Pattern: `packages/ideaspace/src/server/routes/mcp.ts:9-224` — existing MCP status/connect/disconnect/auth endpoints.
  - Pattern: `packages/ideaspace/src/config/config.ts:1070-1083` — MCP schema and allowed entry shapes.
  - Pattern: `packages/ideaspace/src/cli/cmd/mcp.ts:419-579` — current CLI add UX and normalization decisions for local vs remote MCPs.
  - Pattern: `packages/ideaspace/src/cli/cmd/mcp.ts:383-417` — JSONC patching and config-file resolution.
  - Test: `packages/ideaspace/test/config/config.test.ts:1382-1528` — MCP merge behavior and `.ideaspace` override precedence.

  **Acceptance Criteria** (agent-executable only):
  - [ ] `cd packages/ideaspace && bun test test/config/config.test.ts test/mcp/headers.test.ts` passes with new cases for JSON import, JSONC import, single-entry import, duplicate replace protection, and scoped delete.
  - [ ] Importing an invalid MCP payload returns a validation error and leaves the target config file unchanged.

  **QA Scenarios** (MANDATORY — task incomplete without these):

  ```
  Scenario: Scoped MCP import patches only the selected config file
    Tool: Bash
    Steps: Run a backend integration test that imports /tmp/jira-mcp.jsonc into project scope and then inspects both <worktree>/.ideaspace/ideaspace.jsonc and the global config file.
    Expected: The imported `mcp.jira` entry appears only in the project override file; the global file is unchanged.
    Evidence: .sisyphus/evidence/task-5-mcp-import.txt

  Scenario: Invalid MCP import preserves existing config
    Tool: Bash
    Steps: Seed a valid config, attempt to import a malformed MCP JSON file, then re-read the target file.
    Expected: The request fails with a schema/parse error and the original config content remains byte-for-byte intact.
    Evidence: .sisyphus/evidence/task-5-mcp-import-error.txt
  ```

  **Commit**: NO | Message: `n/a` | Files: `packages/ideaspace/src/server/routes/**`, `packages/ideaspace/src/mcp/**`, `packages/ideaspace/test/config/**`, `packages/ideaspace/test/mcp/**`

- [ ] 6. Build the MCP Settings tab over saved config plus live runtime status

  **What to do**: Rewrite `packages/app/src/components/settings-mcp.tsx` into a full management screen. The list must show each MCP’s name, source scope, config type (`local` or `remote`), enabled flag, and current runtime status badge derived from `mcp.status`. Actions must include: import, enable/disable, delete-from-scope, connect now, disconnect, and authenticate for OAuth-capable remote MCPs. Use explicit save/apply for config mutations and optimistic rollback on failure. Expose selectors: `mcp-row-<name>`, `mcp-enable-<name>`, `mcp-delete-<name>`, `mcp-connect-<name>`, `mcp-disconnect-<name>`, `mcp-auth-<name>`.
  **Must NOT do**: Do not make connect/disconnect toggle persisted config implicitly. Do not let delete remove an inherited/global item while the user is in project scope; instead show a read-only origin badge.

  **Recommended Agent Profile**:
  - Category: `visual-engineering` — Reason: this is the main UI assembly task for MCP management.
  - Skills: [`frontend-ui-ux`] — Reason: the screen needs a clear split between config and runtime actions.
  - Omitted: [`git-master`] — Reason: no git-specific operations are part of the implementation.

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: [8, 9] | Blocked By: [1, 2, 3, 5]

  **References** (executor has NO interview context — be exhaustive):
  - Pattern: `packages/app/src/components/settings-mcp.tsx:4-15` — placeholder to replace.
  - Pattern: `packages/app/src/components/dialog-select-mcp.tsx:22-101` — current runtime MCP list behavior and loading-state expectations.
  - Pattern: `packages/app/src/components/settings-providers.tsx:83-125` — optimistic update + rollback + toast pattern.
  - Pattern: `packages/app/src/components/settings-images.tsx:102-118` — config mutation with rollback on failure.
  - API/Type: `packages/ideaspace/src/server/routes/mcp.ts:63-224` — runtime actions available after config is saved.

  **Acceptance Criteria** (agent-executable only):
  - [ ] `cd packages/app && bun test --preload ./happydom.ts ./src/components/settings-mcp.test.tsx` passes with cases for scope switching, import success, duplicate collision messaging, and runtime action button states.
  - [ ] `cd packages/app && bun run typecheck` passes with the rewritten MCP settings screen.

  **QA Scenarios** (MANDATORY — task incomplete without these):

  ```
  Scenario: Import and connect a remote MCP from Settings
    Tool: Playwright
    Steps: Start the backend/app; open Settings; click [data-action="settings-tab-mcp"]; click [data-action="mcp-import-open"]; choose a valid local JSONC file for `jira`; submit; then click [data-action="mcp-connect-jira"].
    Expected: [data-action="mcp-row-jira"] appears with a saved-scope badge, then runtime status transitions to connected without removing the saved config metadata.
    Evidence: .sisyphus/evidence/task-6-mcp-ui.png

  Scenario: Duplicate MCP import requires explicit replacement
    Tool: Playwright
    Steps: Import the same `jira` MCP twice; on the second attempt, inspect the conflict dialog.
    Expected: The second import is blocked until [data-action="conflict-replace"] is pressed; cancelling leaves the original config untouched.
    Evidence: .sisyphus/evidence/task-6-mcp-ui-error.png
  ```

  **Commit**: YES | Message: `feat(settings): add scope-aware MCP management in desktop settings` | Files: `packages/app/src/components/dialog-settings.tsx`, `packages/app/src/components/settings-mcp.tsx`, `packages/app/src/components/dialog-import-mcp.tsx`, `packages/app/src/context/settings-config.tsx`, `packages/app/src/i18n/*.ts`

- [ ] 7. Build the Skills Settings tab with managed/inherited origin handling

  **What to do**: Add `packages/app/src/components/settings-skills.tsx` and wire it into the Settings dialog. The screen must show all discovered skills from `app.skills()` but classify each one into `managed-global`, `managed-project`, `inherited-external`, or `inherited-url-cache` based on the returned `location` and current path metadata. Managed items get Remove actions for their own scope; inherited items are read-only and can only be inspected. Import actions must support local file or directory sources through the dialogs from Task 3 and route them to the managed skill import service from Task 4. Expose selectors: `skill-row-<name>`, `skill-origin-<name>`, `skill-remove-<name>`, `skill-open-location-<name>`.
  **Must NOT do**: Do not allow removing inherited items, do not hide the physical source location, and do not treat URL-cached or `.claude`/`.agents` skills as managed.

  **Recommended Agent Profile**:
  - Category: `visual-engineering` — Reason: this is the main UI assembly task for skill management.
  - Skills: [`frontend-ui-ux`] — Reason: the read-only vs managed distinction must be legible and low-friction.
  - Omitted: [`playwright`] — Reason: use it for QA, not implementation.

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: [8, 9] | Blocked By: [1, 2, 3, 4]

  **References** (executor has NO interview context — be exhaustive):
  - Pattern: `packages/ideaspace/src/server/server.ts:440-459` — existing `app.skills` endpoint.
  - Pattern: `packages/ideaspace/src/skill/discovery.ts:18-96` — cache-backed URL skill directory location (`Global.Path.cache/skills`).
  - Pattern: `packages/ideaspace/src/cli/cmd/tui/component/dialog-skill.tsx:15-35` — current skill list retrieval and presentation shape.
  - Pattern: `packages/ideaspace/src/skill/skill.ts:90-169` — how external/global/project skill locations are discovered.
  - Pattern: `packages/app/src/components/settings-providers.tsx:136-249` — section/card/list action layout.
  - Pattern: `packages/app/src/context/platform.tsx:24-25` — openPath support for revealing local managed locations.

  **Acceptance Criteria** (agent-executable only):
  - [ ] `cd packages/app && bun test --preload ./happydom.ts ./src/components/settings-skills.test.tsx` passes with cases for origin classification, managed remove availability, and inherited read-only rendering.
  - [ ] `cd packages/app && bun run typecheck` passes with the new skills screen added to settings.

  **QA Scenarios** (MANDATORY — task incomplete without these):

  ```
  Scenario: Import a local skill folder into project scope
    Tool: Playwright
    Steps: Start the backend/app; open Settings; click [data-action="settings-tab-skills"]; select Project scope; click [data-action="skill-import-open"]; choose a directory containing SKILL.md; submit.
    Expected: [data-action="skill-row-example-skill"] appears with [data-action="skill-origin-example-skill"] = managed-project and [data-action="skill-remove-example-skill"] visible.
    Evidence: .sisyphus/evidence/task-7-skills-ui.png

  Scenario: External skill remains read-only
    Tool: Playwright
    Steps: Seed a fixture project with a `.claude/skills/claude-skill/SKILL.md`; open the Skills tab.
    Expected: The row is visible, origin is labeled inherited-external, and no [data-action="skill-remove-claude-skill"] control is rendered.
    Evidence: .sisyphus/evidence/task-7-skills-ui-error.png
  ```

  **Commit**: NO | Message: `n/a` | Files: `packages/app/src/components/settings-skills.tsx`, `packages/app/src/components/dialog-import-skill.tsx`, `packages/app/src/context/**`

- [ ] 8. Add automated coverage for scoped settings, imports, and collisions

  **What to do**: Add or extend tests so the feature is covered at the right seam in both packages. In `packages/ideaspace`, add integration tests for scoped settings routes, skill import/remove, MCP import/remove, duplicate collision handling, and invalid payload preservation. In `packages/app`, add unit tests for the shared controller, MCP settings screen, Skills settings screen, and import dialogs/selectors. Make every new selector and conflict path explicitly asserted so later UI QA remains stable.
  **Must NOT do**: Do not rely on snapshot-only tests, do not use mocks that duplicate business logic, and do not skip failure-path assertions.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` — Reason: the work spans app and backend test harnesses with multiple edge cases.
  - Skills: [] — Reason: repo test patterns are already established.
  - Omitted: [`frontend-ui-ux`] — Reason: this is verification-focused.

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: [9] | Blocked By: [2, 4, 5, 6, 7]

  **References** (executor has NO interview context — be exhaustive):
  - Test: `packages/app/src/components/settings-images.test.ts:1-200` — current app settings unit-test style.
  - Test: `packages/ideaspace/test/skill/skill.test.ts:25-388` — skill fixture and discovery patterns.
  - Test: `packages/ideaspace/test/config/config.test.ts:434-489` — `.ideaspace` config fixture setup.
  - Test: `packages/ideaspace/test/cli/import.test.ts:1-38` — parser/transform test style for import features.

  **Acceptance Criteria** (agent-executable only):
  - [ ] `cd packages/app && bun run test:unit` passes.
  - [ ] `cd packages/ideaspace && bun test --timeout 30000` passes with the new settings import coverage included.

  **QA Scenarios** (MANDATORY — task incomplete without these):

  ```
  Scenario: Full automated test suite covers both happy and failure paths
    Tool: Bash
    Steps: Run `bun run test:unit` in packages/app and `bun test --timeout 30000` in packages/ideaspace.
    Expected: Both commands pass; logs contain explicit cases for invalid MCP payloads, duplicate replacements, managed skill deletion, and inherited skill protection.
    Evidence: .sisyphus/evidence/task-8-test-suite.txt

  Scenario: Regression guard catches missing selector contracts
    Tool: Bash
    Steps: Run the new app component tests after temporarily removing one selector in a local scratch run.
    Expected: The targeted selector assertion fails, proving the tests protect the QA contract.
    Evidence: .sisyphus/evidence/task-8-test-suite-error.txt
  ```

  **Commit**: NO | Message: `n/a` | Files: `packages/app/src/**/*.test.tsx`, `packages/ideaspace/test/**`

- [ ] 9. Run desktop-stack verification and scripted smoke for the integrated feature

  **What to do**: After implementation and automated tests are green, run the full desktop-stack verification for `packages/app`, `packages/ideaspace`, and `packages/desktop`. Then run a scripted smoke flow against the app dev stack that covers both tabs, scope switching, one MCP import, one skill import, one managed delete, and one runtime connect/disconnect cycle. Save screenshots/logs under `.sisyphus/evidence/`.
  **Must NOT do**: Do not skip `packages/desktop` build verification just because most changes live in app/runtime. Do not run tests from repo root.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` — Reason: this is multi-package verification and smoke validation.
  - Skills: [] — Reason: commands and selectors are already fixed by earlier tasks.
  - Omitted: [`frontend-ui-ux`] — Reason: the focus is verification, not design iteration.

  **Parallelization**: Can Parallel: NO | Wave 3 | Blocks: [Final Verification Wave] | Blocked By: [2, 6, 7, 8]

  **References** (executor has NO interview context — be exhaustive):
  - Pattern: `README.md` and `packages/app/AGENTS.md` — app/backend local dev commands and verification expectations.
  - Pattern: `packages/desktop/BUILD_APP.md` — use only if native artifact packaging is required; not needed for standard `bun run build` verification.
  - API/Type: `packages/app/src/context/platform.tsx:39-46` and `packages/desktop/src/index.tsx:92-118` — picker behavior verified in the desktop host.

  **Acceptance Criteria** (agent-executable only):
  - [ ] `cd packages/app && bun run typecheck && bun run test:unit && bun run build` passes.
  - [ ] `cd packages/ideaspace && bun run build` passes.
  - [ ] `cd packages/desktop && bun run build` passes.

  **QA Scenarios** (MANDATORY — task incomplete without these):

  ```
  Scenario: End-to-end settings smoke on the dev stack
    Tool: Playwright
    Steps: Start `bun run --conditions=browser ./src/index.ts serve --port 4096` in packages/ideaspace and `bun dev -- --port 4444` in packages/app; open Settings; import one MCP from a local JSONC file; import one skill directory; switch Global/Project scope; remove the managed project skill; connect and disconnect the imported MCP.
    Expected: All actions complete without reload loops or stale UI; saved items persist after reopening Settings; managed delete removes only the managed project skill.
    Evidence: .sisyphus/evidence/task-9-desktop-smoke.png

  Scenario: Desktop verification catches cross-package regressions
    Tool: Bash
    Steps: Run the three package build/test commands listed in Acceptance Criteria.
    Expected: Any app/runtime/desktop integration regression fails one of the package-specific commands before handoff.
    Evidence: .sisyphus/evidence/task-9-desktop-smoke-error.txt
  ```

  **Commit**: YES | Message: `feat(settings): add scoped skill imports and runtime-backed settings flows` | Files: `packages/app/**`, `packages/ideaspace/**`, `packages/sdk/js/**`, `packages/desktop/**`

## Final Verification Wave (4 parallel agents, ALL must APPROVE)

- [ ] F1. Plan Compliance Audit — oracle
- [ ] F2. Code Quality Review — unspecified-high
- [ ] F3. Real Manual QA — unspecified-high (+ playwright if UI)
- [ ] F4. Scope Fidelity Check — deep

## Commit Strategy

- Commit 1: app settings shell, shared controller, picker contract, and MCP settings UI
- Commit 2: backend scoped settings/import flows, Skills UI, tests, and final desktop verification fixes
- Never mix refactors unrelated to MCP/Skills settings into either commit

## Success Criteria

- Users can open Settings and manage MCP + Skills in one place without leaving the desktop shell.
- Scope is explicit and correct: global changes persist globally, project overrides persist to `.ideaspace`.
- MCP imports are validated before save and runtime actions reflect actual status.
- Skill imports copy into managed discovery locations and become visible through `app.skills()` after reload.
- External/inherited skills remain visible but protected from destructive actions.
- Desktop verification passes for `packages/app`, `packages/ideaspace`, and `packages/desktop`.
