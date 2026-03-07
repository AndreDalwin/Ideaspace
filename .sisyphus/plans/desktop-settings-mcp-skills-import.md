# Desktop Settings for Guided MCP Setup and Managed Skills

## TL;DR

> **Summary**: Replace MCP JSON/JSONC file import in desktop Settings with a guided native Add MCP flow, keep Skills as managed full-folder imports, make Settings global-only in v1, and wire both MCPs and skills into the existing agents modal with real runtime enforcement.
> **Deliverables**:
>
> - Global-only MCP Settings tab with guided add/edit, status, connect, disconnect, auth, and guarded delete
> - Global-only Skills Settings tab with managed full-folder import, origin badges, and managed removal
> - Backend global settings/import services that preserve repo-native MCP config behavior and skill discovery behavior
> - Agents modal MCP/skill controls plus runtime allowlist enforcement with main-agent default allow and subagent default deny
> - Automated app/runtime tests plus desktop-stack verification
>   **Effort**: Large
>   **Parallel**: YES - 3 waves
>   **Critical Path**: 2 → 4/5 → 6/7/8 → 9 → 10 → 11

## Context

### Original Request

Update the desktop MCP and Skills settings plan so MCP setup follows a repo-native guided flow instead of JSON/JSONC import, skills copy the whole folder, Settings assumes global scope for now, and new MCPs/skills are exposed in the agents modal with default allow on main agents only.

### Interview Summary

- MCP JSON/JSONC import in Settings is no longer the preferred v1 UX.
- Cursor and Windsurf both use guided native MCP setup as the primary flow, with raw config as fallback/power-user behavior.
- Skill import must copy the whole skill folder, not just `SKILL.md`, because skill execution can reference sibling files.
- Settings v1 should be global-only; project scope is deferred.
- The existing agents modal should be the single place for per-agent MCP/skill allow-disallow behavior.
- Default policy: new MCPs and skills are available to main agents (`primary` / `all`) by default, and unavailable to subagents by default until explicitly allowed.

### Metis Review (gaps addressed)

- Added explicit runtime enforcement for MCP and skill allowlists; the agents modal must not remain UI-only.
- Removed project-scope work from Settings v1 and documented it as deferred rather than half-supported.
- Replaced raw MCP file import with a guided form that mirrors the existing CLI field set and writes config with JSONC-preserving edits.
- Kept managed skill import as full-folder copy because the skill tool exposes sibling files from the skill directory.
- Added guardrails for MCP client-name sanitization collisions and for destructive removal semantics on global config.

## Work Objectives

### Core Objective

Ship a desktop-first global Settings experience that lets users add/manage MCP servers and managed skills through guided UI, while keeping runtime behavior, config persistence, and agent-level access control aligned with the repo’s existing MCP, skill, and agent systems.

### Deliverables

- `packages/app` Settings dialog extended with MCP and Skills tabs for global management.
- Guided Add/Edit MCP dialog that mirrors the repo’s native CLI MCP field set.
- Managed global skill import/remove flow that copies the full skill directory.
- `packages/ideaspace` services/routes for global MCP persistence and managed skill operations.
- Agents modal updates for MCP/skill visibility and explicit per-agent overrides.
- Backend runtime enforcement so agent selections actually control available MCP tools and skills.
- Automated tests and desktop verification for app, runtime, and desktop packages.

### Definition of Done (verifiable conditions with commands)

- `cd packages/app && bun run test:unit && bun run typecheck && bun run build`
- `cd packages/ideaspace && bun test --timeout 30000 && bun run build`
- `cd packages/desktop && bun run build`

### Must Have

- `packages/app/src/components/dialog-settings.tsx` remains the primary shell for desktop Settings.
- Settings v1 is explicitly **global-only** for MCP and Skills; no project write path or scope selector is shown in Settings.
- MCP setup uses a guided native form based on the repo’s existing MCP config schema and CLI add flow; no JSON/JSONC file import UX in Settings v1.
- Managed skill import copies the full selected skill directory into `${Global.Path.config}/skills/<slug>/...`.
- Selecting a single `SKILL.md` file copies its containing directory contents, not just the markdown file.
- Skills UI distinguishes `managed-global`, `inherited-external`, and `inherited-url-cache` origins.
- Agent detail UI exposes MCP and skill controls in the existing modal/screen.
- Default inheritance is explicit in the plan: main agents (`primary` / `all`) inherit all currently available MCPs/skills when no per-agent override is set; subagents inherit none when no override is set.
- MCP tool availability is enforced at runtime in the session prompt/tool-resolution path, not just in UI state.
- Skill availability is enforced at runtime using the effective per-agent allowlist before the skill tool is exposed/executed.
- Delete/remove flows are truthful: managed skills can be deleted; MCP delete only ships with exact-file removal semantics that preserve JSONC/comments.

### Must NOT Have (guardrails, AI slop patterns, scope boundaries)

- No new settings surface outside the existing dialog.
- No project-scope MCP/skill settings in v1 desktop Settings.
- No MCP JSON/JSONC file import button in v1 desktop Settings.
- No registry/marketplace browser for MCPs or skills.
- No skill authoring/editor flow.
- No mutation of inherited `.claude`, `.agents`, or URL-cached skills from the UI.
- No UI-only MCP/skill allow-disallow behavior in the agents modal without backend/runtime enforcement.
- No tool-ID collision blindness: MCP names that sanitize to an existing connected tool namespace must be rejected with clear error messaging.

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

- settings shell and global-only IA
- global settings controller / route contract
- guided MCP dialog contract
- backend global MCP persistence
- backend managed global skill import/remove

Wave 2: feature assembly and enforcement (Tasks 6-9)

