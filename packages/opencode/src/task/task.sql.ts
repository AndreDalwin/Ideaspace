import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core"
import { ProjectTable } from "../project/project.sql"
import { Timestamps } from "@/storage/schema.sql"

export const TaskTable = sqliteTable(
  "task",
  {
    id: text().primaryKey(),
    project_id: text()
      .notNull()
      .references(() => ProjectTable.id, { onDelete: "cascade" }),
    board_id: text(),
    title: text().notNull(),
    body: text(),
    status: text().notNull().default("backlog"),
    priority: text().notNull().default("medium"),
    assignee_kind: text(),
    assignee_id: text(),
    due_at: integer(),
    position: integer().notNull(),
    ...Timestamps,
  },
  (table) => [
    index("task_project_idx").on(table.project_id),
    index("task_status_idx").on(table.status),
  ],
)
