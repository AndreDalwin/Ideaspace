import { afterEach, describe, expect, test } from "bun:test"
import fs from "fs/promises"
import path from "path"
import { Global } from "../../src/global"
import { Settings } from "../../src/settings"
import { Filesystem } from "../../src/util/filesystem"

const file = path.join(Global.Path.config, "ideaspace.jsonc")

afterEach(async () => {
  await fs.rm(file, { force: true }).catch(() => undefined)
})

describe("settings", () => {
  test("updates MCP entries without stripping JSONC comments or order", async () => {
    await Filesystem.write(
      file,
      `{
  // keep header
  "username": "test",
  "mcp": {
    // keep foo
    "foo": {
      "type": "local",
      "command": ["bun", "foo"]
    },
    // keep bar
    "bar": {
      "type": "local",
      "command": ["bun", "bar-old"]
    }
  }
}`,
    )

    await Settings.setMcp("bar", {
      type: "local",
      command: ["bun", "bar-new"],
    })

    const text = await Filesystem.readText(file)

    expect(text).toContain("// keep header")
    expect(text).toContain("// keep foo")
    expect(text).toContain("// keep bar")
    expect(text.indexOf('"foo"')).toBeLessThan(text.indexOf('"bar"'))
    expect(text).toContain('"bar-new"')
  })

  test("deletes MCP entries from JSONC files without merge-only leftovers", async () => {
    await Filesystem.write(
      file,
      `{
  // keep header
  "mcp": {
    // remove foo only
    "foo": {
      "type": "local",
      "command": ["bun", "foo"]
    },
    // keep bar
    "bar": {
      "type": "remote",
      "url": "https://example.com/mcp"
    }
  }
}`,
    )

    const next = await Settings.removeMcp("foo")
    const text = await Filesystem.readText(file)

    expect(text).toContain("// keep header")
    expect(text).toContain("// keep bar")
    expect(text).not.toContain('"foo"')
    expect(text).toContain('"bar"')
    expect(next.foo).toBeUndefined()
    expect(next.bar).toEqual({
      type: "remote",
      url: "https://example.com/mcp",
    })
  })
})