- MCP settings screen
- Skills settings screen
- agents modal MCP/skill controls
- runtime MCP/skill allowlist enforcement

Wave 3: coverage and integration verification (Tasks 10-11)

- automated coverage across app/runtime
- desktop-stack verification and scripted smoke

### Dependency Matrix (full, all tasks)

| Task | Depends On       | Blocks                   |
| ---- | ---------------- | ------------------------ |
| 1    | none             | 3, 6, 7                  |
| 2    | none             | 4, 5, 6, 7, 8, 9, 10, 11 |
| 3    | 1, 2             | 4, 6                     |
| 4    | 2, 3             | 6, 8, 9, 10, 11          |
| 5    | 2                | 7, 8, 9, 10, 11          |
| 6    | 1, 2, 3, 4       | 10, 11                   |
| 7    | 1, 2, 5          | 10, 11                   |
| 8    | 2, 4, 5          | 9, 10, 11                |
| 9    | 4, 5, 8          | 10, 11                   |
| 10   | 4, 5, 6, 7, 8, 9 | 11                       |
| 11   | 6, 7, 8, 9, 10   | Final Verification       |

### Agent Dispatch Summary (wave → task count → categories)

- Wave 1 → 5 tasks → visual-engineering (1, 3), deep (2, 4, 5)
- Wave 2 → 4 tasks → visual-engineering (6, 7, 8), deep (9)
- Wave 3 → 2 tasks → unspecified-high (10, 11)

## TODOs

> Implementation + Test = ONE task. Never separate.
> EVERY task MUST have: Agent Profile + Parallelization + QA Scenarios.

- [ ] 1. Extend the Settings shell for global MCP and Skills management

  **What to do**: Update `packages/app/src/components/dialog-settings.tsx` to add `mcp` and `skills` tabs under the existing server section, keeping the current tab layout and sticky content pattern. Do **not** render a scope selector in v1; instead make the screens clearly global-only with copy/badges inside the tab content. Add selectors `settings-tab-mcp` and `settings-tab-skills`, and add the required i18n keys in `packages/app/src/i18n/*.ts` while keeping locale parity compiling.
  **Must NOT do**: Do not add a project/global scope selector, do not create a second settings surface, and do not move the session-oriented shell out of the current dialog.

  **Recommended Agent Profile**:
  - Category: `visual-engineering` — Reason: this is settings IA and tab-shell composition work.
  - Skills: [`frontend-ui-ux`] — Reason: the new tabs should match the current Settings visual system.
  - Omitted: [`playwright`] — Reason: browser automation belongs in QA, not implementation.

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: [3, 6, 7] | Blocked By: []

  **References** (executor has NO interview context — be exhaustive):
  - Pattern: `packages/app/src/components/dialog-settings.tsx:18-79` — current settings dialog tab shell and section structure.
  - Pattern: `packages/app/src/components/settings-providers.tsx:128-249` — sticky header, content width, and section/card spacing pattern.
  - Pattern: `packages/app/src/components/settings-images.tsx:102-118` — optimistic settings mutation UI pattern.
  - API/Type: `packages/app/src/i18n/en.ts:617-823` — existing settings key organization including current MCP entries.
  - Test: `packages/app/src/components/dialog-settings.test.tsx` — existing shell test entrypoint to expand.

  **Acceptance Criteria** (agent-executable only):
  - [ ] `cd packages/app && bun run test:unit` passes with updated settings-shell assertions for MCP and Skills tabs.
  - [ ] `cd packages/app && bun run typecheck` passes after tab values and i18n keys are added.

  **QA Scenarios** (MANDATORY — task incomplete without these):

  ```
  Scenario: Settings dialog shows MCP and Skills tabs
    Tool: Bash
    Steps: Run the app unit tests that mount the settings dialog and assert [data-action="settings-tab-mcp"] and [data-action="settings-tab-skills"] are present.
    Expected: Both tab triggers render in the existing dialog shell and no project/global selector is rendered.
    Evidence: .sisyphus/evidence/task-1-settings-shell.txt

  Scenario: Global-only copy is explicit
    Tool: Bash
    Steps: Run the updated dialog/settings component test that opens the MCP tab and inspects the rendered copy.
    Expected: The screen clearly labels the surface as global-only and does not expose a project override control.
    Evidence: .sisyphus/evidence/task-1-settings-shell-error.txt
  ```

  **Commit**: NO | Message: `n/a` | Files: `packages/app/src/components/dialog-settings.tsx`, `packages/app/src/i18n/*.ts`

