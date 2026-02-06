PRAGMA foreign_keys=OFF;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `todos` (
  `id` text PRIMARY KEY NOT NULL,
  `title` text NOT NULL,
  `description` text,
  `due_date` text,
  `completed` integer NOT NULL DEFAULT 0,
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `todos_created_at_idx` ON `todos` (`created_at`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `todos_completed_idx` ON `todos` (`completed`);
--> statement-breakpoint
PRAGMA foreign_keys=ON;
