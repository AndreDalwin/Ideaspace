CREATE TABLE `notebook` (
	`id` text PRIMARY KEY,
	`project_id` text NOT NULL,
	`name` text NOT NULL,
	`icon` text,
	`position` integer NOT NULL,
	`time_created` integer NOT NULL,
	`time_updated` integer NOT NULL,
	CONSTRAINT `fk_notebook_project_id_project_id_fk` FOREIGN KEY (`project_id`) REFERENCES `project`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `page` (
	`id` text PRIMARY KEY,
	`notebook_id` text NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL DEFAULT '',
	`position` integer NOT NULL,
	`time_created` integer NOT NULL,
	`time_updated` integer NOT NULL,
	CONSTRAINT `fk_page_notebook_id_notebook_id_fk` FOREIGN KEY (`notebook_id`) REFERENCES `notebook`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `context_item` (
	`id` text PRIMARY KEY,
	`project_id` text NOT NULL,
	`kind` text NOT NULL,
	`ref_id` text,
	`title` text NOT NULL,
	`body` text,
	`security` text NOT NULL DEFAULT 'public',
	`pinned` integer NOT NULL DEFAULT 0,
	`tokens` integer,
	`time_created` integer NOT NULL,
	`time_updated` integer NOT NULL,
	CONSTRAINT `fk_context_item_project_id_project_id_fk` FOREIGN KEY (`project_id`) REFERENCES `project`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `session_context` (
	`session_id` text NOT NULL,
	`context_id` text NOT NULL,
	`enabled` integer NOT NULL DEFAULT 1,
	`position` integer NOT NULL,
	`time_created` integer NOT NULL,
	`time_updated` integer NOT NULL,
	PRIMARY KEY (`session_id`, `context_id`),
	CONSTRAINT `fk_session_context_session_id_session_id_fk` FOREIGN KEY (`session_id`) REFERENCES `session`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_session_context_context_id_context_item_id_fk` FOREIGN KEY (`context_id`) REFERENCES `context_item`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `task` (
	`id` text PRIMARY KEY,
	`project_id` text NOT NULL,
	`board_id` text,
	`title` text NOT NULL,
	`body` text,
	`status` text NOT NULL DEFAULT 'backlog',
	`priority` text NOT NULL DEFAULT 'medium',
	`assignee_kind` text,
	`assignee_id` text,
	`due_at` integer,
	`position` integer NOT NULL,
	`time_created` integer NOT NULL,
	`time_updated` integer NOT NULL,
	CONSTRAINT `fk_task_project_id_project_id_fk` FOREIGN KEY (`project_id`) REFERENCES `project`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `task_context` (
	`task_id` text NOT NULL,
	`context_id` text NOT NULL,
	`time_created` integer NOT NULL,
	`time_updated` integer NOT NULL,
	PRIMARY KEY (`task_id`, `context_id`),
	CONSTRAINT `fk_task_context_context_id_context_item_id_fk` FOREIGN KEY (`context_id`) REFERENCES `context_item`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `agent_run` (
	`id` text PRIMARY KEY,
	`task_id` text,
	`session_id` text,
	`agent_kind` text NOT NULL,
	`status` text NOT NULL DEFAULT 'queued',
	`summary` text,
	`tokens_in` integer,
	`tokens_out` integer,
	`cost` text,
	`started_at` integer,
	`ended_at` integer,
	`time_created` integer NOT NULL,
	`time_updated` integer NOT NULL,
	CONSTRAINT `fk_agent_run_session_id_session_id_fk` FOREIGN KEY (`session_id`) REFERENCES `session`(`id`)
);
--> statement-breakpoint
CREATE INDEX `notebook_project_idx` ON `notebook` (`project_id`);
--> statement-breakpoint
CREATE INDEX `page_notebook_idx` ON `page` (`notebook_id`);
--> statement-breakpoint
CREATE INDEX `context_item_project_idx` ON `context_item` (`project_id`);
--> statement-breakpoint
CREATE INDEX `context_item_ref_idx` ON `context_item` (`ref_id`);
--> statement-breakpoint
CREATE INDEX `session_context_session_idx` ON `session_context` (`session_id`);
--> statement-breakpoint
CREATE INDEX `session_context_context_idx` ON `session_context` (`context_id`);
--> statement-breakpoint
CREATE INDEX `task_project_idx` ON `task` (`project_id`);
--> statement-breakpoint
CREATE INDEX `task_status_idx` ON `task` (`status`);
--> statement-breakpoint
CREATE INDEX `task_context_task_idx` ON `task_context` (`task_id`);
--> statement-breakpoint
CREATE INDEX `task_context_context_idx` ON `task_context` (`context_id`);
--> statement-breakpoint
CREATE INDEX `agent_run_task_idx` ON `agent_run` (`task_id`);
--> statement-breakpoint
CREATE INDEX `agent_run_session_idx` ON `agent_run` (`session_id`);
