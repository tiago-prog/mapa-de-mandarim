ALTER TABLE `activity_completions` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `activity_completions` MODIFY COLUMN `selectedOptionId` varchar(2048) NOT NULL;--> statement-breakpoint
ALTER TABLE `activity_completions` ADD PRIMARY KEY(`userId`,`clientEventId`);--> statement-breakpoint
ALTER TABLE `lesson_activities` ADD `audioJson` text DEFAULT ('{}') NOT NULL;--> statement-breakpoint
ALTER TABLE `lexical_entries` ADD `audioJson` text DEFAULT ('{}') NOT NULL;