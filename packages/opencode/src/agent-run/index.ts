import z from "zod"
import { BusEvent } from "@/bus/bus-event"
import { Database, NotFoundError, eq } from "@/storage/db"
import { AgentRunTable } from "./agent-run.sql"
import { Instance } from "@/project/instance"
import { fn } from "@/util/fn"

export namespace AgentRun {
  export const Info = z
    .object({
      id: z.string(),
      taskID: z.string().optional(),
      sessionID: z.string().optional(),
      agentKind: z.string(),
      status: z.string(),
      summary: z.string().optional(),
      tokensIn: z.number().optional(),
      tokensOut: z.number().optional(),
      cost: z.string().optional(),
      startedAt: z.number().optional(),
      endedAt: z.number().optional(),
      time: z.object({
        created: z.number(),
        updated: z.number(),
      }),
    })
    .meta({ ref: "AgentRun" })
  export type Info = z.infer<typeof Info>

  export const Event = {
    Created: BusEvent.define("agent_run.created", z.object({ info: Info })),
    Updated: BusEvent.define("agent_run.updated", z.object({ info: Info })),
    Deleted: BusEvent.define("agent_run.deleted", z.object({ info: Info })),
  }

  function fromRow(row: typeof AgentRunTable.$inferSelect): Info {
    return {
      id: row.id,
      taskID: row.task_id ?? undefined,
      sessionID: row.session_id ?? undefined,
      agentKind: row.agent_kind,
      status: row.status,
      summary: row.summary ?? undefined,
      tokensIn: row.tokens_in ?? undefined,
      tokensOut: row.tokens_out ?? undefined,
      cost: row.cost ?? undefined,
      startedAt: row.started_at ?? undefined,
      endedAt: row.ended_at ?? undefined,
      time: {
        created: row.time_created,
        updated: row.time_updated,
      },
    }
  }

  export const list = fn(
    z.object({
      sessionID: z.string().optional(),
      taskID: z.string().optional(),
    }).optional(),
    (input) => {
      const rows = Database.use((db) => {
        let query = db.select().from(AgentRunTable).$dynamic()
        if (input?.sessionID) query = query.where(eq(AgentRunTable.session_id, input.sessionID))
        else if (input?.taskID) query = query.where(eq(AgentRunTable.task_id, input.taskID))
        return query.orderBy(AgentRunTable.time_created).all()
      })
      return rows.map(fromRow)
    },
  )

  export const get = fn(z.string(), (id) => {
    const row = Database.use((db) => db.select().from(AgentRunTable).where(eq(AgentRunTable.id, id)).get())
    if (!row) throw new NotFoundError({ message: `Agent run not found: ${id}` })
    return fromRow(row)
  })
}
