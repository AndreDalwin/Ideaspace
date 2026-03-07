# Global Agents Configuration Page

## TL;DR

> **Summary**: Create a global Agents configuration page accessible from the sidebar above the settings gear icon. Users can view, create, and edit agents with full configuration control (model, prompt, permissions, MCPs, subagents). Built-in agents are editable with reset-to-default functionality. Changes save to global config (~/.ideaspace/ideaspace.json) for the global agents page. Project-scoped agent editing will be added later in project settings.
>
> **Deliverables**:
>
> - New `/agents` global route
> - Sidebar navigation item above settings gear
> - Agents list page with split-pane layout
> - Agent detail editor with all configuration fields
> - Create new agent functionality
> - Delete custom agent functionality
> - Reset built-in agents to defaults
>
> **Effort**: Large (5-8 hours)
> **Parallel**: NO - Sequential waves due to shared UI foundation
> **Critical Path**: Sidebar nav → Route → List view → Detail editor → API integration

## Context

### Original Request

Add a visual place in the sidebar (above the gear icon) where users can configure agents, set default models, customize system prompts, and manage subagents, tools, MCPs, and permissions.

### Interview Summary

- **Scope**: Global-scoped agents page in sidebar (Phase 1). Project-scoped settings tab will be Phase 2.
- **Storage**: Global config only (~/.ideaspace/ideaspace.json) for the global agents page. Project config editing will be added later.
- **Built-ins**: Editable with reset-to-default option
- **Features**: View agents, edit configuration, create custom agents, delete custom agents, set default agent

### Metis Review (gaps addressed)

- **Critical assumptions validated**: Global scope confirmed, storage precedence confirmed, built-in editability confirmed
- **Guardrails**: MCP server management excluded (only selection per-agent), Agent testing excluded
- **Edge cases identified**: Empty states, validation, concurrent editing, dirty state, delete confirmation
- **Risks mitigated**: API scope clarified, config persistence defined

## Work Objectives

### Core Objective

Create a global Agents configuration page that provides full CRUD operations for agent management with a professional, intuitive UI.

### Deliverables

1. Sidebar navigation item for global Agents page
2. Global `/agents` route
3. Agents list view with search/filter
4. Agent detail editor with all config fields
5. Create new agent flow
6. Delete custom agent functionality
7. Reset built-in agent to defaults
8. Set default agent for new sessions

### Definition of Done (verifiable conditions)

- [ ] Sidebar shows Agents icon above settings gear
- [ ] Clicking Agents icon navigates to `/agents` route
- [ ] Page loads and displays all agents from `client.app.agents()`
- [ ] Selecting an agent shows detail editor with all fields
- [ ] Changes save via `client.config.update()`
- [ ] Built-in agents show "Reset to defaults" button
- [ ] Custom agents show "Delete" button with confirmation
- [ ] "Create agent" button opens creation flow
- [ ] Default agent selector sets `default_agent` in config
- [ ] All changes persist across app restarts

### Must Have

- Global sidebar navigation item
- `/agents` route
- List all agents (built-in + custom)
- Edit agent: name, description, model, temperature, prompt, mode
- Edit permissions: file system, bash, web, tools
- MCP server selection per agent
- Create new custom agent
- Delete custom agent
- Reset built-in agent to defaults
- Set default agent
- Form validation
- Unsaved changes warning

### Must NOT Have (guardrails, AI slop patterns, scope boundaries)

- MCP server management (adding/removing servers) - OUT OF SCOPE
- Agent testing/running within config page - OUT OF SCOPE
- Agent usage analytics/metrics - OUT OF SCOPE
- Agent marketplace/sharing - OUT OF SCOPE
- Real-time agent monitoring - OUT OF SCOPE
- Batch editing multiple agents - OUT OF SCOPE
- Agent version history - OUT OF SCOPE
- Import/export agent configs - OUT OF SCOPE

## Verification Strategy

### Test Decision

- **Manual testing** - User will test each feature
- No automated test suite required

### QA Policy

Each task includes a manual test checklist for user verification.

### Manual Test Checklist (Consolidated)

After all tasks are complete, verify:

**Navigation:**

- [ ] Agents icon visible in sidebar above settings gear
- [ ] Clicking icon navigates to `/agents`
- [ ] Icon highlights when on /agents route

