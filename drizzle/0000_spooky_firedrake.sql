CREATE TABLE `decision_runs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`question` text NOT NULL,
	`recommendation` text NOT NULL,
	`confidence` real NOT NULL,
	`scenario_json` text NOT NULL,
	`fingerprint` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `decision_runs_fingerprint_unique` ON `decision_runs` (`fingerprint`);