- [ ] 2. Add a global-only settings controller and backend settings contract

  **What to do**: Create a global-only settings controller in `packages/app/src/context/settings-config.tsx` and add backend settings surfaces in `packages/ideaspace/src/settings/index.ts` plus `packages/ideaspace/src/server/routes/settings.ts`. The controller should aggregate MCP config data, MCP runtime status, skill catalog data, and mutation state for the new settings tabs. Backend routes should expose global-only MCP and skill operations plus any list metadata the app needs. For destructive MCP mutations, do not rely on merge-only `globalSync.updateConfig`; instead add exact-file helpers that can update or remove `mcp.<name>` entries while preserving JSONC comments/order.
  **Must NOT do**: Do not add project-scope writes or a fake scope parameter. Do not use merge-only config updates for MCP delete semantics where key removal must actually occur.

  **Recommended Agent Profile**:
  - Category: `deep` — Reason: this task defines the cross-package contract and truth model for the entire feature.
  - Skills: [] — Reason: the repo already contains the relevant config and route patterns.
  - Omitted: [`frontend-ui-ux`] — Reason: this is contract/state work, not visual polish.

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: [4, 5, 6, 7, 8, 9, 10, 11] | Blocked By: []

  **References** (executor has NO interview context — be exhaustive):
  - Pattern: `packages/app/src/context/global-sync.tsx:350-364` — existing global config save/reload behavior.
  - Pattern: `packages/app/src/context/agents.tsx:29-105` — config fetch/update/remove pattern tied to `globalSync`.
  - API/Type: `packages/app/src/context/platform.tsx:39-46` — picker APIs already available to shared app code.
  - Pattern: `packages/ideaspace/src/cli/cmd/mcp.ts:383-417` — config-file resolution and JSONC-preserving `mcp` patch helper.
  - Pattern: `packages/ideaspace/src/config/config.ts:1070-1083` — top-level `mcp` config shape.
  - Pattern: `packages/ideaspace/src/server/routes/mcp.ts:11-224` — existing runtime MCP status/connect/disconnect/auth routes.
  - Pattern: `packages/ideaspace/src/server/server.ts:440-459` — existing `app.skills` endpoint shape.

  **Acceptance Criteria** (agent-executable only):
  - [ ] `cd packages/ideaspace && bun test --timeout 30000` passes with new global settings route/service coverage.
  - [ ] `./packages/sdk/js/script/build.ts` completes successfully after route changes.
  - [ ] `cd packages/app && bun run typecheck` passes with the new settings controller and generated SDK types.

  **QA Scenarios** (MANDATORY — task incomplete without these):

  ```
  Scenario: MCP delete semantics remove the exact global config key
    Tool: Bash
    Steps: Run a backend test that seeds two MCP entries in the global config, deletes one through the new settings route, then re-reads the config file text.
    Expected: Only the requested `mcp.<name>` key is removed; unrelated entries and surrounding JSONC comments remain intact.
    Evidence: .sisyphus/evidence/task-2-settings-contract.txt

  Scenario: Controller prevents overlapping saves
    Tool: Bash
    Steps: Run app unit tests for the new controller with two rapid mutations triggered while the first save is pending.
    Expected: The second mutation is serialized or rejected deterministically; no duplicate inconsistent request is sent.
    Evidence: .sisyphus/evidence/task-2-settings-contract-error.txt
  ```

  **Commit**: NO | Message: `n/a` | Files: `packages/ideaspace/src/settings/**`, `packages/ideaspace/src/server/routes/settings.ts`, `packages/sdk/js/**`, `packages/app/src/context/settings-config.tsx`

- [ ] 3. Build a guided Add/Edit MCP dialog that mirrors the native CLI flow

  **What to do**: Add app-side MCP dialog components in `packages/app/src/components/` that collect the repo-native MCP fields directly instead of importing `.json` / `.jsonc` payloads. The dialog must support: name, type (`local` or `remote`), local command (plus optional argument splitting/editing), remote URL, OAuth on/off, optional client ID/client secret, optional headers/env editing, and enabled state. Use selectors `mcp-add-open`, `mcp-edit-<name>`, `mcp-field-name`, `mcp-field-type`, `mcp-field-command`, `mcp-field-url`, `mcp-field-oauth`, `mcp-submit`, and `mcp-cancel`.
  **Must NOT do**: Do not add a raw JSON/JSONC upload/import button. Do not invent a field set that diverges from the existing MCP schema/CLI semantics.

  **Recommended Agent Profile**:
  - Category: `visual-engineering` — Reason: dialog composition and conditional form UX live in the shared app shell.
  - Skills: [`frontend-ui-ux`] — Reason: field grouping and affordances should match modern guided MCP setup patterns.
  - Omitted: [`git-master`] — Reason: no git-specific work is needed.

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: [4, 6] | Blocked By: [1, 2]

  **References** (executor has NO interview context — be exhaustive):
  - Pattern: `packages/ideaspace/src/cli/cmd/mcp.ts:419-577` — authoritative MCP add flow and required field decisions.
  - Pattern: `packages/app/src/components/dialog-select-mcp.tsx:16-103` — dialog composition and MCP list behavior already in the app.
  - Pattern: `packages/app/src/components/settings-providers.tsx:196-245` — CTA and dialog-launch pattern.
  - External: `https://cursor.com/help/customization/mcp` — guided MCP setup as primary UX pattern.
  - External: `https://docs.windsurf.com/windsurf/cascade/mcp` — guided MCP management plus raw-config fallback as non-primary UX.

  **Acceptance Criteria** (agent-executable only):
  - [ ] `cd packages/app && bun run test:unit` passes with dialog tests for local and remote MCP form states.
  - [ ] `cd packages/app && bun run typecheck` passes with the new MCP dialog components.

  **QA Scenarios** (MANDATORY — task incomplete without these):

  ```
  Scenario: Guided MCP dialog switches between local and remote fields
    Tool: Bash
    Steps: Run the dialog component test that selects `local`, then `remote`, and inspects the rendered inputs.
    Expected: Command fields render only for local; URL/OAuth fields render only for remote; submit stays disabled until required fields are complete.
    Evidence: .sisyphus/evidence/task-3-mcp-dialog.txt

  Scenario: Guided MCP dialog rejects incomplete payloads before save
    Tool: Bash
    Steps: Run the dialog test with empty name and empty URL/command for both transport types.
    Expected: Validation prevents submit and surfaces deterministic inline errors without calling the controller.
    Evidence: .sisyphus/evidence/task-3-mcp-dialog-error.txt
  ```

  **Commit**: NO | Message: `n/a` | Files: `packages/app/src/components/dialog-mcp-*.tsx`