**List View:**

- [ ] All agents display (build, plan, general, explore, any custom)
- [ ] Built-in agents have indicator/badge
- [ ] Custom agents distinguishable
- [ ] Search filters list correctly
- [ ] Clicking agent opens detail view

**Detail Editor - Basic Info:**

- [ ] Name editable for custom agents
- [ ] Name read-only for built-in agents
- [ ] Description editable
- [ ] Mode selector works (primary/subagent/all)
- [ ] Validation: empty name shows error
- [ ] Validation: duplicate name shows error

**Detail Editor - Model:**

- [ ] Model dropdown populated with available models
- [ ] Temperature slider works (0-2)
- [ ] Temperature preset buttons work
- [ ] Variant selector appears when model has variants
- [ ] Steps input accepts numbers

**Detail Editor - Prompt:**

- [ ] Textarea for system prompt
- [ ] Character count updates
- [ ] Expandable/collapsible section

**Detail Editor - Permissions:**

- [ ] File System permissions (edit: allow/ask/deny)
- [ ] Network permissions (webfetch, websearch)
- [ ] Tools permissions (bash)
- [ ] Special permissions (doom_loop, question)

**Detail Editor - MCPs:**

- [ ] MCP list loads
- [ ] Checkboxes for each MCP
- [ ] Selected MCPs save correctly

**Save Functionality:**

- [ ] Save button saves changes to global config
- [ ] Disabled when no changes
- [ ] Success feedback shown
- [ ] Changes persist after restart

**Create Agent:**

- [ ] Create button opens dialog
- [ ] Name validation (required, unique, no reserved names like "build")
- [ ] Template selection works
- [ ] New agent appears in list
- [ ] New agent auto-selected

**Delete Agent:**

- [ ] Delete button for custom agents only
- [ ] No delete for built-ins
- [ ] Confirmation dialog appears
- [ ] Agent removed from list after delete

**Reset Built-in:**

- [ ] Reset button for built-ins only
- [ ] No reset for custom agents
- [ ] Confirmation dialog appears
- [ ] Values revert to defaults

**Default Agent:**

- [ ] Default agent dropdown visible
- [ ] Only primary agents in dropdown
- [ ] Changing default updates config
- [ ] Default persists after restart

**Unsaved Changes:**

- [ ] Warning appears on navigate away with unsaved changes
- [ ] Visual indicator on save button when dirty

## Execution Strategy

### Sequential Execution Waves

> This is a UI-heavy feature with shared foundation. Sequential execution reduces integration risk.

**Wave 1: Foundation**

- Sidebar navigation component
- Global route registration
- Empty state scaffolding

**Wave 2: Data Layer**

- Agents context/provider
- API integration
- Config persistence logic

**Wave 3: List View**

- Agents list component
- Search/filter
- Agent cards

**Wave 4: Detail Editor**

- Agent detail layout
- Form fields
- Validation

**Wave 5: CRUD Operations**

- Create agent flow
- Delete agent
- Reset built-in

**Wave 6: Polish**

- Default agent selector
- Unsaved changes warning
- Error states

### Dependency Matrix

| Task          | Blocks            | Blocked By           |
| ------------- | ----------------- | -------------------- |
| Sidebar nav   | Route, List view  | -                    |
| Route         | List view         | Sidebar nav          |
| Data provider | List view, Editor | -                    |
| List view     | Editor            | Data provider, Route |
| Editor        | CRUD ops          | List view            |
| CRUD ops      | -                 | Editor               |

### Agent Dispatch Summary

| Wave | Tasks | Categories         |
| ---- | ----- | ------------------ |
| 1    | 3     | visual-engineering |
| 2    | 3     | unspecified-high   |
| 3    | 2     | visual-engineering |
| 4    | 4     | visual-engineering |
| 5    | 3     | unspecified-high   |
| 6    | 2     | visual-engineering |

## TODOs

