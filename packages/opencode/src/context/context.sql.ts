import { sqliteTable, text, integer, index, primaryKey } from "drizzle-orm/sqlite-core"
import { ProjectTable } from "../project/project.sql"
import { SessionTable } from "../session/session.sql"
import { Timestamps } from "@/storage/schema.sql"

export const ContextItemTable = sqliteTable(
  "context_item",
  {
    id: text().primaryKey(),
    project_id: text()
      .notNull()
      .references(() => ProjectTable.id, { onDelete: "cascade" }),
    kind: text().notNull(),
    ref_id: text(),
    title: text().notNull(),
    body: text(),
    security: text().notNull().default("public"),
    pinned: integer().notNull().default(0),
    tokens: integer(),
    ...Timestamps,
  },
  (table) => [
    index("context_item_project_idx").on(table.project_id),
    index("context_item_ref_idx").on(table.ref_id),
  ],
)

export const SessionContextTable = sqliteTable(
  "session_context",
  {
    session_id: text()
      .notNull()
      .references(() => SessionTable.id, { onDelete: "cascade" }),
    context_id: text()
      .notNull()
      .references(() => ContextItemTable.id, { onDelete: "cascade" }),
    enabled: integer().notNull().default(1),
    position: integer().notNull(),
    ...Timestamps,
  },
  (table) => [
    primaryKey({ columns: [table.session_id, table.context_id] }),
    index("session_context_session_idx").on(table.session_id),
    index("session_context_context_idx").on(table.context_id),
  ],
)

export const TaskContextTable = sqliteTable(
  "task_context",
  {
    task_id: text().notNull(),
    context_id: text()
      .notNull()
      .references(() => ContextItemTable.id, { onDelete: "cascade" }),
    ...Timestamps,
  },
  (table) => [
    primaryKey({ columns: [table.task_id, table.context_id] }),
    index("task_context_task_idx").on(table.task_id),
    index("task_context_context_idx").on(table.context_id),
  ],
)
