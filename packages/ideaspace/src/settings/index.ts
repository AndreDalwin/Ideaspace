import fs from "fs/promises"
import path from "path"
import { applyEdits, findNodeAtLocation, modify, parse as parseJsonc, parseTree } from "jsonc-parser"
import z from "zod"
import { GlobalBus } from "@/bus/global"
import { Config } from "@/config/config"
import { ConfigMarkdown } from "@/config/markdown"
import { Global } from "@/global"
import { Instance } from "@/project/instance"
import { Event } from "@/server/event"
import { Skill } from "@/skill/skill"
import { Filesystem } from "@/util/filesystem"

export namespace Settings {
  export const Mcp = z.union([
    Config.Mcp,
    z
      .object({
        enabled: z.boolean(),
      })
      .strict(),
  ])

  export const McpList = z.record(z.string(), Mcp).meta({
    ref: "SettingsMcpList",
  })

  export const SkillImport = z
    .object({
      source: z.string(),
      replace: z.boolean().optional().default(false),
    })
    .meta({
      ref: "SettingsSkillImport",
    })

  export const SkillRemove = z
    .object({
      location: z.string(),
    })
    .meta({
      ref: "SettingsSkillRemove",
    })

  export const resolveConfigPath = async (dir: string, global = false) => {
    const list = [path.join(dir, "ideaspace.jsonc"), path.join(dir, "ideaspace.json")]

    if (!global) {
      list.push(path.join(dir, ".ideaspace", "ideaspace.jsonc"), path.join(dir, ".ideaspace", "ideaspace.json"))
    }

    for (const item of list) {
      if (await Filesystem.exists(item)) return item
    }

    return list[0]
  }

  const reset = async () => {
    Config.global.reset()
    await Instance.disposeAll().catch(() => undefined)
    GlobalBus.emit("event", {
      directory: "global",
      payload: {
        type: Event.Disposed.type,
        properties: {},
      },
    })
  }

  const file = () => resolveConfigPath(Global.Path.config, true)

  const read = async (file: string) => {
    return Filesystem.readText(file).catch((err: NodeJS.ErrnoException) => {
      if (err.code === "ENOENT") return "{}"
      throw err
    })
  }

  const patch = (input: string, key: string[], value: unknown) => {
    const edits = modify(input, key, value, {
      formattingOptions: {
        insertSpaces: true,
        tabSize: 2,
      },
    })
    if (!edits.length) return input
    return applyEdits(input, edits)
  }

  const drop = (input: string, key: string[]) => {
    const root = parseTree(input)
    const name = key.at(-1)
    const parent = root && findNodeAtLocation(root, key.slice(0, -1))
    if (!name || !parent || parent.type !== "object" || !parent.children?.length) {
      return patch(input, key, undefined)
    }

    const i = parent.children.findIndex((child) => child.children?.[0]?.value === name)
    if (i === -1) return input

    const node = parent.children[i]
    const start = node.offset
    const end = node.offset + node.length
    const next = parent.children[i + 1]
    if (next) {
      const gap = input.slice(end, next.offset)
      const comma = gap.indexOf(",")
      if (comma === -1) return input.slice(0, start) + input.slice(end)
      const line = gap.indexOf("\n", comma)
      const cut = line === -1 ? end + comma + 1 : end + line + 1
      return input.slice(0, start) + input.slice(cut)
    }

    const prev = parent.children[i - 1]
    if (!prev) return patch(input, key, undefined)

    const gap = input.slice(prev.offset + prev.length, start)
    const comma = gap.lastIndexOf(",")
    if (comma === -1) return input.slice(0, start) + input.slice(end)
    const cut = prev.offset + prev.length + comma
    return input.slice(0, cut) + input.slice(end)
  }

  const validate = (text: string) => {
    const errors: Parameters<typeof parseJsonc>[1] = []
    const data = parseJsonc(text, errors, { allowTrailingComma: true })
    if (errors.length) throw new Error("Invalid JSONC config")
    return Config.Info.parse(data)
  }

  const write = async (next: string, target: string) => {
    const data = validate(next)
    await Filesystem.write(target, next)
    await reset()
    return data
  }

