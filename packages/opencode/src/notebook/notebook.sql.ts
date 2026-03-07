import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core"
import { ProjectTable } from "../project/project.sql"
import { Timestamps } from "@/storage/schema.sql"

export const NotebookTable = sqliteTable(
  "notebook",
  {
    id: text().primaryKey(),
    project_id: text()
      .notNull()
      .references(() => ProjectTable.id, { onDelete: "cascade" }),
    name: text().notNull(),
    icon: text(),
    position: integer().notNull(),
    ...Timestamps,
  },
  (table) => [index("notebook_project_idx").on(table.project_id)],
)

export const PageTable = sqliteTable(
  "page",
  {
    id: text().primaryKey(),
    notebook_id: text()
      .notNull()
      .references(() => NotebookTable.id, { onDelete: "cascade" }),
    title: text().notNull(),
    body: text().notNull().default(""),
    position: integer().notNull(),
    ...Timestamps,
  },
  (table) => [index("page_notebook_idx").on(table.notebook_id)],
)