- [ ] 1. Add Agents sidebar navigation item

  **What to do**:
  - Add icon button in `sidebar-shell.tsx` above settings gear (line 93)
  - Use `brain` icon from @ideaspace-ai/ui/icon (already exists in icon.tsx)
  - Add tooltip with "Agents" label
  - On click, navigate to `/agents` route
  - Highlight when on `/agents` route

  **Must NOT do**:
  - Don't add to project-scoped sidebar sections
  - Don't use icons not defined in packages/ui/src/components/icon.tsx

  **Recommended Agent Profile**:
  - Category: `visual-engineering` - UI component work
  - Skills: [`frontend-ui-ux`] - SolidJS components

  **Parallelization**: Wave 1 | Can Parallel: NO | Blocks: 2, 3 | Blocked By: -

  **References**:
  - Pattern: `packages/app/src/pages/layout/sidebar-shell.tsx:93-112` - Bottom rail buttons
  - Component: `packages/app/src/pages/layout/sidebar-items.tsx` - IconButton usage
  - Icon library: @ideaspace-ai/ui/icon (use `brain` icon)

  **Acceptance Criteria**:
  - [ ] Icon appears above settings gear in sidebar
  - [ ] Tooltip shows "Agents" on hover
  - [ ] Click navigates to `/agents`
  - [ ] Icon highlights when route is active

  **Commit**: YES | Message: `feat(app): add agents navigation to sidebar` | Files: `packages/app/src/pages/layout/sidebar-shell.tsx`

- [ ] 2. Register global /agents route

  **What to do**:
  - Add `/agents` route in `app.tsx` at top level (not under `/:dir`)
  - Create lazy-loaded `AgentsPage` component
  - Route should be accessible without project context
  - Use existing providers (Settings, Layout, etc.)

  **Must NOT do**:
  - Don't nest under `/:dir` like project routes
  - Don't require project selection to view

  **Recommended Agent Profile**:
  - Category: `unspecified-high` - Route configuration
  - Skills: []

  **Parallelization**: Wave 1 | Can Parallel: YES (with task 1) | Blocks: 3 | Blocked By: -

  **References**:
  - Pattern: `packages/app/src/app.tsx:166-167` - Home route (top-level)
  - Pattern: `packages/app/src/app.tsx:168-174` - Project routes (nested)
  - Lazy loading: `packages/app/src/app.tsx:33-35` - lazy() imports

  **Acceptance Criteria**:
  - [ ] Route `/agents` registered in Router
  - [ ] Lazy-loaded component pattern
  - [ ] Accessible without project context
  - [ ] Uses AppShellProviders

  **Commit**: YES | Message: `feat(app): add global /agents route` | Files: `packages/app/src/app.tsx`, `packages/app/src/pages/agents/index.tsx`

- [ ] 3. Create Agents page shell

  **What to do**:
  - Create `packages/app/src/pages/agents/index.tsx`
  - Basic page layout with header "Agents"
  - Placeholder for list and detail panes
  - Use existing page styling patterns
  - Add to lazy imports in app.tsx

  **Must NOT do**:
  - Don't implement full UI yet - just shell
  - Don't add data fetching yet

  **Recommended Agent Profile**:
  - Category: `visual-engineering` - Page layout
  - Skills: [`frontend-ui-ux`]

  **Parallelization**: Wave 1 | Can Parallel: YES (with 1, 2) | Blocks: 5 | Blocked By: 2

  **References**:
  - Pattern: `packages/app/src/pages/home.tsx` - Page component structure
  - Pattern: `packages/app/src/pages/project.tsx:268-319` - Page layout with header

  **Acceptance Criteria**:
  - [ ] Page component created
  - [ ] Lazy import added
  - [ ] Basic header renders
  - [ ] Responsive layout container

  **Commit**: YES | Message: `feat(app): create agents page shell` | Files: `packages/app/src/pages/agents/index.tsx`, `packages/app/src/app.tsx`