- [ ] 4. Implement global MCP persist/update/delete with JSONC-preserving writes and collision guards

  **What to do**: Implement global MCP create/update/delete operations in `packages/ideaspace/src/settings/index.ts` and expose them from `packages/ideaspace/src/server/routes/settings.ts`. Persist the MCP config using structured payloads validated against `Config.Mcp` and reuse the existing JSONC-preserving patch pattern from the CLI. Add explicit guards for duplicate MCP names and for sanitized-client collisions against existing MCP namespaces, using the same sanitization rule as runtime tool naming. Keep runtime actions (`status`, `connect`, `disconnect`, `authenticate`) separate from config persistence.
  **Must NOT do**: Do not import raw JSON/JSONC payload files. Do not auto-connect an MCP on save. Do not silently accept two MCP names that sanitize to the same tool namespace.

  **Recommended Agent Profile**:
  - Category: `deep` — Reason: this is schema validation, exact-file persistence, and naming guardrail work.
  - Skills: [] — Reason: repo-native config and MCP patterns are already available.
  - Omitted: [`playwright`] — Reason: implementation is backend-first and should be test-driven through Bun tests.

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: [6, 8, 9, 10, 11] | Blocked By: [2, 3]

  **References** (executor has NO interview context — be exhaustive):
  - Pattern: `packages/ideaspace/src/cli/cmd/mcp.ts:383-417` — exact-file `mcp` patching and config-path selection.
  - Pattern: `packages/ideaspace/src/cli/cmd/mcp.ts:419-577` — native MCP field decisions.
  - Pattern: `packages/ideaspace/src/config/config.ts:560-580` — `Config.Mcp` remote/local schema.
  - Pattern: `packages/ideaspace/src/mcp/index.ts:603-643` — runtime tool namespace generation from sanitized client name and tool name.
  - Pattern: `packages/ideaspace/src/server/routes/mcp.ts:11-224` — runtime actions already exposed separately.
  - Test: `packages/ideaspace/test/config/config.test.ts` — existing config test harness to extend.
  - Test: `packages/ideaspace/test/mcp/oauth-browser.test.ts` — existing MCP auth/browser test harness.

  **Acceptance Criteria** (agent-executable only):
  - [ ] `cd packages/ideaspace && bun test test/config/config.test.ts test/mcp/oauth-browser.test.ts` passes with new create/update/delete and collision tests.
  - [ ] Saving an invalid MCP payload or a sanitized-name collision returns a deterministic validation error and leaves the global config file unchanged.

  **QA Scenarios** (MANDATORY — task incomplete without these):

  ```
  Scenario: Guided MCP save writes only the global config file
    Tool: Bash
    Steps: Run a backend test that creates a remote MCP through the new settings route and then reads the global config text.
    Expected: The new `mcp.<name>` entry exists in `${Global.Path.config}/ideaspace.json{c}` and is not written anywhere else.
    Evidence: .sisyphus/evidence/task-4-mcp-route.txt

  Scenario: Sanitized namespace collision is blocked
    Tool: Bash
    Steps: Seed an MCP named `foo.bar`, then attempt to create `foo_bar` through the route.
    Expected: The request fails with a collision error referencing the sanitized namespace; the second entry is not persisted.
    Evidence: .sisyphus/evidence/task-4-mcp-route-error.txt
  ```

  **Commit**: NO | Message: `n/a` | Files: `packages/ideaspace/src/settings/**`, `packages/ideaspace/src/server/routes/settings.ts`, `packages/ideaspace/test/config/**`, `packages/ideaspace/test/mcp/**`

- [ ] 5. Implement managed global skill import and removal as full-folder copy

  **What to do**: Implement managed skill import/remove operations inside `packages/ideaspace/src/settings/index.ts` and expose them from `packages/ideaspace/src/server/routes/settings.ts`. The import flow must validate a selected source as either (a) a directory with a root `SKILL.md` or (b) a direct `SKILL.md` path whose containing directory becomes the copy root. Parse the skill frontmatter using the existing markdown/config parser, normalize the managed slug from the skill name, copy the entire directory tree into `${Global.Path.config}/skills/<slug>/`, and remove only managed global skills from that exact path. Duplicate slug or duplicate skill name requires explicit `replace: true`; v1 supports Replace or Cancel only.
  **Must NOT do**: Do not copy only the markdown file. Do not mutate inherited `.claude`, `.agents`, or URL-cached skills. Do not partially copy on validation failure.

  **Recommended Agent Profile**:
  - Category: `deep` — Reason: this is filesystem-heavy runtime behavior with discovery and safety constraints.
  - Skills: [] — Reason: the repo already contains the needed skill/discovery/file utilities.
  - Omitted: [`frontend-ui-ux`] — Reason: no visual work belongs here.

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: [7, 8, 9, 10, 11] | Blocked By: [2]

  **References** (executor has NO interview context — be exhaustive):
  - Pattern: `packages/ideaspace/src/skill/skill.ts:19-24` — skill info shape returned to the app.
  - Pattern: `packages/ideaspace/src/skill/skill.ts:45-188` — skill discovery rules and precedence.
  - Pattern: `packages/ideaspace/src/tool/skill.ts:10-123` — skill execution expects a directory and samples sibling files.
  - Pattern: `packages/ideaspace/src/global/index.ts:14-25` — global config/cache/data path definitions.
  - Pattern: `packages/ideaspace/test/skill/skill.test.ts` — existing skill fixture and discovery tests.
  - Pattern: `packages/app/src/context/platform.tsx:39-43` — source-path types passed from the app layer.

  **Acceptance Criteria** (agent-executable only):
  - [ ] `cd packages/ideaspace && bun test test/skill/skill.test.ts test/config/config.test.ts` passes with new managed global import/remove coverage.
  - [ ] Importing a skill by selecting `SKILL.md` copies the containing directory contents, including sibling files, into the managed global location.

  **QA Scenarios** (MANDATORY — task incomplete without these):

  ```
  Scenario: Selecting SKILL.md copies the full source folder
    Tool: Bash
    Steps: Run a backend test that imports `/tmp/example-skill/SKILL.md` where the directory also contains `reference/` and `scripts/`.
    Expected: `${Global.Path.config}/skills/example-skill/` contains `SKILL.md` plus the sibling directories/files, and `Skill.all()` returns the imported skill.
    Evidence: .sisyphus/evidence/task-5-skill-import.txt

  Scenario: Inherited skill removal is blocked
    Tool: Bash
    Steps: Seed a skill in `~/.claude/skills/example/SKILL.md` and call the managed-delete route for it.
    Expected: The route returns a non-success error explaining the skill is not managed by Ideaspace; inherited files remain untouched.
    Evidence: .sisyphus/evidence/task-5-skill-import-error.txt
  ```

  **Commit**: NO | Message: `n/a` | Files: `packages/ideaspace/src/settings/**`, `packages/ideaspace/src/server/routes/settings.ts`, `packages/ideaspace/src/skill/**`, `packages/ideaspace/test/skill/**`

