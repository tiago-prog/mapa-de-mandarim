CREATE TABLE `activity_completions` (
	`clientEventId` varchar(96) NOT NULL,
	`userId` int NOT NULL,
	`activityId` varchar(64) NOT NULL,
	`nodeId` varchar(64) NOT NULL,
	`selectedOptionId` varchar(64) NOT NULL,
	`isCorrect` boolean NOT NULL,
	`xpAwarded` int NOT NULL DEFAULT 0,
	`completedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `activity_completions_clientEventId` PRIMARY KEY(`clientEventId`)
);
--> statement-breakpoint
CREATE TABLE `learning_nodes` (
	`id` varchar(64) NOT NULL,
	`pathId` varchar(64) NOT NULL,
	`title` varchar(180) NOT NULL,
	`description` text NOT NULL,
	`objective` varchar(255) NOT NULL,
	`orderIndex` int NOT NULL,
	`prerequisiteNodeId` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `learning_nodes_id` PRIMARY KEY(`id`),
	CONSTRAINT `learning_nodes_path_order_idx` UNIQUE(`pathId`,`orderIndex`)
);
--> statement-breakpoint
CREATE TABLE `learning_paths` (
	`id` varchar(64) NOT NULL,
	`slug` varchar(160) NOT NULL,
	`title` varchar(180) NOT NULL,
	`description` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `learning_paths_id` PRIMARY KEY(`id`),
	CONSTRAINT `learning_paths_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `lesson_activities` (
	`id` varchar(64) NOT NULL,
	`nodeId` varchar(64) NOT NULL,
	`type` enum('multiple_choice') NOT NULL,
	`orderIndex` int NOT NULL,
	`prompt` varchar(255) NOT NULL,
	`hanzi` varchar(80) NOT NULL,
	`pinyin` varchar(160) NOT NULL,
	`meaning` varchar(255) NOT NULL,
	`optionsJson` text NOT NULL,
	`correctOptionId` varchar(64) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `lesson_activities_id` PRIMARY KEY(`id`),
	CONSTRAINT `lesson_activities_node_order_idx` UNIQUE(`nodeId`,`orderIndex`)
);
--> statement-breakpoint
CREATE TABLE `lexical_entries` (
	`id` varchar(64) NOT NULL,
	`hanzi` varchar(80) NOT NULL,
	`pinyin` varchar(160) NOT NULL,
	`meaningPtBr` varchar(255) NOT NULL,
	`exampleHanzi` varchar(255) NOT NULL,
	`examplePtBr` varchar(255) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `lexical_entries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `node_lexical_entries` (
	`nodeId` varchar(64) NOT NULL,
	`lexicalEntryId` varchar(64) NOT NULL,
	CONSTRAINT `node_lexical_entries_nodeId_lexicalEntryId_pk` PRIMARY KEY(`nodeId`,`lexicalEntryId`)
);
--> statement-breakpoint
CREATE TABLE `user_node_progress` (
	`userId` int NOT NULL,
	`nodeId` varchar(64) NOT NULL,
	`status` enum('in_progress','completed') NOT NULL DEFAULT 'in_progress',
	`progressPercent` int NOT NULL DEFAULT 0,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_node_progress_userId_nodeId_pk` PRIMARY KEY(`userId`,`nodeId`)
);
--> statement-breakpoint
CREATE TABLE `user_progress` (
	`userId` int NOT NULL,
	`xp` int NOT NULL DEFAULT 0,
	`streakDays` int NOT NULL DEFAULT 0,
	`completedNodeCount` int NOT NULL DEFAULT 0,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_progress_userId` PRIMARY KEY(`userId`)
);