- [ ] 4. Create Agents data provider

  **What to do**:
  - Create `packages/app/src/context/agents.tsx`
  - Fetch agents via `client.app.agents()` API
  - Fetch global config via `client.config.get()` API
  - Provide agent list, selected agent, update functions
  - Save changes to global config only (Phase 1)
  - Use SolidJS `createStore` for state

  **Must NOT do**:
  - Don't use React context patterns
  - Don't fetch on every render - use proper reactivity

  **Recommended Agent Profile**:
  - Category: `unspecified-high` - Data layer
  - Skills: []

  **Parallelization**: Wave 2 | Can Parallel: NO | Blocks: 5, 6, 7 | Blocked By: 3

  **References**:
  - Pattern: `packages/app/src/context/settings.tsx` - createSimpleContext pattern
  - API: `packages/sdk/js/src/v2/gen/sdk.gen.ts:3741-3764` - App.agents() (runtime Agent type)
  - API: `packages/sdk/js/src/v2/gen/sdk.gen.ts:737-797` - Config.get/update() (for saving)
  - Type: `packages/sdk/js/src/v2/gen/types.gen.ts:1075-1141` - AgentConfig type (for editing/saving)
  - Type: `packages/sdk/js/src/v2/gen/types.gen.ts:1374-1398` - config.agent and default_agent fields

  **Acceptance Criteria**:
  - [ ] Provider fetches agents from API
  - [ ] Provider fetches global config from API
  - [ ] Provides agent list with computed properties
  - [ ] Provides update function that saves to global config

  **Commit**: YES | Message: `feat(app): add agents data provider` | Files: `packages/app/src/context/agents.tsx`

- [ ] 5. Build Agents list view

  **What to do**:
  - Create `packages/app/src/pages/agents/list.tsx`
  - Display agents from context provider
  - Group by mode (primary vs subagent)
  - Show agent name, description, mode badge
  - Show built-in indicator
  - Click to select agent
  - Search/filter input
  - Use card-based layout

  **Must NOT do**:
  - Don't implement drag-and-drop reordering
  - Don't add complex animations

  **Recommended Agent Profile**:
  - Category: `visual-engineering` - UI components
  - Skills: [`frontend-ui-ux`]

  **Parallelization**: Wave 3 | Can Parallel: NO | Blocks: 6 | Blocked By: 4

  **References**:
  - Pattern: `packages/app/src/pages/project.tsx:179-229` - Card grid layout
  - Component: @ideaspace-ai/ui/card, @ideaspace-ai/ui/tag
  - Icons: @ideaspace-ai/ui/icon

  **Acceptance Criteria**:
  - [ ] Lists all agents from provider
  - [ ] Groups by mode (primary/subagent)
  - [ ] Shows name, description, mode badge
  - [ ] Built-in agents have indicator
  - [ ] Click selects agent
  - [ ] Search filters list

- [ ] 6. Build Agent detail layout

  **What to do**:
  - Create `packages/app/src/pages/agents/detail.tsx`
  - Split-pane layout: list on left, editor on right
  - Form sections: Basic Info, Model, Prompt, Permissions, MCPs
  - Use existing form components from @ideaspace-ai/ui
  - Responsive: stack on mobile

  **Must NOT do**:
  - Don't implement all form fields yet - just layout
  - Don't add validation yet

  **Recommended Agent Profile**:
  - Category: `visual-engineering` - Layout
  - Skills: [`frontend-ui-ux`]

  **Parallelization**: Wave 4 | Can Parallel: NO | Blocks: 7, 8, 9 | Blocked By: 5

  **References**:
  - Pattern: `packages/app/src/components/settings-general.tsx` - Form layout
  - Pattern: `packages/app/src/components/dialog-settings.tsx` - Split pane tabs
  - Components: @ideaspace-ai/ui/text-field, @ideaspace-ai/ui/select

  **Acceptance Criteria**:
  - [ ] Split-pane layout renders
  - [ ] Left side shows list
  - [ ] Right side shows editor form
  - [ ] Responsive on mobile

- [ ] 7. Implement Basic Info form fields

  **What to do**:
  - Add fields: name, description, mode (select)
  - Mode options: primary, subagent, all
  - Name validation (required, unique)
  - Real-time updates to context

  **Must NOT do**:
  - Don't allow editing built-in agent names (read-only)

  **Recommended Agent Profile**:
  - Category: `visual-engineering` - Forms
  - Skills: [`frontend-ui-ux`]

  **Parallelization**: Wave 4 | Can Parallel: YES (with 8, 9, 10) | Blocks: 12 | Blocked By: 6

  **References**:
  - Pattern: `packages/app/src/components/settings-general.tsx` - Input fields
  - Type: `packages/sdk/js/src/v2/gen/types.gen.ts:1075-1141` - AgentConfig type

  **Acceptance Criteria**:
  - [ ] Name field editable (custom agents only)
  - [ ] Description field editable
  - [ ] Mode selector with 3 options
  - [ ] Validation: name required
  - [ ] Validation: name unique

