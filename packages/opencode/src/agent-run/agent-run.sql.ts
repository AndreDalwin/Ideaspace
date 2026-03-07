import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core"
import { SessionTable } from "../session/session.sql"
import { Timestamps } from "@/storage/schema.sql"

export const AgentRunTable = sqliteTable(
  "agent_run",
  {
    id: text().primaryKey(),
    task_id: text(),
    session_id: text().references(() => SessionTable.id),
    agent_kind: text().notNull(),
    status: text().notNull().default("queued"),
    summary: text(),
    tokens_in: integer(),
    tokens_out: integer(),
    cost: text(),
    started_at: integer(),
    ended_at: integer(),
    ...Timestamps,
  },
  (table) => [
    index("agent_run_task_idx").on(table.task_id),
    index("agent_run_session_idx").on(table.session_id),
  ],
)
