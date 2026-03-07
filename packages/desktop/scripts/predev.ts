import { $ } from "bun"

import { copyBinaryToSidecarFolder, getCurrentSidecar, windowsify } from "./utils"

const RUST_TARGET = Bun.env.TAURI_ENV_TARGET_TRIPLE

const sidecarConfig = getCurrentSidecar(RUST_TARGET)

const binaryPath = windowsify(`../ideaspace/dist/${sidecarConfig.bin}/bin/ideaspace`)

await (sidecarConfig.bin.includes("-baseline")
  ? $`cd ../ideaspace && bun run build --single --baseline`
  : $`cd ../ideaspace && bun run build --single`)

await copyBinaryToSidecarFolder(binaryPath, RUST_TARGET)