- [ ] 8. Implement Model configuration fields

  **What to do**:
  - Model selector (from available providers)
  - Temperature slider (0-2, step 0.1)
  - Temperature presets: 0.0, 0.3, 0.7, 1.0, 1.5
  - Variant selector (if model has variants)
  - Steps input (max iterations)

  **Must NOT do**:
  - Don't implement custom model input (select from available only)

  **Recommended Agent Profile**:
  - Category: `visual-engineering` - Forms
  - Skills: [`frontend-ui-ux`]

  **Parallelization**: Wave 4 | Can Parallel: YES (with 7, 9, 10) | Blocks: 12 | Blocked By: 6

  **References**:
  - Pattern: `packages/app/src/components/settings-models.tsx` - Model selection
  - API: `packages/sdk/js/src/v2/gen/sdk.gen.ts:804-827` - Config.providers()
  - Components: @ideaspace-ai/ui/text-field (number input for temperature)

  **Acceptance Criteria**:
  - [ ] Model dropdown with available models
  - [ ] Temperature slider with value display
  - [ ] Temperature preset buttons
  - [ ] Variant selector (conditional)
  - [ ] Steps number input

- [ ] 9. Implement System Prompt editor

  **What to do**:
  - Textarea for system prompt
  - Character count display
  - Expandable/collapsible section
  - Placeholder text with example

  **Must NOT do**:
  - Don't add rich text editor (plain text only)

  **Recommended Agent Profile**:
  - Category: `visual-engineering` - Forms
  - Skills: [`frontend-ui-ux`]

  **Parallelization**: Wave 4 | Can Parallel: YES (with 7, 8, 10) | Blocks: 12 | Blocked By: 6

  **References**:
  - Pattern: `packages/app/src/pages/session/composer/` - Textarea usage
  - Components: @ideaspace-ai/ui/text-field

  **Acceptance Criteria**:
  - [ ] Textarea for prompt
  - [ ] Character count displayed
  - [ ] Expandable section
  - [ ] Placeholder visible

- [ ] 10. Implement Permissions editor

  **What to do**:
  - Permission categories: File System, Network, Tools, Other
  - Each permission: allow/ask/deny radio buttons
  - File System: edit (allow/ask/deny) + path patterns
  - Network: webfetch, websearch (allow/ask/deny)
  - Tools: bash (allow/ask/deny + path patterns)
  - Special: doom_loop, question

  **Must NOT do**:
  - Don't add complex path pattern builder (simple textarea for now)

  **Recommended Agent Profile**:
  - Category: `visual-engineering` - Complex forms
  - Skills: [`frontend-ui-ux`]

  **Parallelization**: Wave 4 | Can Parallel: YES (with 7, 8, 9) | Blocks: 12 | Blocked By: 6

  **References**:
  - Type: `packages/sdk/js/src/v2/gen/types.gen.ts:1075-1141` - AgentConfig permission structure
  - Pattern: `packages/app/src/components/settings-permissions.tsx` - Permission UI
  - Components: @ideaspace-ai/ui/radio-group

  **Acceptance Criteria**:
  - [ ] File System permissions section
  - [ ] Network permissions section
  - [ ] Tools permissions section
  - [ ] Allow/Ask/Deny for each
  - [ ] Path pattern textarea for file/bash

- [ ] 11. Implement MCP selection

  **What to do**:
  - Fetch available MCPs via `client.mcp.status()`
  - Multi-select or checkbox list
  - Show MCP name, type (local/remote), status
  - Save selected MCPs to agent config

  **Must NOT do**:
  - Don't implement MCP server management (only selection)

  **Recommended Agent Profile**:
  - Category: `visual-engineering` - Forms
  - Skills: [`frontend-ui-ux`]

  **Parallelization**: Wave 4 | Can Parallel: YES (with 7, 8, 9, 10) | Blocks: 12 | Blocked By: 6

  **References**:
  - API: `packages/sdk/js/src/v2/gen/sdk.gen.ts` - Mcp.status()
  - Type: `packages/sdk/js/src/v2/gen/types.gen.ts` - Mcp config types
  - Use @ideaspace-ai/ui/checkbox for MCP selection UI

  **Acceptance Criteria**:
  - [ ] MCP list fetched from API
  - [ ] Checkbox for each MCP
  - [ ] Shows name and type
  - [ ] Selected MCPs saved to config

