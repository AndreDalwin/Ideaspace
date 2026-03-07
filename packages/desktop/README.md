# Ideaspace Desktop

Native Ideaspace desktop app, built with Tauri v2.

## Prerequisites

Building the desktop app requires additional Tauri dependencies (Rust toolchain, platform-specific libraries). See the [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/) for setup instructions.

## Development

From the repo root:

```bash
bun install
bun run --cwd packages/desktop tauri dev
```

If you are building distributable artifacts, use the verified app build guide instead of calling `tauri build` directly:

- `./BUILD_APP.md`

## Build

Follow `./BUILD_APP.md` for the `.app` and `.dmg` flow, because the sidecar prep step is required.

## Troubleshooting

### Rust compiler not found

If you see errors about Rust not being found, install it via [rustup](https://rustup.rs/):

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```
