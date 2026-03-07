# Ideaspace app shell

`packages/app` is the shared Solid UI shell used by the Ideaspace desktop app.

## Local development

Run the backend and app separately:

```bash
# Backend
cd ../opencode
bun run --conditions=browser ./src/index.ts serve --port 4096

# App
cd ../app
bun dev -- --port 4444
```

Then open `http://localhost:4444`.

## Verification

Required local checks for the current hackathon scope:

```bash
bun run typecheck
bun run test:unit
bun run build
```

## Notes

- This package is the UI foundation for the desktop-first Ideaspace shell.
- The native bundle flow lives in `packages/desktop`; use `packages/desktop/BUILD_APP.md` for `.app`/`.dmg` packaging.