- [ ] 12. Add Save functionality

  **What to do**:
  - Save button in detail header
  - Dirty state tracking
  - Call context update function
  - Save to global config
  - Show success toast
  - Handle errors

  **Must NOT do**:
  - Don't auto-save (explicit save only)

  **Recommended Agent Profile**:
  - Category: `unspecified-high` - Logic
  - Skills: []

  **Parallelization**: Wave 5 | Can Parallel: NO | Blocks: 14 | Blocked By: 7, 8, 9, 10, 11

  **References**:
  - Pattern: `packages/app/src/context/settings.tsx` - Update patterns
  - API: `packages/sdk/js/src/v2/gen/sdk.gen.ts:767-797` - Config.update()
  - Toast: @ideaspace-ai/ui/toast

  **Acceptance Criteria**:
  - [ ] Save button visible
  - [ ] Disabled when no changes
  - [ ] Saves to global config
  - [ ] Success toast shown
  - [ ] Error handling

- [ ] 13. Add Create new agent flow

  **What to do**:
  - "Create agent" button in list header
  - Dialog for agent name and base template
  - Templates: Empty, Copy from existing
  - Create agent in context
  - Select new agent after creation

  **Must NOT do**:
  - Don't allow creating agents with reserved names (build, plan, etc.)

  **Recommended Agent Profile**:
  - Category: `unspecified-high` - Logic
  - Skills: []

  **Parallelization**: Wave 5 | Can Parallel: NO | Blocks: - | Blocked By: 12

  **References**:
  - Pattern: `packages/app/src/components/dialog-edit-project.tsx` - Dialog pattern
  - Components: @ideaspace-ai/ui/dialog, @ideaspace-ai/ui/text-field

  **Acceptance Criteria**:
  - [ ] Create button visible
  - [ ] Dialog opens on click
  - [ ] Name validation (required, unique, no reserved)
  - [ ] Template selection
  - [ ] New agent appears in list
  - [ ] New agent selected

- [ ] 14. Add Delete custom agent

  **What to do**:
  - Delete button for custom agents only
  - Confirmation dialog
  - Delete from context
  - Delete from config
  - Select another agent after delete

  **Must NOT do**:
  - Don't show delete for built-in agents

  **Recommended Agent Profile**:
  - Category: `unspecified-high` - Logic
  - Skills: []

  **Parallelization**: Wave 5 | Can Parallel: NO | Blocks: - | Blocked By: 12

  **References**:
  - Pattern: `packages/app/src/components/dialog-edit-project.tsx` - Dialog pattern
  - Components: @ideaspace-ai/ui/dialog, @ideaspace-ai/ui/button

  **Acceptance Criteria**:
  - [ ] Delete button for custom agents
  - [ ] No delete button for built-ins
  - [ ] Confirmation dialog
  - [ ] Agent removed from list
  - [ ] Config updated

- [ ] 15. Add Reset built-in to defaults

  **What to do**:
  - "Reset to defaults" button for built-in agents only
  - Confirmation dialog
  - Remove custom config for that agent
  - Revert to system defaults
  - Refresh agent data

  **Must NOT do**:
  - Don't show reset for custom agents

  **Recommended Agent Profile**:
  - Category: `unspecified-high` - Logic
  - Skills: []

  **Parallelization**: Wave 5 | Can Parallel: NO | Blocks: - | Blocked By: 12

  **References**:
  - Pattern: `packages/app/src/context/settings.tsx:180-182` - Reset pattern

  **Acceptance Criteria**:
  - [ ] Reset button for built-ins
  - [ ] No reset for custom agents
  - [ ] Confirmation dialog
  - [ ] Config cleared for that agent
  - [ ] Reverts to defaults

- [ ] 16. Add Default agent selector

  **What to do**:
  - Dropdown in list header or page header
  - Shows current default agent
  - Lists only primary agents
  - Changes `default_agent` in global config
  - Updates on save

  **Must NOT do**:
  - Don't allow setting subagent as default

  **Recommended Agent Profile**:
  - Category: `visual-engineering` - Forms
  - Skills: [`frontend-ui-ux`]

  **Parallelization**: Wave 6 | Can Parallel: YES (with 17) | Blocks: - | Blocked By: 12

  **References**:
  - Type: `packages/sdk/js/src/v2/gen/types.gen.ts:1374` - default_agent field
  - Components: @ideaspace-ai/ui/select

  **Acceptance Criteria**:
  - [ ] Default agent dropdown visible
  - [ ] Shows only primary agents
  - [ ] Updates config on save
  - [ ] Persists across restarts

