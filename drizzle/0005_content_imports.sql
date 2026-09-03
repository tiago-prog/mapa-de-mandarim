CREATE TABLE `content_imports` (
	`id` varchar(64) NOT NULL,
	`pathId` varchar(64) NOT NULL,
	`contentVersion` varchar(64) NOT NULL,
	`status` enum('draft','review','published','archived') NOT NULL DEFAULT 'draft',
	`payloadJson` text NOT NULL,
	`validationErrorsJson` text NOT NULL DEFAULT '[]',
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `content_imports_id` PRIMARY KEY(`id`),
	CONSTRAINT `content_imports_path_version_idx` UNIQUE(`pathId`,`contentVersion`)
);
