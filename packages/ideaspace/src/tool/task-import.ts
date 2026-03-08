import z from "zod"
import path from "path"
import { Tool } from "./tool"
import * as TaskBoard from "../task-board"
import { Instance } from "../project/instance"
import DESCRIPTION from "./task-import.txt"

type Metadata = {
  imported: number
  skipped: number
  error?: boolean
  planPath: string
  fullPath: string
}

export const ImportTasksTool = Tool.define("import_tasks", async () => {
  return {
    description: DESCRIPTION,
    parameters: z.object({
      planPath: z
        .string()
        .describe("Relative path to the plan markdown file (e.g., '.ideaspace/plans/2024-01-15-feature-auth.md')"),
    }),
    async execute(
      params,
      _ctx,
    ): Promise<{
      title: string
      output: string
      metadata: Metadata
    }> {
      const fullPath = path.join(Instance.worktree, params.planPath)

      try {
        const result = await TaskBoard.importFromPlan(params.planPath)

        return {
          title: `Imported ${result.imported} tasks`,
          output: `Successfully imported ${result.imported} tasks from ${params.planPath}.${
            result.skipped > 0 ? ` ${result.skipped} duplicate tasks were skipped.` : ""
          }\n\nThe tasks are now available in the Tasks tab and can be moved through the Kanban board.`,
          metadata: {
            imported: result.imported,
            skipped: result.skipped,
            planPath: params.planPath,
            fullPath,
          },
        }
      } catch (error) {
        return {
          title: "Failed to import tasks",
          output: `Error importing tasks from ${params.planPath}: ${error instanceof Error ? error.message : String(error)}`,
          metadata: {
            imported: 0,
            skipped: 0,
            error: true,
            planPath: params.planPath,
            fullPath,
          },
        }
      }
    },
  }
})
