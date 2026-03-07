# Ideaspace

Ideaspace is a desktop-first AI workspace we are building for a hackathon.

This repo started from `anomalyco/opencode`, but the current direction is different: Ideaspace is becoming a project-based environment where a team can plan work, manage tasks, coordinate agents, and keep shared context in one place while still keeping the AI session experience central.

## What Ideaspace is right now

- A desktop-first starter shell for project-based AI work
- A project UI with starter tabs for `Workspace`, `Tasks`, `Agents`, `Context`, and `Session`
- An Ideaspace-first runtime/config path that prefers `.ideaspace`
- A hackathon scaffold that teammates can branch from quickly

## What we are building next

The current starter is meant to unblock fast parallel work during the hackathon:

- **Workspace** for planning docs, notes, and markdown-heavy workflows
- **Tasks** for a kanban-style planning and execution view
- **Agents** for visualizing and configuring agent work
- **Context** for knowledge sources other agents can reuse
- **Session** for the core AI chat and execution flow that already exists

## Current scope

- Focus on the desktop app first
- Keep the AI/session experience intact
- Use Ideaspace branding where it matters for desktop/runtime flows
- Prefer `.ideaspace` over `.opencode`, while keeping some legacy compatibility where practical
- Defer broad TUI/CLI cleanup and deeper repo-wide rename work until later

## Repo status

This is an active hackathon repo, not a polished product release.

Right now the goal is to keep the shell stable enough that teammates can branch off and independently build planning pages, task boards, agent dashboards, and context tooling without having to redesign the app structure first.

## Local development

### Requirements

- Bun `1.3.10` is the target version for repo builds
- Tauri/Rust prerequisites are still required for native desktop builds

### App + backend

Run these separately for local UI work:

```bash
# Backend
cd packages/opencode
bun run --conditions=browser ./src/index.ts serve --port 4096

# App
cd packages/app
bun dev -- --port 4444
```

Then open `http://localhost:4444`.

### Desktop

```bash
cd packages/desktop
bun tauri dev
```

## Verification

For the current hackathon phase, package-level build health is the main bar:

```bash
# App
cd packages/app
bun run typecheck
bun run test:unit
bun run build

# Backend/package build
cd packages/opencode
bun run build
```

If your local Bun is older than `1.3.10`, run the backend build with:

```bash
npx -y bun@1.3.10 run build
```

## Notes

- The current desktop shell already preserves the session experience while adding project tabs.
- `.ideaspace` is the intended config/workspace home going forward.
- More aggressive repo cleanup and full OpenCode removal can happen after the hackathon starter is in a better place.
