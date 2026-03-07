# Build the Ideaspace macOS app

Use this when you want a local `.app` bundle or `.dmg` installer for testing the desktop app.

## Why this has an extra step

The desktop app bundles a local CLI sidecar. That sidecar must exist in `src-tauri/sidecars` before `tauri build` can produce the macOS app bundle.

This repo also expects Bun `1.3.10`, so the safest path is to call that version explicitly.

## Apple Silicon build

From `packages/desktop`:

```bash
TAURI_ENV_TARGET_TRIPLE=aarch64-apple-darwin npx -y bun@1.3.10 ./scripts/predev.ts
npx -y bun@1.3.10 run tauri build
```

## Intel Mac build

From `packages/desktop`:

```bash
TAURI_ENV_TARGET_TRIPLE=x86_64-apple-darwin npx -y bun@1.3.10 ./scripts/predev.ts
npx -y bun@1.3.10 run tauri build
```

## Output paths

For the current desktop config, the build outputs land here:

- `.app`: `packages/desktop/src-tauri/target/release/bundle/macos/Ideaspace Dev.app`
- `.dmg`: `packages/desktop/src-tauri/target/release/bundle/dmg/Ideaspace Dev_1.2.20_aarch64.dmg`

The exact filename can change with the configured product name, version, and target architecture.

## Open the built app

```bash
open "packages/desktop/src-tauri/target/release/bundle/macos/Ideaspace Dev.app"
open "packages/desktop/src-tauri/target/release/bundle/dmg/Ideaspace Dev_1.2.20_aarch64.dmg"
```

## Common failure

If `tauri build` fails with a missing path like `src-tauri/sidecars/opencode-cli-aarch64-apple-darwin`, you skipped the `predev.ts` step above.
