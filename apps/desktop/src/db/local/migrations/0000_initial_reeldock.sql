CREATE TABLE `export_jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`ratio` text NOT NULL,
	`file_path` text NOT NULL,
	`status` text NOT NULL,
	`progress` integer DEFAULT 0 NOT NULL,
	`error` text,
	`created_at` text NOT NULL,
	`completed_at` text,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `export_jobs_project_id_idx` ON `export_jobs` (`project_id`);--> statement-breakpoint
CREATE TABLE `preferences` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`path` text NOT NULL,
	`thumbnail` text,
	`duration_seconds` integer DEFAULT 0 NOT NULL,
	`canvas_ratio` text NOT NULL,
	`layout_id` text NOT NULL,
	`status` text NOT NULL,
	`doc_json` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`last_opened_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `projects_last_opened_at_idx` ON `projects` (`last_opened_at`);--> statement-breakpoint
CREATE TABLE `source_tracks` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`kind` text NOT NULL,
	`label` text NOT NULL,
	`file_path` text,
	`state` text NOT NULL,
	`enabled` integer DEFAULT true NOT NULL,
	`start_offset_ms` integer DEFAULT 0 NOT NULL,
	`duration_ms` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `source_tracks_project_id_idx` ON `source_tracks` (`project_id`);