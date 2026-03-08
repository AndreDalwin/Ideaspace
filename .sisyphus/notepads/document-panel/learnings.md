# DocumentPanel Component Learnings

## File Context API

The `useFile` context exposes these key methods:

- `file.get(path)` - Returns file state including `content` property
- `file.load(path)` - Loads file content from disk
- `file.tree.refresh(dir)` - Refreshes directory tree

## FileContent Type

FileContent from `@opencode-ai/sdk/v2` has a `type` field:

- For text files: `{ type: "text", content: string }`
- Must check `content.type === "text"` before accessing `content.content`

## Component Patterns

- Use `createStore` instead of multiple `createSignal` calls (per AGENTS.md)
- Separate effects for loading vs. updating content
- Use `createMemo` for derived state like task counts

## Available Icons

Valid icon names include:

- `"arrow-down-to-line"` (refresh action)
- Check `@opencode-ai/ui` icon set for available options

## Markdown Component

- Import: `import { Markdown } from "@opencode-ai/ui/markdown"`
- Props: `text` (string), `class` (string for styling)
- Use `"prose prose-invert max-w-none"` for consistent styling
