function truthy(key: string) {
  const value = process.env[key]?.toLowerCase()
  return value === "true" || value === "1"
}

function falsy(key: string) {
  const value = process.env[key]?.toLowerCase()
  return value === "false" || value === "0"
}

export namespace Flag {
  export const IDEASPACE_AUTO_SHARE = truthy("IDEASPACE_AUTO_SHARE")
  export const IDEASPACE_GIT_BASH_PATH = process.env["IDEASPACE_GIT_BASH_PATH"]
  export const IDEASPACE_CONFIG = process.env["IDEASPACE_CONFIG"]
  export declare const IDEASPACE_TUI_CONFIG: string | undefined
  export declare const IDEASPACE_CONFIG_DIR: string | undefined
  export const IDEASPACE_CONFIG_CONTENT = process.env["IDEASPACE_CONFIG_CONTENT"]
  export const IDEASPACE_DISABLE_AUTOUPDATE = truthy("IDEASPACE_DISABLE_AUTOUPDATE")
  export const IDEASPACE_DISABLE_PRUNE = truthy("IDEASPACE_DISABLE_PRUNE")
  export const IDEASPACE_DISABLE_TERMINAL_TITLE = truthy("IDEASPACE_DISABLE_TERMINAL_TITLE")
  export const IDEASPACE_PERMISSION = process.env["IDEASPACE_PERMISSION"]
  export const IDEASPACE_DISABLE_DEFAULT_PLUGINS = truthy("IDEASPACE_DISABLE_DEFAULT_PLUGINS")
  export const IDEASPACE_DISABLE_LSP_DOWNLOAD = truthy("IDEASPACE_DISABLE_LSP_DOWNLOAD")
  export const IDEASPACE_ENABLE_EXPERIMENTAL_MODELS = truthy("IDEASPACE_ENABLE_EXPERIMENTAL_MODELS")
  export const IDEASPACE_DISABLE_AUTOCOMPACT = truthy("IDEASPACE_DISABLE_AUTOCOMPACT")
  export const IDEASPACE_DISABLE_MODELS_FETCH = truthy("IDEASPACE_DISABLE_MODELS_FETCH")
  export const IDEASPACE_DISABLE_CLAUDE_CODE = truthy("IDEASPACE_DISABLE_CLAUDE_CODE")
  export const IDEASPACE_DISABLE_CLAUDE_CODE_PROMPT =
    IDEASPACE_DISABLE_CLAUDE_CODE || truthy("IDEASPACE_DISABLE_CLAUDE_CODE_PROMPT")
  export const IDEASPACE_DISABLE_CLAUDE_CODE_SKILLS =
    IDEASPACE_DISABLE_CLAUDE_CODE || truthy("IDEASPACE_DISABLE_CLAUDE_CODE_SKILLS")
  export const IDEASPACE_DISABLE_EXTERNAL_SKILLS =
    IDEASPACE_DISABLE_CLAUDE_CODE_SKILLS || truthy("IDEASPACE_DISABLE_EXTERNAL_SKILLS")
  export declare const IDEASPACE_DISABLE_PROJECT_CONFIG: boolean
  export const IDEASPACE_FAKE_VCS = process.env["IDEASPACE_FAKE_VCS"]
  export declare const IDEASPACE_CLIENT: string
  export const IDEASPACE_SERVER_PASSWORD = process.env["IDEASPACE_SERVER_PASSWORD"]
  export const IDEASPACE_SERVER_USERNAME = process.env["IDEASPACE_SERVER_USERNAME"]
  export const IDEASPACE_ENABLE_QUESTION_TOOL = truthy("IDEASPACE_ENABLE_QUESTION_TOOL")

  // Experimental
  export const IDEASPACE_EXPERIMENTAL = truthy("IDEASPACE_EXPERIMENTAL")
  export const IDEASPACE_EXPERIMENTAL_FILEWATCHER = truthy("IDEASPACE_EXPERIMENTAL_FILEWATCHER")
  export const IDEASPACE_EXPERIMENTAL_DISABLE_FILEWATCHER = truthy("IDEASPACE_EXPERIMENTAL_DISABLE_FILEWATCHER")
  export const IDEASPACE_EXPERIMENTAL_ICON_DISCOVERY =
    IDEASPACE_EXPERIMENTAL || truthy("IDEASPACE_EXPERIMENTAL_ICON_DISCOVERY")

