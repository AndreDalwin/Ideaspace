# Chat Image Generation for Ideaspace

## TL;DR

> **Summary**: Add Gemini-first image generation to chat as a backend tool, surface the generated images inline in the assistant timeline, and add a dedicated Settings > Images tab for choosing the default image-capable model separately from the normal chat model.
> **Deliverables**:
>
> - backend `image_generate` tool with Google/Gemini provider support
> - durable file-backed image persistence under the Ideaspace data directory
> - assistant/tool attachment rendering for generated images in chat UI
> - Settings > Images tab backed by server config (`image_model`)
> - regression coverage across backend + app + shared UI
>   **Effort**: Medium
>   **Parallel**: YES - 3 waves
>   **Critical Path**: 1 → 2/3/4 → 5 → 6 → 7

## Context

### Original Request

Add image generation to the AI chat, likely using the existing Google/Gemini integration, make generated images appear in the chat UI, save them durably, and expose image-model selection in a separate Settings > Images tab.

### Interview Summary

- User wants image generation in chat now, not a broad asset-management system.
- User prefers a separate Images tab in desktop Settings rather than mixing image models into the regular Models tab.
- Google/Gemini is the preferred first provider path.
- Another agent may be renaming `opencode` → `ideaspace`, so plans must follow the current tree and avoid stale package names.

### Metis Review (gaps addressed)

- Guardrail adopted: do **not** mix image models into the existing chat-model selector; use a dedicated Images settings surface.
- Guardrail adopted: do **not** invent a new chat part type; reuse `MessageV2.FilePart` and tool attachments.
- Guardrail adopted: handle provider safety/rate-limit failures explicitly in the tool contract.
- Auto-resolved ambiguity: keep generated-image display URLs as `data:` URLs for immediate UI compatibility while also writing a durable file copy under `.ideaspace` data storage; store the durable reference in `FilePart.source` as a resource URI.

## Work Objectives

### Core Objective

Ship a Gemini-first image-generation workflow that the assistant can invoke as a tool, with generated images visible inline in chat and the default image model configurable in a dedicated Settings > Images tab.

### Deliverables

- `packages/ideaspace` backend image-generation tool and Google/Gemini helper
- new backend config field for image model selection
- new `SettingsImages` UI and Settings dialog tab wiring
- shared UI rendering for tool-result image attachments
- durable image file writes under `Global.Path.data`
- focused tests in `packages/ideaspace`, `packages/app`, and `packages/ui` touch points

### Definition of Done (verifiable conditions with commands)

- `cd packages/ideaspace && bun run typecheck`
- `cd packages/ideaspace && bun test --timeout 30000`
- `cd packages/app && bun run typecheck`
- `cd packages/app && bun test`
- `cd packages/desktop && bun run typecheck`
- Generated-image regression tests prove that a completed tool result with image attachments is persisted and rendered without manual intervention.

### Must Have

- Separate Settings > Images tab next to Settings > Models
- Server-backed `image_model` preference stored in config, not app-only local state
- Google/Gemini-first image-generation implementation using existing provider/auth plumbing
- Generated images returned as tool attachments and visible inline in the assistant timeline
- Durable file copy written under Ideaspace data storage
- Backward compatibility with existing `data:` URL `FilePart.url` behavior

### Must NOT Have (guardrails, AI slop patterns, scope boundaries)

- No direct “main chat model outputs image files” integration in `session/llm.ts` for v1
- No new message part type for generated images
- No broad image library / gallery manager / asset browser
- No requirement for a DB migration or new attachment table in v1
- No provider-agnostic promise beyond `google` and `google-vertex` in v1
- No reliance on unstabilized or hidden Copilot-only image paths for the feature’s primary implementation

## Verification Strategy

> ZERO HUMAN INTERVENTION — all verification is agent-executed.

- Test decision: tests-after using existing Bun/unit test infrastructure in `packages/ideaspace` and `packages/app`
- QA policy: Every task includes agent-executed checks; final wave includes end-to-end UI verification
- Evidence: `.sisyphus/evidence/task-{N}-{slug}.{ext}`

