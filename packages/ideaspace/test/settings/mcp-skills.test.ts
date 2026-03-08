import { describe, expect, test } from "bun:test"
import path from "path"
import { Instance } from "../../src/project/instance"
import { Agent } from "../../src/agent/agent"
import { SkillTool } from "../../src/tool/skill"
import { tmpdir } from "../fixture/fixture"

describe("mcp and skills runtime filtering", () => {
  describe("inheritance model", () => {
    test("primary agents have undefined allowlists by default (inherit all)", async () => {
      await using tmp = await tmpdir({
        git: true,
        config: {
          agent: {
            customPrimary: {
              mode: "primary",
              description: "A custom primary agent",
            },
          },
        },
      })

      await Instance.provide({
        directory: tmp.path,
        fn: async () => {
          const agent = await Agent.get("customPrimary")
          expect(agent).toBeDefined()
          expect(agent!.mode).toBe("primary")
          // Primary agents have undefined mcps/skills by default
          // This means they inherit all MCPs and skills
          expect(agent!.mcps).toBeUndefined()
          expect(agent!.skills).toBeUndefined()
        },
      })
    })

    test("subagents have empty allowlists by default (inherit none)", async () => {
      await using tmp = await tmpdir({
        git: true,
        config: {
          agent: {
            customSubagent: {
              mode: "subagent",
              description: "A custom subagent",
            },
          },
        },
      })

      await Instance.provide({
        directory: tmp.path,
        fn: async () => {
          const agent = await Agent.get("customSubagent")
          expect(agent).toBeDefined()
          expect(agent!.mode).toBe("subagent")
          // Subagents have undefined mcps/skills in config
          // but at runtime they should be treated as empty arrays
          expect(agent!.mcps).toBeUndefined()
          expect(agent!.skills).toBeUndefined()
        },
      })
    })

    test("native primary agents (build, plan) inherit all MCPs and skills", async () => {
      await using tmp = await tmpdir({ git: true })

      await Instance.provide({
        directory: tmp.path,
        fn: async () => {
          const build = await Agent.get("build")
          const plan = await Agent.get("plan")

          expect(build!.mode).toBe("primary")
          expect(build!.mcps).toBeUndefined()
          expect(build!.skills).toBeUndefined()

          expect(plan!.mode).toBe("primary")
          expect(plan!.mcps).toBeUndefined()
          expect(plan!.skills).toBeUndefined()
        },
      })
    })

    test("native subagents (general, explore) inherit no MCPs or skills by default", async () => {
      await using tmp = await tmpdir({ git: true })

      await Instance.provide({
        directory: tmp.path,
        fn: async () => {
          const general = await Agent.get("general")
          const explore = await Agent.get("explore")

          expect(general!.mode).toBe("subagent")
          expect(general!.mcps).toBeUndefined()
          expect(general!.skills).toBeUndefined()

          expect(explore!.mode).toBe("subagent")
          expect(explore!.mcps).toBeUndefined()
          expect(explore!.skills).toBeUndefined()
        },
      })
    })
  })

  describe("explicit allowlist overrides", () => {
    test("primary agent with explicit mcps allowlist only has access to listed MCPs", async () => {
      await using tmp = await tmpdir({
        git: true,
        config: {
          agent: {
            restrictedPrimary: {
              mode: "primary",
              description: "A restricted primary agent",
              mcps: ["allowed-mcp"],
            },
          },
        },
      })

      await Instance.provide({
        directory: tmp.path,
        fn: async () => {
          const agent = await Agent.get("restrictedPrimary")
          expect(agent).toBeDefined()
          expect(agent!.mode).toBe("primary")
          expect(agent!.mcps).toEqual(["allowed-mcp"])
        },
      })
    })

    test("primary agent with explicit skills allowlist only has access to listed skills", async () => {
      await using tmp = await tmpdir({
        git: true,
        config: {
          agent: {
            restrictedPrimary: {
              mode: "primary",
              description: "A restricted primary agent",
              skills: ["allowed-skill"],
            },
          },
        },
      })

      await Instance.provide({
        directory: tmp.path,
        fn: async () => {
          const agent = await Agent.get("restrictedPrimary")
          expect(agent).toBeDefined()
          expect(agent!.mode).toBe("primary")
          expect(agent!.skills).toEqual(["allowed-skill"])
        },
      })
    })

    test("subagent with explicit mcps allowlist has access to listed MCPs", async () => {
      await using tmp = await tmpdir({
        git: true,
        config: {
          agent: {
            enabledSubagent: {
              mode: "subagent",
              description: "A subagent with MCP access",
              mcps: ["specific-mcp"],
            },
          },
        },
      })

      await Instance.provide({
        directory: tmp.path,
        fn: async () => {
          const agent = await Agent.get("enabledSubagent")
          expect(agent).toBeDefined()
          expect(agent!.mode).toBe("subagent")
          expect(agent!.mcps).toEqual(["specific-mcp"])
        },
      })
    })

    test("subagent with explicit skills allowlist has access to listed skills", async () => {
      await using tmp = await tmpdir({
        git: true,
        config: {
          agent: {
            enabledSubagent: {
              mode: "subagent",
              description: "A subagent with skill access",
              skills: ["specific-skill"],
            },
          },
        },
      })

      await Instance.provide({
        directory: tmp.path,
        fn: async () => {
          const agent = await Agent.get("enabledSubagent")
          expect(agent).toBeDefined()
          expect(agent!.mode).toBe("subagent")
          expect(agent!.skills).toEqual(["specific-skill"])
        },
      })
    })

    test("empty mcps allowlist on primary agent blocks all MCPs", async () => {
      await using tmp = await tmpdir({
        git: true,
        config: {
          agent: {
            blockedPrimary: {
              mode: "primary",
              description: "A primary agent with no MCP access",
              mcps: [],
            },
          },
        },
      })

      await Instance.provide({
        directory: tmp.path,
        fn: async () => {
          const agent = await Agent.get("blockedPrimary")
          expect(agent).toBeDefined()
          expect(agent!.mcps).toEqual([])
        },
      })
    })

    test("empty skills allowlist on primary agent blocks all skills", async () => {
      await using tmp = await tmpdir({
        git: true,
        config: {
          agent: {
            blockedPrimary: {
              mode: "primary",
              description: "A primary agent with no skill access",
              skills: [],
            },
          },
        },
      })

      await Instance.provide({
        directory: tmp.path,
        fn: async () => {
          const agent = await Agent.get("blockedPrimary")
          expect(agent).toBeDefined()
          expect(agent!.skills).toEqual([])
        },
      })
    })

    test("agent with mode 'all' can have explicit mcps allowlist", async () => {
      await using tmp = await tmpdir({
        git: true,
        config: {
          agent: {
            hybridAgent: {
              mode: "all",
              description: "An agent that works in all modes",
              mcps: ["mcp-one", "mcp-two"],
            },
          },
        },
      })

      await Instance.provide({
        directory: tmp.path,
        fn: async () => {
          const agent = await Agent.get("hybridAgent")
          expect(agent).toBeDefined()
          expect(agent!.mode).toBe("all")
          expect(agent!.mcps).toEqual(["mcp-one", "mcp-two"])
        },
      })
    })
  })

  describe("skills runtime filtering", () => {
    test("skill tool shows all skills when agent has no skills allowlist", async () => {
      await using tmp = await tmpdir({
        git: true,
        init: async (dir) => {
          // Create multiple skills
          await Bun.write(
            path.join(dir, ".ideaspace", "skill", "skill-one", "SKILL.md"),
            `---
name: skill-one
description: First test skill.
---
# Skill One
`,
          )
          await Bun.write(
            path.join(dir, ".ideaspace", "skill", "skill-two", "SKILL.md"),
            `---
name: skill-two
description: Second test skill.
---
# Skill Two
`,
          )
        },
      })

      await Instance.provide({
        directory: tmp.path,
        fn: async () => {
          // Create agent info for a primary agent (no skills allowlist)
          const agentInfo = {
            name: "build",
            mode: "primary" as const,
            options: {},
            permission: [],
          }

          const tool = await SkillTool.init({ agent: agentInfo })
          expect(tool.description).toContain("skill-one")
          expect(tool.description).toContain("skill-two")
        },
      })
    })

    test("skill tool filters skills based on agent skills allowlist", async () => {
      await using tmp = await tmpdir({
        git: true,
        init: async (dir) => {
          await Bun.write(
            path.join(dir, ".ideaspace", "skill", "allowed-skill", "SKILL.md"),
            `---
name: allowed-skill
description: Allowed skill.
---
# Allowed Skill
`,
          )
          await Bun.write(
            path.join(dir, ".ideaspace", "skill", "blocked-skill", "SKILL.md"),
            `---
name: blocked-skill
description: Blocked skill.
---
# Blocked Skill
`,
          )
        },
      })

      await Instance.provide({
        directory: tmp.path,
        fn: async () => {
          // Create agent info with explicit skills allowlist
          const agentInfo = {
            name: "restricted",
            mode: "primary" as const,
            options: {},
            skills: ["allowed-skill"],
            permission: [],
          }

          const tool = await SkillTool.init({ agent: agentInfo })
          expect(tool.description).toContain("allowed-skill")
          expect(tool.description).not.toContain("blocked-skill")
        },
      })
    })

    test("skill tool shows no skills for subagent without skills allowlist", async () => {
      await using tmp = await tmpdir({
        git: true,
        init: async (dir) => {
          await Bun.write(
            path.join(dir, ".ideaspace", "skill", "some-skill", "SKILL.md"),
            `---
name: some-skill
description: Some skill.
---
# Some Skill
`,
          )
        },
      })

      await Instance.provide({
        directory: tmp.path,
        fn: async () => {
          // Create agent info for a subagent without skills allowlist
          const agentInfo = {
            name: "general",
            mode: "subagent" as const,
            options: {},
            permission: [],
          }

          const tool = await SkillTool.init({ agent: agentInfo })
          // Should show "No skills are currently available"
          expect(tool.description).toContain("No skills are currently available")
          expect(tool.description).not.toContain("some-skill")
        },
      })
    })

    test("skill tool shows allowed skills for subagent with explicit skills allowlist", async () => {
      await using tmp = await tmpdir({
        git: true,
        init: async (dir) => {
          await Bun.write(
            path.join(dir, ".ideaspace", "skill", "allowed-skill", "SKILL.md"),
            `---
name: allowed-skill
description: Allowed skill for subagent.
---
# Allowed Skill
`,
          )
          await Bun.write(
            path.join(dir, ".ideaspace", "skill", "other-skill", "SKILL.md"),
            `---
name: other-skill
description: Other skill.
---
# Other Skill
`,
          )
        },
      })

      await Instance.provide({
        directory: tmp.path,
        fn: async () => {
          // Create agent info for a subagent with explicit skills allowlist
          const agentInfo = {
            name: "customSubagent",
            mode: "subagent" as const,
            options: {},
            skills: ["allowed-skill"],
            permission: [],
          }

          const tool = await SkillTool.init({ agent: agentInfo })
          expect(tool.description).toContain("allowed-skill")
          expect(tool.description).not.toContain("other-skill")
        },
      })
    })

    test("skill tool with empty skills allowlist shows no skills", async () => {
      await using tmp = await tmpdir({
        git: true,
        init: async (dir) => {
          await Bun.write(
            path.join(dir, ".ideaspace", "skill", "existing-skill", "SKILL.md"),
            `---
name: existing-skill
description: An existing skill.
---
# Existing Skill
`,
          )
        },
      })

      await Instance.provide({
        directory: tmp.path,
        fn: async () => {
          // Create agent info with empty skills allowlist
          const agentInfo = {
            name: "blocked",
            mode: "primary" as const,
            options: {},
            skills: [],
            permission: [],
          }

          const tool = await SkillTool.init({ agent: agentInfo })
          expect(tool.description).toContain("No skills are currently available")
          expect(tool.description).not.toContain("existing-skill")
        },
      })
    })
  })

  describe("MCP runtime filtering logic", () => {
    // Note: We test the MCP filtering logic directly by examining the code behavior
    // The actual MCP filtering happens in src/session/prompt.ts resolveTools()

    test("mcpAllowlist is undefined for primary agents without explicit mcps config", async () => {
      await using tmp = await tmpdir({ git: true })

      await Instance.provide({
        directory: tmp.path,
        fn: async () => {
          const agent = await Agent.get("build")

          // Simulate the logic from resolveTools
          const mcpAllowlist = (() => {
            if (agent!.mcps !== undefined) return agent!.mcps
            if (agent!.mode === "subagent") return []
            return undefined
          })()

          expect(agent!.mode).toBe("primary")
          expect(mcpAllowlist).toBeUndefined()
        },
      })
    })

    test("mcpAllowlist is empty array for subagents without explicit mcps config", async () => {
      await using tmp = await tmpdir({ git: true })

      await Instance.provide({
        directory: tmp.path,
        fn: async () => {
          const agent = await Agent.get("general")

          // Simulate the logic from resolveTools
          const mcpAllowlist = (() => {
            if (agent!.mcps !== undefined) return agent!.mcps
            if (agent!.mode === "subagent") return []
            return undefined
          })()

          expect(agent!.mode).toBe("subagent")
          expect(mcpAllowlist).toEqual([])
        },
      })
    })

    test("mcpAllowlist uses agent's explicit mcps config when provided", async () => {
      await using tmp = await tmpdir({
        git: true,
        config: {
          agent: {
            customAgent: {
              mode: "primary",
              description: "Custom agent",
              mcps: ["mcp-a", "mcp-b"],
            },
          },
        },
      })

      await Instance.provide({
        directory: tmp.path,
        fn: async () => {
          const agent = await Agent.get("customAgent")

          // Simulate the logic from resolveTools
          const mcpAllowlist = (() => {
            if (agent!.mcps !== undefined) return agent!.mcps
            if (agent!.mode === "subagent") return []
            return undefined
          })()

          expect(mcpAllowlist).toEqual(["mcp-a", "mcp-b"])
        },
      })
    })

    test("mcpAllowlist filters MCP tools by stored client metadata", async () => {
      const mcpTools = {
        allowedClient_tool1: { client: "allowedClient" },
        allowedClient_tool2: { client: "allowedClient" },
        blockedClient_tool1: { client: "blockedClient" },
      }

      const mcpAllowlist = ["allowedClient"]

      const filteredTools: Record<string, { client: string }> = {}
      for (const [key, item] of Object.entries(mcpTools)) {
        if (mcpAllowlist !== undefined) {
          if (!mcpAllowlist.includes(item.client)) continue
        }
        filteredTools[key] = item
      }

      expect(Object.keys(filteredTools)).toContain("allowedClient_tool1")
      expect(Object.keys(filteredTools)).toContain("allowedClient_tool2")
      expect(Object.keys(filteredTools)).not.toContain("blockedClient_tool1")
    })

    test("mcpAllowlist supports client names that contain underscores", async () => {
      const mcpTools = {
        github_mcp_list_issues: { client: "github_mcp" },
        github_mcp_create_issue: { client: "github_mcp" },
        docs_search: { client: "docs" },
      }

      const mcpAllowlist = ["github_mcp"]

      const filteredTools: Record<string, { client: string }> = {}
      for (const [key, item] of Object.entries(mcpTools)) {
        if (mcpAllowlist !== undefined) {
          if (!mcpAllowlist.includes(item.client)) continue
        }
        filteredTools[key] = item
      }

      expect(Object.keys(filteredTools)).toContain("github_mcp_list_issues")
      expect(Object.keys(filteredTools)).toContain("github_mcp_create_issue")
      expect(Object.keys(filteredTools)).not.toContain("docs_search")
    })
  })

  describe("integration: agent config with both mcps and skills", () => {
    test("agent can have both mcps and skills allowlists configured", async () => {
      await using tmp = await tmpdir({
        git: true,
        config: {
          agent: {
            fullyRestricted: {
              mode: "primary",
              description: "An agent with both MCP and skill restrictions",
              mcps: ["specific-mcp"],
              skills: ["specific-skill"],
            },
          },
        },
      })

      await Instance.provide({
        directory: tmp.path,
        fn: async () => {
          const agent = await Agent.get("fullyRestricted")
          expect(agent).toBeDefined()
          expect(agent!.mcps).toEqual(["specific-mcp"])
          expect(agent!.skills).toEqual(["specific-skill"])
        },
      })
    })

    test("agent can have mcps allowlist without skills allowlist", async () => {
      await using tmp = await tmpdir({
        git: true,
        config: {
          agent: {
            mcpOnly: {
              mode: "primary",
              description: "An agent with only MCP restrictions",
              mcps: ["allowed-mcp"],
            },
          },
        },
      })

      await Instance.provide({
        directory: tmp.path,
        fn: async () => {
          const agent = await Agent.get("mcpOnly")
          expect(agent).toBeDefined()
          expect(agent!.mcps).toEqual(["allowed-mcp"])
          expect(agent!.skills).toBeUndefined()
        },
      })
    })

    test("agent can have skills allowlist without mcps allowlist", async () => {
      await using tmp = await tmpdir({
        git: true,
        config: {
          agent: {
            skillsOnly: {
              mode: "primary",
              description: "An agent with only skill restrictions",
              skills: ["allowed-skill"],
            },
          },
        },
      })

      await Instance.provide({
        directory: tmp.path,
        fn: async () => {
          const agent = await Agent.get("skillsOnly")
          expect(agent).toBeDefined()
          expect(agent!.mcps).toBeUndefined()
          expect(agent!.skills).toEqual(["allowed-skill"])
        },
      })
    })
  })

  describe("config schema validation", () => {
    test("mcps field accepts array of strings", async () => {
      await using tmp = await tmpdir({
        git: true,
        config: {
          agent: {
            testAgent: {
              mode: "primary",
              mcps: ["mcp-1", "mcp-2", "mcp-3"],
            },
          },
        },
      })

      await Instance.provide({
        directory: tmp.path,
        fn: async () => {
          const agent = await Agent.get("testAgent")
          expect(agent!.mcps).toEqual(["mcp-1", "mcp-2", "mcp-3"])
        },
      })
    })

    test("skills field accepts array of strings", async () => {
      await using tmp = await tmpdir({
        git: true,
        config: {
          agent: {
            testAgent: {
              mode: "primary",
              skills: ["skill-a", "skill-b"],
            },
          },
        },
      })

      await Instance.provide({
        directory: tmp.path,
        fn: async () => {
          const agent = await Agent.get("testAgent")
          expect(agent!.skills).toEqual(["skill-a", "skill-b"])
        },
      })
    })
  })
})
