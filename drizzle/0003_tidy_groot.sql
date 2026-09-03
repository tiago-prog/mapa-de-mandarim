CREATE TABLE `learning_node_steps` (
	`id` varchar(80) NOT NULL,
	`nodeId` varchar(64) NOT NULL,
	`orderIndex` int NOT NULL,
	`kind` enum('objective','context','vocabulary','grammar','practice','application','review') NOT NULL,
	`title` varchar(180) NOT NULL,
	`description` text NOT NULL,
	`contentJson` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `learning_node_steps_id` PRIMARY KEY(`id`),
	CONSTRAINT `learning_node_steps_node_order_idx` UNIQUE(`nodeId`,`orderIndex`)
);
--> statement-breakpoint
ALTER TABLE `lesson_activities` MODIFY COLUMN `type` enum('multiple_choice','word_order','context_choice','fill_blank') NOT NULL;--> statement-breakpoint
ALTER TABLE `lesson_activities` MODIFY COLUMN `correctOptionId` varchar(64);--> statement-breakpoint
ALTER TABLE `lesson_activities` ADD `stepId` varchar(80) NOT NULL;--> statement-breakpoint
ALTER TABLE `lesson_activities` ADD `title` varchar(180) NOT NULL;--> statement-breakpoint
ALTER TABLE `lesson_activities` ADD `instruction` text NOT NULL;--> statement-breakpoint
ALTER TABLE `lesson_activities` ADD `explanation` text NOT NULL;--> statement-breakpoint
ALTER TABLE `lesson_activities` ADD `hint` text NOT NULL;--> statement-breakpoint
ALTER TABLE `lesson_activities` ADD `tokensJson` text NOT NULL;--> statement-breakpoint
ALTER TABLE `lesson_activities` ADD `correctOrderJson` text NOT NULL;--> statement-breakpoint
ALTER TABLE `lesson_activities` ADD `expectedAnswer` varchar(255);--> statement-breakpoint
ALTER TABLE `lesson_activities` ADD `feedbackCorrect` text NOT NULL;--> statement-breakpoint
ALTER TABLE `lesson_activities` ADD `feedbackIncorrect` text NOT NULL;--> statement-breakpoint
ALTER TABLE `user_node_progress` ADD `completedActivityIdsJson` text DEFAULT ('[]') NOT NULL;