- [ ] 17. Add Unsaved changes warning

  **What to do**:
  - Track dirty state in context
  - Beforeunload handler
  - Navigation guard (if possible in Solid Router)
  - Visual indicator (dot on save button)
  - Confirm dialog on navigate away

  **Must NOT do**:
  - Don't block navigation entirely - just warn

  **Recommended Agent Profile**:
  - Category: `unspecified-high` - Logic
  - Skills: []

  **Parallelization**: Wave 6 | Can Parallel: YES (with 16) | Blocks: - | Blocked By: 12

  **References**:
  - Pattern: Standard beforeunload pattern

  **Acceptance Criteria**:
  - [ ] Dirty state tracked
  - [ ] Visual indicator on save button
  - [ ] beforeunload handler registered
  - [ ] Warning shows on navigate away

## Final Verification Wave (4 parallel agents, ALL must APPROVE)

- [ ] F1. Plan Compliance Audit — oracle
      Verify all TODOs completed, no scope creep, all acceptance criteria met
- [ ] F2. Code Quality Review — unspecified-high  
       Check TypeScript errors, code style, component structure
- [ ] F3. Real Manual QA — unspecified-high
      User runs full E2E flow: navigate, edit, save, create, delete, reset
- [ ] F4. Scope Fidelity Check — deep
      Verify no out-of-scope features implemented (MCP management, testing, etc.)

## Commit Strategy

| Task | Commit Message                                | Files                                     |
| ---- | --------------------------------------------- | ----------------------------------------- |
| 1    | `feat(app): add agents navigation to sidebar` | sidebar-shell.tsx                         |
| 2    | `feat(app): add global /agents route`         | app.tsx, agents/index.tsx                 |
| 3    | `feat(app): create agents page shell`         | agents/index.tsx, app.tsx                 |
| 4    | `feat(app): add agents data provider`         | context/agents.tsx                        |
| 5    | `feat(app): add agents list view`             | agents/list.tsx, agents/index.tsx         |
| 6    | `feat(app): add agent detail layout`          | agents/detail.tsx, agents/index.tsx       |
| 7    | `feat(app): add agent basic info fields`      | agents/detail.tsx                         |
| 8    | `feat(app): add agent model configuration`    | agents/detail.tsx                         |
| 9    | `feat(app): add agent prompt editor`          | agents/detail.tsx                         |
| 10   | `feat(app): add agent permissions editor`     | agents/detail.tsx                         |
| 11   | `feat(app): add agent MCP selection`          | agents/detail.tsx                         |
| 12   | `feat(app): add agent save functionality`     | agents/detail.tsx, context/agents.tsx     |
| 13   | `feat(app): add create agent flow`            | agents/list.tsx, agents/create-dialog.tsx |
| 14   | `feat(app): add delete agent functionality`   | agents/detail.tsx                         |
| 15   | `feat(app): add reset built-in agent`         | agents/detail.tsx, context/agents.tsx     |
| 16   | `feat(app): add default agent selector`       | agents/index.tsx, agents/list.tsx         |
| 17   | `feat(app): add unsaved changes warning`      | agents/detail.tsx, context/agents.tsx     |

## Success Criteria

### Functional

- [ ] Agents icon visible in sidebar above settings gear
- [ ] Clicking icon navigates to `/agents`
- [ ] All agents load and display
- [ ] Agent selection shows detail editor
- [ ] All fields editable (with restrictions for built-ins)
- [ ] Changes save to global config
- [ ] Create new custom agent works
- [ ] Delete custom agent works
- [ ] Reset built-in agent works
- [ ] Set default agent works
- [ ] Unsaved changes warning works

### Quality

- [ ] No TypeScript errors
- [ ] Responsive layout works
- [ ] Form validation works
- [ ] Error states handled
- [ ] Loading states visible

### Scope

- [ ] No MCP server management
- [ ] No agent testing
- [ ] No analytics/metrics
- [ ] No marketplace features