  const copy = process.env["IDEASPACE_EXPERIMENTAL_DISABLE_COPY_ON_SELECT"]
  export const IDEASPACE_EXPERIMENTAL_DISABLE_COPY_ON_SELECT =
    copy === undefined ? process.platform === "win32" : truthy("IDEASPACE_EXPERIMENTAL_DISABLE_COPY_ON_SELECT")
  export const IDEASPACE_ENABLE_EXA =
    truthy("IDEASPACE_ENABLE_EXA") || IDEASPACE_EXPERIMENTAL || truthy("IDEASPACE_EXPERIMENTAL_EXA")
  export const IDEASPACE_EXPERIMENTAL_BASH_DEFAULT_TIMEOUT_MS = number("IDEASPACE_EXPERIMENTAL_BASH_DEFAULT_TIMEOUT_MS")
  export const IDEASPACE_EXPERIMENTAL_OUTPUT_TOKEN_MAX = number("IDEASPACE_EXPERIMENTAL_OUTPUT_TOKEN_MAX")
  export const IDEASPACE_EXPERIMENTAL_OXFMT = IDEASPACE_EXPERIMENTAL || truthy("IDEASPACE_EXPERIMENTAL_OXFMT")
  export const IDEASPACE_EXPERIMENTAL_LSP_TY = truthy("IDEASPACE_EXPERIMENTAL_LSP_TY")
  export const IDEASPACE_EXPERIMENTAL_LSP_TOOL = IDEASPACE_EXPERIMENTAL || truthy("IDEASPACE_EXPERIMENTAL_LSP_TOOL")
  export const IDEASPACE_DISABLE_FILETIME_CHECK = truthy("IDEASPACE_DISABLE_FILETIME_CHECK")
  export const IDEASPACE_EXPERIMENTAL_PLAN_MODE = IDEASPACE_EXPERIMENTAL || truthy("IDEASPACE_EXPERIMENTAL_PLAN_MODE")
  export const IDEASPACE_EXPERIMENTAL_MARKDOWN = !falsy("IDEASPACE_EXPERIMENTAL_MARKDOWN")
  export const IDEASPACE_MODELS_URL = process.env["IDEASPACE_MODELS_URL"]
  export const IDEASPACE_MODELS_PATH = process.env["IDEASPACE_MODELS_PATH"]
  export const IDEASPACE_DISABLE_CHANNEL_DB = truthy("IDEASPACE_DISABLE_CHANNEL_DB")

  function number(key: string) {
    const value = process.env[key]
    if (!value) return undefined
    const parsed = Number(value)
    return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined
  }
}

// Dynamic getter for IDEASPACE_DISABLE_PROJECT_CONFIG
// This must be evaluated at access time, not module load time,
// because external tooling may set this env var at runtime
Object.defineProperty(Flag, "IDEASPACE_DISABLE_PROJECT_CONFIG", {
  get() {
    return truthy("IDEASPACE_DISABLE_PROJECT_CONFIG")
  },
  enumerable: true,
  configurable: false,
})

// Dynamic getter for IDEASPACE_TUI_CONFIG
// This must be evaluated at access time, not module load time,
// because tests and external tooling may set this env var at runtime
Object.defineProperty(Flag, "IDEASPACE_TUI_CONFIG", {
  get() {
    return process.env["IDEASPACE_TUI_CONFIG"]
  },
  enumerable: true,
  configurable: false,
})

// Dynamic getter for IDEASPACE_CONFIG_DIR
// This must be evaluated at access time, not module load time,
// because external tooling may set this env var at runtime
Object.defineProperty(Flag, "IDEASPACE_CONFIG_DIR", {
  get() {
    return process.env["IDEASPACE_CONFIG_DIR"]
  },
  enumerable: true,
  configurable: false,
})

// Dynamic getter for IDEASPACE_CLIENT
// This must be evaluated at access time, not module load time,
// because some commands override the client at runtime
Object.defineProperty(Flag, "IDEASPACE_CLIENT", {
  get() {
    return process.env["IDEASPACE_CLIENT"] ?? "cli"
  },
  enumerable: true,
  configurable: false,
})