- [ ] 6. Build the global MCP Settings tab over saved config plus live runtime status

  **What to do**: Rewrite `packages/app/src/components/settings-mcp.tsx` into a full global management screen. The list must show each MCP’s name, global-source badge, config type (`local` or `remote`), enabled flag, and current runtime status derived from `mcp.status`. Actions must include guided add, edit, delete, connect, disconnect, and authenticate for OAuth-capable remote MCPs. Use explicit save/apply for config mutations and optimistic rollback on failure. Expose selectors `mcp-row-<name>`, `mcp-source-<name>`, `mcp-edit-<name>`, `mcp-delete-<name>`, `mcp-connect-<name>`, `mcp-disconnect-<name>`, and `mcp-auth-<name>`.
  **Must NOT do**: Do not present project/global switching in this screen. Do not make runtime connect/disconnect implicitly rewrite persisted config.

  **Recommended Agent Profile**:
  - Category: `visual-engineering` — Reason: this is the main UI assembly task for global MCP management.
  - Skills: [`frontend-ui-ux`] — Reason: the screen needs a clean split between persisted config and runtime actions.
  - Omitted: [`git-master`] — Reason: no git-specific operations are part of the implementation.

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: [10, 11] | Blocked By: [1, 2, 3, 4]

  **References** (executor has NO interview context — be exhaustive):
  - Pattern: `packages/app/src/components/settings-mcp.tsx:1-16` — placeholder to replace.
  - Pattern: `packages/app/src/components/dialog-select-mcp.tsx:22-101` — existing runtime MCP list behavior and status treatment.
  - Pattern: `packages/app/src/components/settings-providers.tsx:128-249` — settings list/card/action layout.
  - API/Type: `packages/ideaspace/src/server/routes/mcp.ts:11-224` — runtime action endpoints.
  - API/Type: `packages/ideaspace/src/server/routes/settings.ts` — new global MCP persistence endpoints from Task 2/4.

  **Acceptance Criteria** (agent-executable only):
  - [ ] `cd packages/app && bun run test:unit` passes with cases for add/edit/delete, collision errors, and runtime action button states.
  - [ ] `cd packages/app && bun run typecheck` passes with the rewritten MCP settings screen.

  **QA Scenarios** (MANDATORY — task incomplete without these):

  ```
  Scenario: Add and connect a remote MCP from global Settings
    Tool: Playwright
    Steps: Start the backend/app; open Settings; click [data-action="settings-tab-mcp"]; click [data-action="mcp-add-open"]; enter a valid remote MCP config; submit; click [data-action="mcp-connect-jira"].
    Expected: [data-action="mcp-row-jira"] appears with a global source badge, then runtime status transitions to connected without losing persisted config metadata.
    Evidence: .sisyphus/evidence/task-6-mcp-ui.png

  Scenario: Delete guard preserves config on collision/validation error
    Tool: Playwright
    Steps: Attempt to create an MCP whose name collides after sanitization, then inspect the resulting UI state.
    Expected: Save is blocked with a clear inline/toast error, and the MCP list remains unchanged.
    Evidence: .sisyphus/evidence/task-6-mcp-ui-error.png
  ```

  **Commit**: YES | Message: `feat(settings): add guided global MCP management` | Files: `packages/app/src/components/dialog-settings.tsx`, `packages/app/src/components/settings-mcp.tsx`, `packages/app/src/components/dialog-mcp-*.tsx`, `packages/app/src/context/settings-config.tsx`, `packages/app/src/i18n/*.ts`

