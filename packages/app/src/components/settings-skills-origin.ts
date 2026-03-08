export type SkillOrigin = "managed-global" | "inherited-external" | "inherited-url-cache"

type Roots = {
  home: string
  config: string
  directory: string
  worktree: string
}

const clean = (value: string) => value.replace(/\\/g, "/").replace(/\/+/g, "/").replace(/\/$/, "").toLowerCase()

const absolute = (value: string) => {
  const path = value.replace(/\\/g, "/")
  return path.startsWith("/") || /^[a-z]:\//i.test(path)
}

const within = (file: string, dir: string) => {
  if (!dir) return false
  return file === dir || file.startsWith(`${dir}/`)
}

const nested = (file: string, dir: string) => {
  if (!dir) return false
  return file === dir || file.startsWith(`${dir}/`) || file.includes(`/${dir}/`) || file.endsWith(`/${dir}`)
}

const scoped = (file: string, dir: string) => {
  const edge = `/${dir}`
  if (file.endsWith(edge)) return file.slice(0, -edge.length)
  const idx = file.indexOf(`${edge}/`)
  if (idx >= 0) return file.slice(0, idx)
  return ""
}

const match = (file: string, dirs: string[]) => dirs.some((dir) => within(file, dir))

const skilldirs = (root: string) => {
  if (!root) return []
  return [`${root}/skill`, `${root}/skills`]
}

export function classifySkillOrigin(location: string, roots: Roots): SkillOrigin {
  const file = clean(location)
  if (!file) return "inherited-external"

  const home = clean(roots.home)
  const cfg = clean(roots.config)
  const dir = clean(roots.directory)
  const tree = clean(roots.worktree)

  if (absolute(location)) {
    const cache = [
      `${home}/.cache/ideaspace/skills`,
      `${home}/library/caches/ideaspace/skills`,
      "/var/cache/ideaspace/skills",
    ].filter(Boolean)
    if (match(file, cache)) return "inherited-url-cache"
  }

  if (nested(file, ".claude/skills") || nested(file, ".agents/skills")) return "inherited-external"

  if (!absolute(location)) {
    if (within(file, ".ideaspace/skill") || within(file, ".ideaspace/skills")) return "managed-global"
    return "inherited-external"
  }

  if (match(file, skilldirs(cfg))) return "managed-global"

  const root = scoped(file, ".ideaspace/skill") || scoped(file, ".ideaspace/skills")
  if (root && (home === root || within(dir, root) || within(tree, root))) return "managed-global"

  return "inherited-external"
}