  const managed = () => path.join(Global.Path.config, "skills")

  const slug = (input: string) => {
    return input
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+/, "")
      .replace(/-+$/, "")
  }

  const isManaged = (input: string) => {
    return Filesystem.contains(managed(), path.dirname(path.resolve(input)))
  }

  const source = async (input: string) => {
    const resolved = path.resolve(input)
    if (await Filesystem.isDir(resolved)) {
      const file = path.join(resolved, "SKILL.md")
      if (!(await Filesystem.exists(file))) {
        throw new Error(`Skill directory must contain SKILL.md at root: ${resolved}`)
      }
      return {
        dir: resolved,
        file,
      }
    }

    if (path.basename(resolved) !== "SKILL.md") {
      throw new Error(`Skill source must be a directory or SKILL.md: ${resolved}`)
    }

    if (!(await Filesystem.exists(resolved))) {
      throw new Error(`Skill file not found: ${resolved}`)
    }

    return {
      dir: path.dirname(resolved),
      file: resolved,
    }
  }

  const details = async (file: string) => {
    const md = await ConfigMarkdown.parse(file)
    const parsed = Skill.Info.pick({
      name: true,
      description: true,
    }).safeParse(md.data)
    if (parsed.success) return parsed.data
    throw new Skill.InvalidError({
      path: file,
      issues: parsed.error.issues,
      message: "Skill frontmatter must include name and description",
    })
  }

  export const listMcp = async () => {
    return (await Config.getGlobal()).mcp ?? {}
  }

  export const setMcp = async (name: string, cfg: Config.Mcp) => {
    const target = await file()
    const text = await read(target)
    const next = patch(text, ["mcp", name], cfg)
    const data = await write(next, target)
    return data.mcp ?? {}
  }

  export const removeMcp = async (name: string) => {
    const target = await file()
    const text = await read(target)
    const next = drop(text, ["mcp", name])
    const data = await write(next, target)
    return data.mcp ?? {}
  }

  export const importSkillDirectory = async (input: string, replace = false) => {
    const src = await source(input)
    const info = await details(src.file)
    const name = info.name
    const next = slug(name)
    if (!next) throw new Error(`Skill name must produce a valid slug: ${name}`)

    const root = managed()
    const target = path.join(root, next)
    const seen = await Skill.all()
    const dup = seen.find((item) => item.name === name && path.resolve(item.location) !== src.file)

    if (dup && !replace) {
      throw new Error(`Skill \"${name}\" already exists. Pass replace: true to replace it.`)
    }

    if ((await Filesystem.exists(target)) && !replace) {
      throw new Error(`Managed skill slug \"${next}\" already exists. Pass replace: true to replace it.`)
    }

    if (path.resolve(src.dir) === target) {
      throw new Error(`Skill \"${name}\" is already managed at ${target}`)
    }

    await fs.mkdir(root, { recursive: true })
    const tmp = await fs.mkdtemp(path.join(root, `${next}-`))
    const drop = new Set<string>()

    if (dup && isManaged(dup.location)) {
      drop.add(path.dirname(path.resolve(dup.location)))
    }

    if (await Filesystem.exists(target)) {
      drop.add(target)
    }

    try {
      await fs.cp(src.dir, tmp, {
        recursive: true,
        force: true,
        errorOnExist: false,
      })
      for (const dir of drop) {
        await fs.rm(dir, { recursive: true, force: true })
      }
      await fs.rename(tmp, target)
    } catch (err) {
      await fs.rm(tmp, { recursive: true, force: true }).catch(() => undefined)
      throw err
    }

    await reset()
    return Skill.all()
  }

  export const removeManagedSkill = async (input: string) => {
    const resolved = path.resolve(input)
    if (path.basename(resolved) !== "SKILL.md") {
      throw new Error(`Managed skill location must point to SKILL.md: ${resolved}`)
    }

    if (!isManaged(resolved)) {
      throw new Error(`Skill is not managed by Ideaspace: ${resolved}`)
    }

    await fs.rm(path.dirname(resolved), {
      recursive: true,
      force: true,
    })
    await reset()
    return Skill.all()
  }
}