- [ ] 7. Build the global Skills Settings tab with managed and inherited origin handling

  **What to do**: Add `packages/app/src/components/settings-skills.tsx` and wire it into the Settings dialog. The screen must show all discovered skills from `app.skills()` and classify each one into `managed-global`, `inherited-external`, or `inherited-url-cache` based on the returned `location`. Managed global items get Remove and Open Location actions; inherited items are read-only. Import actions must support local directory selection or direct `SKILL.md` file selection through the platform picker APIs and route them to the managed-copy service from Task 5. Expose selectors `skill-row-<name>`, `skill-origin-<name>`, `skill-remove-<name>`, `skill-open-location-<name>`, `skill-import-open`, `skill-import-file`, `skill-import-dir`, and `skill-import-submit`.
  **Must NOT do**: Do not pretend URL-cached or `.claude` / `.agents` skills are managed. Do not hide the physical source location from the user.

  **Recommended Agent Profile**:
  - Category: `visual-engineering` — Reason: this is the main UI assembly task for skill management.
  - Skills: [`frontend-ui-ux`] — Reason: managed vs inherited distinctions must be legible and low-friction.
  - Omitted: [`playwright`] — Reason: use browser automation for QA, not coding.

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: [10, 11] | Blocked By: [1, 2, 5]

  **References** (executor has NO interview context — be exhaustive):
  - Pattern: `packages/ideaspace/src/server/server.ts:440-459` — existing `app.skills` endpoint.
  - Pattern: `packages/ideaspace/src/skill/skill.ts:45-188` — discovered skill sources and precedence.
  - Pattern: `packages/ideaspace/src/skill/discovery.ts` — URL-cached skills live under cache-managed directories.
  - Pattern: `packages/app/src/components/settings-providers.tsx:136-249` — section/card/list action layout.
  - API/Type: `packages/app/src/context/platform.tsx:24-25` — `openPath` support for revealing local managed locations.

  **Acceptance Criteria** (agent-executable only):
  - [ ] `cd packages/app && bun run test:unit` passes with origin classification, managed remove, and direct `SKILL.md` import cases.
  - [ ] `cd packages/app && bun run typecheck` passes with the new skills screen.

  **QA Scenarios** (MANDATORY — task incomplete without these):

  ```
  Scenario: Import a local skill by selecting SKILL.md
    Tool: Playwright
    Steps: Start the backend/app; open Settings; click [data-action="settings-tab-skills"]; click [data-action="skill-import-open"]; choose [data-action="skill-import-file"] and select a `SKILL.md` file.
    Expected: [data-action="skill-row-example-skill"] appears with [data-action="skill-origin-example-skill"] = managed-global and the managed location contains the full copied directory.
    Evidence: .sisyphus/evidence/task-7-skills-ui.png

  Scenario: External skill remains read-only
    Tool: Playwright
    Steps: Seed an inherited `.claude/skills/claude-skill/SKILL.md`; open the Skills tab.
    Expected: The row is visible, origin is labeled inherited-external, and no [data-action="skill-remove-claude-skill"] control is rendered.
    Evidence: .sisyphus/evidence/task-7-skills-ui-error.png
  ```

  **Commit**: NO | Message: `n/a` | Files: `packages/app/src/components/settings-skills.tsx`, `packages/app/src/components/dialog-skill-*.tsx`, `packages/app/src/context/settings-config.tsx`

- [ ] 8. Extend the agents modal for MCP and skill overrides with inheritance defaults

  **What to do**: Extend `packages/app/src/pages/agents/detail.tsx` so the existing agent detail UI manages both MCP and skill overrides. Preserve the current MCP checklist, add a parallel Skills checklist, and surface the inheritance model clearly: if `cfg.mcps` / `cfg.skills` are unset, `primary` and `all` agents inherit all currently available MCPs/skills while `subagent` agents inherit none. Only persist explicit arrays when the user diverges from that mode default. Keep agent creation behavior compatible with this by leaving new agents on inherited defaults unless the user customizes them. Expose selectors `agent-mcp-<name>`, `agent-skill-<name>`, `agent-mcp-mode`, and `agent-skill-mode`.
  **Must NOT do**: Do not silently write every current MCP/skill into each main agent config on creation. Do not invent a second agent-permission surface outside the existing agent detail UI.

  **Recommended Agent Profile**:
  - Category: `visual-engineering` — Reason: this is agent-detail UI/state work layered onto an existing screen.
  - Skills: [`frontend-ui-ux`] — Reason: inherited-vs-explicit access state must stay understandable.
  - Omitted: [`playwright`] — Reason: implementation should rely on component/unit tests first.

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: [9, 10, 11] | Blocked By: [2, 4, 5]

  **References** (executor has NO interview context — be exhaustive):
  - Pattern: `packages/app/src/pages/agents/detail.tsx:271-303` — MCP list load and toggle state handling.
  - Pattern: `packages/app/src/pages/agents/detail.tsx:376-580` — agent config load/save diffing.
  - Pattern: `packages/app/src/pages/agents/detail.tsx:1124-1172` — existing MCP section UI to extend.
  - Pattern: `packages/app/src/context/agents.tsx:66-133` — agent lists by mode and config access helpers.
  - Pattern: `packages/app/src/components/dialog-create-agent.tsx:75-95` — new-agent config defaults.
  - Pattern: `packages/ideaspace/src/tool/skill.ts:13-20` — skill permission is filtered by agent permissions today.

  **Acceptance Criteria** (agent-executable only):
  - [ ] `cd packages/app && bun run test:unit` passes with agent-detail tests for inherited defaults and explicit MCP/skill overrides.
  - [ ] `cd packages/app && bun run typecheck` passes with the extended agent detail screen.

  **QA Scenarios** (MANDATORY — task incomplete without these):

  ```
  Scenario: Main agent inherits new MCPs and skills by default
    Tool: Bash
    Steps: Run an agent-detail/component test with a `primary` agent whose config omits `mcps` and `skills`, after seeding one MCP and one skill.
    Expected: The UI shows inherited access for both items without writing explicit arrays into config.
    Evidence: .sisyphus/evidence/task-8-agent-ui.txt

  Scenario: Subagent defaults to no MCP/skill access until explicitly allowed
    Tool: Bash
    Steps: Run the same test for a `subagent` with no explicit overrides.
    Expected: The UI shows no effective MCP/skill access until the user checks specific items and saves.
    Evidence: .sisyphus/evidence/task-8-agent-ui-error.txt
  ```

  **Commit**: NO | Message: `n/a` | Files: `packages/app/src/pages/agents/detail.tsx`, `packages/app/src/context/agents.tsx`, `packages/app/src/components/dialog-create-agent.tsx`

