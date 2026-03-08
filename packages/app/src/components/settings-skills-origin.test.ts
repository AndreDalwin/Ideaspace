import { describe, expect, test } from "bun:test"
import { classifySkillOrigin } from "./settings-skills-origin"

const roots = {
  home: "/Users/test",
  config: "/Users/test/.config/ideaspace",
  directory: "/Users/test/project/app",
  worktree: "/Users/test/project",
}

describe("classifySkillOrigin", () => {
  test("keeps project-local skills directories external", () => {
    expect(classifySkillOrigin("/Users/test/project/skills/custom/SKILL.md", roots)).toBe("inherited-external")
  })

  test("marks config-managed skills as managed", () => {
    expect(classifySkillOrigin("/Users/test/.config/ideaspace/skills/custom/SKILL.md", roots)).toBe("managed-global")
    expect(classifySkillOrigin("/Users/test/project/.ideaspace/skill/custom/SKILL.md", roots)).toBe("managed-global")
    expect(classifySkillOrigin("/Users/test/project/app/.ideaspace/skills/custom/SKILL.md", roots)).toBe(
      "managed-global",
    )
  })

  test("marks relative .ideaspace skill paths as managed", () => {
    expect(classifySkillOrigin(".ideaspace/skills/custom/SKILL.md", roots)).toBe("managed-global")
  })

  test("keeps inherited claude and agents skills external", () => {
    expect(classifySkillOrigin("/Users/test/.claude/skills/custom/SKILL.md", roots)).toBe("inherited-external")
    expect(classifySkillOrigin("/Users/test/project/.agents/skills/custom/SKILL.md", roots)).toBe("inherited-external")
  })

  test("marks downloaded cache skills as cache", () => {
    expect(classifySkillOrigin("/Users/test/Library/Caches/ideaspace/skills/custom/SKILL.md", roots)).toBe(
      "inherited-url-cache",
    )
  })
})