## Execution Strategy

### Parallel Execution Waves

> Target: 5-8 tasks per wave. <3 per wave (except final) = under-splitting.
> Extract shared dependencies as Wave-1 tasks for max parallelism.

Wave 1: config contract, storage contract, provider helper contract, UI attachment contract

Wave 2: settings UI, backend tool implementation, assistant rendering integration

Wave 3: cross-package regression + desktop-stack verification

### Dependency Matrix (full, all tasks)

| Task | Depends On |
| ---- | ---------- |
| 1    | -          |
| 2    | 1          |
| 3    | -          |
| 4    | 1          |
| 5    | 1, 3, 4    |
| 6    | 3, 5       |
| 7    | 1, 2, 5, 6 |

### Agent Dispatch Summary (wave → task count → categories)

- Wave 1 → 4 tasks → unspecified-high, quick
- Wave 2 → 3 tasks → unspecified-high, visual-engineering
- Wave 3 → 1 task → unspecified-high

## TODOs

> Implementation + Test = ONE task. Never separate.
> EVERY task MUST have: Agent Profile + Parallelization + QA Scenarios.

- [x] 1. Add backend `image_model` config contract and propagate typed config updates

  **What to do**: Extend the Ideaspace config schema with a new optional top-level `image_model` field in the same `provider/model` format as `model`, expose it through the existing config routes, regenerate any API/SDK types impacted by the schema, and keep the existing optimistic `globalSync.updateConfig(...)` flow as the app-side write path.
  **Must NOT do**: Do not store the default image model only in app-local persisted state. Do not overload the existing `model` or `small_model` fields. Do not add a new endpoint when `config.update` already exists.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` — Reason: touches backend config schema, route typing, and cross-package contract generation.
  - Skills: `[]` — no special skill required.
  - Omitted: [`frontend-ui-ux`] — this task is config/API plumbing, not presentation.

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: 2, 4, 5, 7 | Blocked By: none

  **References** (executor has NO interview context — be exhaustive):
  - Pattern: `packages/ideaspace/src/config/config.ts:1020-1028` — existing top-level model fields (`model`, `small_model`) show the correct schema style for model-like config values.
  - API: `packages/ideaspace/src/server/routes/config.ts:13-59` — existing config get/update route already persists full config documents.
  - Sync bootstrap: `packages/app/src/context/global-sync/bootstrap.ts:57-67,127-133` — app bootstraps config from server for both global and directory contexts.
  - Optimistic update pattern: `packages/app/src/components/settings-providers.tsx:83-100` — existing settings page pattern for `globalSync.set(...)` + `globalSync.updateConfig(...)`.
  - Prompt boundary: `packages/ideaspace/src/session/prompt.ts:91-110` — current prompt input already carries chat-model selection separately; image model should remain config-backed, not injected into this payload in v1.

  **Acceptance Criteria** (agent-executable only):
  - [ ] `Config.Info` accepts `image_model?: "provider/model"` and rejects invalid non-string shapes.
  - [ ] `GET /config` and `PATCH /config` include the new field in generated types and runtime payloads.
  - [ ] The app can read `sync.data.config.image_model` without type errors after SDK regeneration.
  - [ ] Existing `model` and `small_model` behavior remains unchanged.

  **QA Scenarios** (MANDATORY — task incomplete without these):

  ```
  Scenario: Config schema and route round-trip
    Tool: Bash
    Steps: In `packages/ideaspace`, run the focused config/route tests added for `image_model`, then run `bun run typecheck`.
    Expected: Tests pass; typecheck passes; config update payloads accept and return `image_model`.
    Evidence: .sisyphus/evidence/task-1-config-roundtrip.txt

  Scenario: Invalid image model payload is rejected
    Tool: Bash
    Steps: Execute a focused test that calls config validation with `image_model: { bad: true }` and with malformed strings.
    Expected: Validation fails with deterministic schema errors; valid `provider/model` strings still pass.
    Evidence: .sisyphus/evidence/task-1-config-invalid.txt
  ```

  **Commit**: NO | Message: `feat(config): add image model setting` | Files: `packages/ideaspace/src/config/config.ts`, `packages/ideaspace/src/server/routes/config.ts`, `packages/sdk/js/**`, app type consumers as needed

- [ ] 2. Add Settings > Images tab and image-model selection UI

  **What to do**: Add a new vertical Settings tab named `Images` next to `Models`, create `SettingsImages` using the existing settings-page layout conventions, read/write `globalSync.data.config.image_model`, and list only v1-supported image-capable models from the connected Google providers (`google`, `google-vertex`). Filter by `capabilities.output.image === true` when present, with model-ID `image` substring fallback only for providers already in the supported Google set.
  **Must NOT do**: Do not reuse `context/models.tsx` or the regular chat-model visibility state for image settings. Do not show non-Google providers in v1. Do not place image models inside the existing `SettingsModels` page.

  **Recommended Agent Profile**:
  - Category: `visual-engineering` — Reason: settings-shell UI change plus state wiring and filtering.
  - Skills: [`frontend-ui-ux`] — helpful for fitting the new tab into the existing settings experience cleanly.
  - Omitted: [`vercel-react-best-practices`] — SolidJS app, not React/Next-specific.

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: 7 | Blocked By: 1

  **References** (executor has NO interview context — be exhaustive):
  - Settings shell: `packages/app/src/components/dialog-settings.tsx:17-70` — add the new `Tabs.Trigger` and `Tabs.Content` beside `Models`.
  - Models page pattern: `packages/app/src/components/settings-models.tsx:33-136` — follow the sticky header, grouped list, and switch/list styling conventions.
  - Provider access: `packages/app/src/hooks/use-providers.ts:18-41` — use connected provider data instead of ad hoc fetching.
  - Capability display pattern: `packages/app/src/components/model-tooltip.tsx:13-24,54-64` — model metadata already understands capability-based labeling.
  - Config update pattern: `packages/app/src/components/settings-providers.tsx:83-100` — optimistic update flow to server-backed config.
  - Config availability: `packages/app/src/context/global-sync/bootstrap.ts:57-67` — global config is already bootstrapped into sync state.

  **Acceptance Criteria** (agent-executable only):
  - [ ] Settings dialog contains an `Images` tab alongside `Models`.
  - [ ] The Images tab lists only connected `google` / `google-vertex` models that qualify as image-capable by the defined filter.
  - [ ] Selecting a model writes `config.image_model` through `globalSync.updateConfig(...)` and survives reload.
  - [ ] The existing Models tab and active chat-model selector remain unchanged.
  - [ ] Required i18n keys for the new Settings tab/page exist for the touched locale files.

  **QA Scenarios** (MANDATORY — task incomplete without these):

  ```
  Scenario: Images settings persists selected model
    Tool: Bash
    Steps: In `packages/app`, run a focused unit/component test that mounts `DialogSettings`, navigates to `Images`, selects a fixture Google image model, triggers the mocked `globalSync.updateConfig`, remounts, and re-reads the selected state.
    Expected: The selected image model is rendered as active after remount and the config update payload contains `image_model`.
    Evidence: .sisyphus/evidence/task-2-images-settings.txt

  Scenario: Unsupported models stay hidden
    Tool: Bash
    Steps: Run a focused test with mixed provider fixtures (Google image-capable, Google non-image, OpenAI image-capable, Anthropic text-only).
    Expected: Only `google` / `google-vertex` image-capable entries render in v1; unsupported providers do not appear.
    Evidence: .sisyphus/evidence/task-2-images-filter.txt
  ```

  **Commit**: NO | Message: `feat(app): add images settings tab` | Files: `packages/app/src/components/dialog-settings.tsx`, `packages/app/src/components/settings-images.tsx`, `packages/app/src/i18n/*.ts`, supporting tests

- [x] 3. Add durable image-file persistence helpers under Ideaspace data storage

  **What to do**: Implement a backend helper that decodes generated image bytes, writes them under `path.join(Global.Path.data, "attachments", "images", <sessionID>, <messageID>)`, determines the file extension from MIME type, and returns both a durable file path and a `MessageV2.FilePart`-compatible payload: `url` must be a `data:` URL for immediate UI compatibility, while `source` must be a `resource` source with an `ideaspace://image/...` URI pointing to the durable copy.
  **Must NOT do**: Do not add a new DB table. Do not store only a file path with no renderable `url`. Do not write files outside `Global.Path.data`.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` — Reason: backend persistence helper with testable file-layout behavior.
  - Skills: `[]` — no special skill required.
  - Omitted: [`git-master`] — no git operation needed during implementation.

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: 5, 6, 7 | Blocked By: none

  **References** (executor has NO interview context — be exhaustive):
  - Global storage root: `packages/ideaspace/src/global/index.ts:7-35` — `Global.Path.data` is the correct durable application data root.
  - Existing persisted message/file shape: `packages/ideaspace/src/session/message-v2.ts:162-179` — `ResourceSource` + `FilePart` already support a durable reference plus render URL.
  - Media attachment rules: `packages/ideaspace/src/session/message-v2.ts:20,642-643` — image media attachments are already treated specially during model-message conversion.
  - Persistence context: `packages/ideaspace/src/session/session.sql.ts:42-67` — messages and parts are stored as JSON, so v1 should avoid schema churn.

  **Acceptance Criteria** (agent-executable only):
  - [ ] A helper can transform raw base64 image bytes + MIME type into a saved file under `Global.Path.data/attachments/images/...`.
  - [ ] The helper returns a `FilePart` payload with a valid `data:` URL and a `resource` source URI.
  - [ ] Unsupported MIME types are rejected deterministically.
  - [ ] The helper is testable under `IDEASPACE_TEST_HOME` without touching a real user data directory.

  **QA Scenarios** (MANDATORY — task incomplete without these):

  ```
  Scenario: Image bytes are written to the Ideaspace data dir
    Tool: Bash
    Steps: In `packages/ideaspace`, run a focused test with `IDEASPACE_TEST_HOME` set, feed fixture PNG bytes into the helper, and assert that the file exists under `attachments/images/<session>/<message>/`.
    Expected: The file is created in the test data directory and the helper returns a `data:image/...` URL plus `source.type === "resource"`.
    Evidence: .sisyphus/evidence/task-3-image-storage.txt

  Scenario: Unsupported mime is rejected gracefully
    Tool: Bash
    Steps: Run the focused storage helper test with a non-image MIME type such as `application/json`.
    Expected: The helper throws or returns a structured error without writing a file.
    Evidence: .sisyphus/evidence/task-3-image-storage-error.txt
  ```

  **Commit**: NO | Message: `feat(storage): persist generated images` | Files: new helper under `packages/ideaspace/src/**`, focused tests

- [x] 4. Implement Google/Gemini image-generation helper for `google` and `google-vertex`

  **What to do**: Add a dedicated backend helper (for example under `packages/ideaspace/src/provider/`) that reads `Config.get().image_model`, supports only `google` and `google-vertex` in v1, and calls the provider-specific image-generation HTTP APIs directly using existing auth plumbing: `google` uses the configured API key path; `google-vertex` uses the existing `GoogleAuth` / project / location resolution pattern already present in the provider layer. Normalize responses to a single internal result shape: `{ mime, bytesBase64, revisedPrompt?, blockedReason? }`.
  **Must NOT do**: Do not route this through `session/llm.ts` or `streamText`. Do not add a new SDK dependency for v1. Do not silently fall back to unsupported providers.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` — Reason: provider/auth integration plus external API normalization.
  - Skills: `[]` — repo-native provider/auth patterns are sufficient.
  - Omitted: [`frontend-ui-ux`] — no UI work here.

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: 5, 7 | Blocked By: 1

  **References** (executor has NO interview context — be exhaustive):
  - Bundled provider/auth imports: `packages/ideaspace/src/provider/provider.ts:23-28,45` — existing Google provider and `GoogleAuth` plumbing already live here.
  - Vertex env resolution: `packages/ideaspace/src/provider/provider.ts:64-75` — canonical project/location/endpoint resolution for Google Vertex.
  - Vertex auth fetch pattern: `packages/ideaspace/src/provider/provider.ts:382-414` — reuse the same ADC token acquisition and authorized fetch behavior.
  - Existing supported-provider guard style: `packages/ideaspace/src/provider/provider.ts` overall — provider-specific branching belongs in the provider layer, not the chat loop.
  - External: `https://cloud.google.com/vertex-ai/generative-ai/docs/multimodal/image-generation` — Gemini image generation returns base64 image bytes and supports response image modalities.

  **Acceptance Criteria** (agent-executable only):
  - [ ] Helper returns normalized image bytes and MIME type for a successful `google` or `google-vertex` generation call.
  - [ ] Safety-blocked responses become deterministic tool-safe errors.
  - [ ] Unsupported provider IDs fail fast with a clear unsupported-provider message.
  - [ ] 401/403/429 provider failures are surfaced with retryability metadata or explicit user-facing messages.

  **QA Scenarios** (MANDATORY — task incomplete without these):

  ```
  Scenario: Vertex response normalization
    Tool: Bash
    Steps: In `packages/ideaspace`, run a focused test that feeds a captured Vertex/Gemini image-generation JSON fixture into the normalization helper.
    Expected: The helper extracts image bytes, MIME type, and no blockedReason for the happy path fixture.
    Evidence: .sisyphus/evidence/task-4-google-helper.txt

  Scenario: Safety block and unsupported provider handling
    Tool: Bash
    Steps: Run focused tests with (a) a blocked fixture containing a provider safety reason and (b) an unsupported provider ID such as `openai`.
    Expected: The blocked fixture returns a structured blocked error; unsupported provider throws a clear unsupported-provider error.
    Evidence: .sisyphus/evidence/task-4-google-helper-error.txt
  ```

  **Commit**: NO | Message: `feat(provider): add Gemini image generator` | Files: new helper under `packages/ideaspace/src/provider/**`, focused tests

- [x] 5. Add the backend `image_generate` tool and register it in the Ideaspace tool registry

  **What to do**: Implement `image_generate` as a first-class built-in tool under `packages/ideaspace/src/tool/`, register it in `ToolRegistry`, read the configured `image_model`, validate that the model belongs to a connected supported provider, call the Google/Gemini helper, persist the durable file copy, and return a completed tool state with `attachments: FilePart[]`, text output summarizing the result, and metadata containing provider/model/prompt. Use a minimal v1 input contract: `prompt` required, `aspect_ratio` optional enum.
  **Must NOT do**: Do not hardcode a single model ID. Do not use the Copilot-only `image_generation` path as the primary implementation. Do not return image output only as plain text or only as metadata.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` — Reason: core backend feature task joining config, provider helper, storage, and tool registry.
  - Skills: `[]` — existing tool patterns are sufficient.
  - Omitted: [`playwright`] — backend implementation task, not browser automation.

  **Parallelization**: Can Parallel: NO | Wave 2 | Blocks: 6, 7 | Blocked By: 1, 3, 4

  **References** (executor has NO interview context — be exhaustive):
  - Tool registry list: `packages/ideaspace/src/tool/registry.ts:98-124` — add the new built-in tool to the returned tool array.
  - Tool definition pattern: `packages/ideaspace/src/tool/bash.ts` and `packages/ideaspace/src/tool/question.ts` — follow standard `Tool.define(...)` module structure.
  - Existing attachment conversion contract: `packages/ideaspace/src/session/message-v2.ts:293-310,642-643` — completed tool states already support attachments and media handling.
  - Regression precedent: `packages/ideaspace/test/session/message-v2.test.ts:266-355` — existing test proves assistant tool completions with image attachments already convert into model-media tool results correctly.
  - Prompt route: `packages/ideaspace/src/server/routes/session.ts:730-768` — existing message send flow should remain unchanged; tool execution plugs into the current tool system, not a new route.

  **Acceptance Criteria** (agent-executable only):
  - [ ] `ToolRegistry.tools(...)` includes `image_generate` for normal chat sessions.
  - [ ] Successful tool execution returns a completed tool state with a `FilePart` attachment and readable output text.
  - [ ] Missing/unsupported `config.image_model` fails with a clear actionable error.
  - [ ] Optional `aspect_ratio` is forwarded only when provided and valid.

  **QA Scenarios** (MANDATORY — task incomplete without these):

  ```
  Scenario: Tool returns an image attachment
    Tool: Bash
    Steps: In `packages/ideaspace`, run a focused tool test using a stubbed Google helper and a valid `config.image_model`, then assert that the tool result includes one `image/*` attachment and summary text.
    Expected: The tool result completes successfully and the attachment is present in the returned payload.
    Evidence: .sisyphus/evidence/task-5-image-tool.txt

  Scenario: Tool fails cleanly when no image model is configured
    Tool: Bash
    Steps: Run the focused tool test with `config.image_model` unset.
    Expected: The tool returns a clear error telling the user to configure an image model in Settings > Images.
    Evidence: .sisyphus/evidence/task-5-image-tool-error.txt
  ```

  **Commit**: NO | Message: `feat(tool): add image generation tool` | Files: `packages/ideaspace/src/tool/image_generate.ts`, `packages/ideaspace/src/tool/registry.ts`, supporting tests

- [ ] 6. Render tool-result image attachments inline in the assistant timeline

  **What to do**: Extend the shared message-part rendering so completed tool parts display attached images using the same visual/preview affordances already used for user-side attachments. Extract the current user attachment rendering block into a shared helper inside `packages/ui/src/components/message-part.tsx`, then reuse it for tool parts after the tool card output. Preserve `ImagePreview` click-to-open behavior.
  **Must NOT do**: Do not create a separate full-screen image experience. Do not hide tool output text when attachments exist. Do not duplicate attachment UI logic in multiple places when a shared helper can be reused.

  **Recommended Agent Profile**:
  - Category: `visual-engineering` — Reason: shared UI rendering behavior and attachment presentation polish.
  - Skills: [`frontend-ui-ux`] — helpful for keeping the timeline visually coherent.
  - Omitted: [`git-master`] — no git work required.

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: 7 | Blocked By: 3, 5

  **References** (executor has NO interview context — be exhaustive):
  - Existing user attachment UI: `packages/ui/src/components/message-part.tsx:871-959` — current inline image/pdf rendering and preview behavior to reuse.
  - Current tool renderer gap: `packages/ui/src/components/message-part.tsx:1149-1216` — tool parts currently render the tool card but do not surface attachments.
  - Media component: `packages/ui/src/components/file-media.tsx:30-114,160-212` — existing shared media display conventions if deeper reuse is needed.
  - Existing tool attachment contract: `packages/ideaspace/src/session/message-v2.ts:293-310` — completed tool state attachments are already part of the message model.

  **Acceptance Criteria** (agent-executable only):
  - [ ] Completed tool parts with `image/*` attachments render inline beneath or adjacent to the tool output.
  - [ ] Clicking the rendered image opens the existing image preview dialog.
  - [ ] Tool parts without attachments render exactly as before.
  - [ ] User message attachment rendering remains unchanged.

  **QA Scenarios** (MANDATORY — task incomplete without these):

  ```
  Scenario: Tool image attachment renders inline
    Tool: Bash
    Steps: In `packages/app`, run a focused component test that renders a `SessionTurn` fixture containing a completed `tool` part with one `data:image/png;base64,...` attachment.
    Expected: The rendered DOM contains the tool output plus an `<img>` with the attachment source.
    Evidence: .sisyphus/evidence/task-6-tool-attachments.txt

  Scenario: Non-attachment tool rendering is unchanged
    Tool: Bash
    Steps: Run a focused component test with a completed tool part that has output text and no attachments.
    Expected: The DOM matches the pre-existing tool-card behavior and contains no attachment image block.
    Evidence: .sisyphus/evidence/task-6-tool-attachments-regression.txt
  ```

  **Commit**: NO | Message: `feat(ui): render tool image attachments` | Files: `packages/ui/src/components/message-part.tsx`, related tests in app/ui packages

- [ ] 7. Add cross-package regression coverage and verify desktop-stack health

  **What to do**: Regenerate the JS SDK after config schema changes, add/refresh focused tests covering config sync, tool attachment persistence, and assistant rendering, then run the required verification commands in `packages/ideaspace`, `packages/app`, and `packages/desktop`. Include one integration-style app test covering the full happy path from configured image model to rendered tool attachment using fixture data/stubbed provider responses.
  **Must NOT do**: Do not run tests from repo root. Do not skip desktop-stack verification just because desktop source files are untouched. Do not leave generated SDK artifacts stale after changing API schemas.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` — Reason: cross-package verification, SDK regeneration, and regression hardening.
  - Skills: `[]` — standard test/build workflow.
  - Omitted: [`frontend-ui-ux`] — verification task, not design.

  **Parallelization**: Can Parallel: NO | Wave 3 | Blocks: Final Verification Wave | Blocked By: 1, 2, 5, 6

  **References** (executor has NO interview context — be exhaustive):
  - SDK regeneration note: `AGENTS.md` at repo root — regenerate JS SDK with `./packages/sdk/js/script/build.ts` after API shape changes.
  - Backend test guidance: `packages/ideaspace/test/AGENTS.md` — use `tmpdir` and `IDEASPACE_TEST_HOME` for isolated filesystem coverage.
  - Desktop verification scope: root `AGENTS.md` and `packages/desktop/AGENTS.md` — desktop stack health is part of the verification bar.
  - Existing command constraints: root `AGENTS.md` — tests cannot run from repo root.

  **Acceptance Criteria** (agent-executable only):
  - [ ] SDK/client types are regenerated and app/backend typecheck cleanly.
  - [ ] New/updated regression tests cover config persistence, tool result attachments, and rendered image attachments.
  - [ ] `packages/ideaspace`, `packages/app`, and `packages/desktop` verification commands all pass.
  - [ ] No stale references to `packages/opencode` remain in touched tests or implementation paths.

  **QA Scenarios** (MANDATORY — task incomplete without these):

  ```
  Scenario: Full verification command suite passes
    Tool: Bash
    Steps: Run `bun run typecheck` and `bun test --timeout 30000` in `packages/ideaspace`, `bun run typecheck` and `bun test` in `packages/app`, and `bun run typecheck` in `packages/desktop`.
    Expected: All commands exit successfully.
    Evidence: .sisyphus/evidence/task-7-verification.txt

  Scenario: End-to-end fixture path from config to rendered image passes
    Tool: Bash
    Steps: Run the focused integration-style app/backend test that seeds `config.image_model`, stubs a successful image tool response, and renders the resulting assistant turn.
    Expected: The test proves the configured model is read, the tool returns an attachment, and the UI renders the image.
    Evidence: .sisyphus/evidence/task-7-integration.txt
  ```

  **Commit**: NO | Message: `test(chat): cover image generation flow` | Files: `packages/sdk/js/**`, `packages/ideaspace/test/**`, `packages/app/src/**/*.test.tsx`, any minimal supporting fixtures

## Final Verification Wave (4 parallel agents, ALL must APPROVE)

- [ ] F1. Plan Compliance Audit — oracle
- [ ] F2. Code Quality Review — unspecified-high
- [ ] F3. Real Manual QA — unspecified-high (+ playwright if UI)
- [ ] F4. Scope Fidelity Check — deep

## Commit Strategy

- Single feature commit after all implementation and verification pass.
- Preferred message: `feat(chat): add Gemini image generation settings and tool rendering`

## Success Criteria

- Settings contains a dedicated Images tab with a persisted default image model.
- The assistant can generate an image through a backend tool using the configured Google/Gemini model.
- Generated images appear inline in the chat timeline without manual refresh.
- A durable on-disk copy is written under the Ideaspace data directory.
- Backend, app, and desktop typecheck/test verification pass.