- [ ] 9. Enforce MCP and skill allowlists at runtime for agent execution

  **What to do**: Add runtime enforcement in `packages/ideaspace` so agent selections in Task 8 actually control execution. In `packages/ideaspace/src/session/prompt.ts`, filter the tool set built from `MCP.tools()` using the effective per-agent MCP allowlist derived from agent mode plus any explicit `cfg.mcps` override. For skills, either (a) add `skills?: string[]` as an explicit agent-config field and derive effective skill allow/deny before the skill tool is exposed, or (b) translate the effective allowlist into `permission.skill` semantics before `SkillTool` evaluation; in both cases the chosen path must leave `primary/all + undefined` meaning allow all current skills and `subagent + undefined` meaning allow none. Add the minimal schema/plumbing required so runtime code can read the effective agent MCP/skill settings without relying on UI-only catchall behavior.
  **Must NOT do**: Do not leave `cfg.mcps` as a UI-only field. Do not expose MCP tools or skills to subagents by default when no override exists.

  **Recommended Agent Profile**:
  - Category: `deep` — Reason: this is prompt/tool-resolution and agent-permission behavior, not UI work.
  - Skills: [] — Reason: the repo already contains the relevant prompt, permission, and skill runtime patterns.
  - Omitted: [`frontend-ui-ux`] — Reason: no visual work belongs here.

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: [10, 11] | Blocked By: [4, 5, 8]

  **References** (executor has NO interview context — be exhaustive):
  - Pattern: `packages/ideaspace/src/session/prompt.ts:736-875` — tool-resolution pipeline and current unfiltered `MCP.tools()` injection point.
  - Pattern: `packages/ideaspace/src/mcp/index.ts:603-643` — MCP tool namespace construction from sanitized client/tool names.
  - Pattern: `packages/ideaspace/src/tool/skill.ts:13-20` — skill exposure filtered via `PermissionNext.evaluate("skill", skill.name, agent.permission)`.
  - Pattern: `packages/ideaspace/src/permission/next.ts:46-66` — config-to-ruleset conversion and merge behavior.
  - Pattern: `packages/app/src/pages/agents/detail.tsx:478-558` — current MCP override persistence from the UI.

  **Acceptance Criteria** (agent-executable only):
  - [ ] `cd packages/ideaspace && bun test --timeout 30000` passes with new runtime filtering cases for primary agents, subagents, and explicit overrides.
  - [ ] A runtime test proves that a subagent with no explicit override does not receive MCP tools or skills that a primary agent with no explicit override does receive.

  **QA Scenarios** (MANDATORY — task incomplete without these):

  ```
  Scenario: Runtime MCP filtering matches effective agent allowlist
    Tool: Bash
    Steps: Run a backend/session test that resolves tools for a primary agent and a subagent after seeding one connected MCP.
    Expected: The primary agent resolves the MCP tool namespace; the subagent resolves none until explicitly allowed.
    Evidence: .sisyphus/evidence/task-9-runtime-filter.txt

  Scenario: Runtime skill filtering blocks skill loading for subagents by default
    Tool: Bash
    Steps: Run a backend test that lists/loads skills for a subagent with no explicit override and for a primary agent with no explicit override.
    Expected: The primary agent can see/load the skill; the subagent cannot until its override or effective permission changes.
    Evidence: .sisyphus/evidence/task-9-runtime-filter-error.txt
  ```

  **Commit**: YES | Message: `feat(agents): enforce MCP and skill access defaults` | Files: `packages/ideaspace/src/session/prompt.ts`, `packages/ideaspace/src/tool/skill.ts`, `packages/ideaspace/src/config/**`, `packages/app/src/pages/agents/detail.tsx`

- [ ] 10. Add automated coverage for guided MCP setup, managed skills, and agent inheritance

  **What to do**: Extend app and runtime tests so the feature is covered at the right seam. In `packages/ideaspace`, add integration coverage for guided MCP create/update/delete, collision rejection, managed skill import/remove, full-folder copy, and runtime MCP/skill filtering by effective agent defaults. In `packages/app`, add unit/component tests for the settings controller, guided MCP dialog, MCP settings screen, Skills settings screen, and agent detail inheritance/override behavior. Make every new selector and conflict path explicitly asserted.
  **Must NOT do**: Do not rely on snapshot-only tests, do not duplicate business logic into mocks, and do not skip failure-path assertions.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` — Reason: this spans app and backend test harnesses with multiple edge cases.
  - Skills: [] — Reason: repo test patterns are already established.
  - Omitted: [`frontend-ui-ux`] — Reason: this task is verification-focused.

  **Parallelization**: Can Parallel: YES | Wave 3 | Blocks: [11] | Blocked By: [4, 5, 6, 7, 8, 9]

  **References** (executor has NO interview context — be exhaustive):
  - Test: `packages/app/src/components/dialog-settings.test.tsx` — existing settings-shell test to extend.
  - Test: `packages/ideaspace/test/skill/skill.test.ts` — skill fixture and discovery patterns.
  - Test: `packages/ideaspace/test/config/config.test.ts` — config fixture and precedence setup.
  - Test: `packages/ideaspace/test/mcp/oauth-browser.test.ts` — MCP runtime/auth test harness.
  - Pattern: `packages/app/src/pages/agents/detail.tsx:596-616` — dirty-state and diffing logic that tests should protect.

  **Acceptance Criteria** (agent-executable only):
  - [ ] `cd packages/app && bun run test:unit` passes.
  - [ ] `cd packages/ideaspace && bun test --timeout 30000` passes with the new MCP/skill/agent runtime coverage included.

  **QA Scenarios** (MANDATORY — task incomplete without these):

  ```
  Scenario: Full automated suite covers happy and failure paths
    Tool: Bash
    Steps: Run `bun run test:unit` in `packages/app` and `bun test --timeout 30000` in `packages/ideaspace`.
    Expected: Both commands pass and logs include cases for MCP collision rejection, managed skill copy, inherited skill protection, and subagent default deny.
    Evidence: .sisyphus/evidence/task-10-test-suite.txt

  Scenario: Selector and inheritance regressions fail loudly
    Tool: Bash
    Steps: Run the new app tests after a local scratch removal of one selector or after flipping the inherited default in a scratch run.
    Expected: The targeted test fails, proving the suite protects the UI contract and default-access model.
    Evidence: .sisyphus/evidence/task-10-test-suite-error.txt
  ```

  **Commit**: NO | Message: `n/a` | Files: `packages/app/src/**/*.test.tsx`, `packages/ideaspace/test/**`

- [ ] 11. Run desktop-stack verification and scripted smoke for settings plus agent-access behavior

  **What to do**: After implementation and automated tests are green, run the full desktop-stack verification for `packages/app`, `packages/ideaspace`, and `packages/desktop`. Then run a scripted smoke flow against the app dev stack that covers: opening both settings tabs, adding one MCP through the guided form, importing one skill directory, confirming both appear as global items, opening the agents modal, confirming a primary agent inherits access by default, confirming a subagent does not, then explicitly allowing the subagent item(s) and verifying runtime behavior. Save screenshots/logs under `.sisyphus/evidence/`.
  **Must NOT do**: Do not skip `packages/desktop` build verification just because most changes live in app/runtime. Do not run tests from repo root.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` — Reason: this is multi-package verification and end-to-end smoke validation.
  - Skills: [] — Reason: commands and selectors are already fixed by earlier tasks.
  - Omitted: [`frontend-ui-ux`] — Reason: this is verification, not design iteration.

  **Parallelization**: Can Parallel: NO | Wave 3 | Blocks: [Final Verification Wave] | Blocked By: [6, 7, 8, 9, 10]

  **References** (executor has NO interview context — be exhaustive):
  - Pattern: `README.md` and `packages/app/AGENTS.md` — app/backend local dev commands and verification expectations.
  - Pattern: `packages/desktop/BUILD_APP.md` — packaging flow if native artifact validation becomes necessary.
  - API/Type: `packages/app/src/context/platform.tsx:39-46` — picker behavior used by the settings UI.
  - Pattern: `packages/app/src/pages/agents/detail.tsx` — agents modal selectors and expected flows after Task 8.

  **Acceptance Criteria** (agent-executable only):
  - [ ] `cd packages/app && bun run typecheck && bun run test:unit && bun run build` passes.
  - [ ] `cd packages/ideaspace && bun test --timeout 30000 && bun run build` passes.
  - [ ] `cd packages/desktop && bun run build` passes.

  **QA Scenarios** (MANDATORY — task incomplete without these):

  ```
  Scenario: End-to-end settings and agent-access smoke on the dev stack
    Tool: Playwright
    Steps: Start `bun run --conditions=browser ./src/index.ts serve --port 4096` in `packages/ideaspace` and `bun dev -- --port 4444` in `packages/app`; open Settings; add one MCP through the guided dialog; import one skill; verify both are labeled global; open the agents detail screen; confirm a primary agent inherits access by default; confirm a subagent does not until explicitly allowed; then allow the subagent and re-run the relevant runtime action.
    Expected: The full flow completes without reload loops or stale UI; runtime behavior matches the inherited-default model; managed skill import copies the full directory and remains visible after reopening Settings.
    Evidence: .sisyphus/evidence/task-11-desktop-smoke.png

  Scenario: Desktop verification catches cross-package regressions
    Tool: Bash
    Steps: Run the three package build/test commands listed in Acceptance Criteria.
    Expected: Any app/runtime/desktop integration regression fails one of the package-specific commands before handoff.
    Evidence: .sisyphus/evidence/task-11-desktop-smoke-error.txt
  ```

  **Commit**: NO | Message: `n/a` | Files: `packages/app/**`, `packages/ideaspace/**`, `packages/sdk/js/**`, `packages/desktop/**`

## Final Verification Wave (4 parallel agents, ALL must APPROVE)

- [ ] F1. Plan Compliance Audit — oracle
- [ ] F2. Code Quality Review — unspecified-high
- [ ] F3. Real Manual QA — unspecified-high (+ playwright if UI)
- [ ] F4. Scope Fidelity Check — deep

## Commit Strategy

- Commit 1: guided global MCP settings shell, controller, backend persistence route, and MCP settings UI
- Commit 2: managed global skills, agent inheritance/runtime enforcement, tests, and final verification fixes
- Never mix unrelated settings refactors or project-scope work into either commit

## Success Criteria

- Users can add and manage MCPs in desktop Settings through a guided native form without importing raw JSON/JSONC files.
- Users can import a skill by selecting either its root directory or its `SKILL.md`, and the full folder is copied into the managed global location.
- Settings clearly behaves as global-only in v1.
- MCP runtime actions reflect actual connection/auth status while config persistence remains explicit and stable.
- The agents modal is the single place for per-agent MCP/skill overrides, and those overrides are enforced at runtime.
- Main agents inherit all newly available MCPs/skills by default; subagents inherit none by default until explicitly allowed.
- Desktop verification passes for `packages/app`, `packages/ideaspace`, and `packages/desktop`.
