CREATE TABLE `srs_cards` (
	`id` varchar(96) NOT NULL,
	`userId` int NOT NULL,
	`lexicalEntryId` varchar(64) NOT NULL,
	`box` int NOT NULL DEFAULT 1,
	`dueAt` timestamp NOT NULL,
	`intervalDays` int NOT NULL DEFAULT 0,
	`easeFactor` varchar(16) NOT NULL DEFAULT '2.5',
	`reviewCount` int NOT NULL DEFAULT 0,
	`lapseCount` int NOT NULL DEFAULT 0,
	`lastReviewedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `srs_cards_id` PRIMARY KEY(`id`),
	CONSTRAINT `srs_cards_user_lexical_entry_idx` UNIQUE(`userId`,`lexicalEntryId`),
	KEY `srs_cards_due_idx` (`userId`,`dueAt`)
);
--> statement-breakpoint
CREATE TABLE `srs_reviews` (
	`id` varchar(96) NOT NULL,
	`clientEventId` varchar(96) NOT NULL,
	`userId` int NOT NULL,
	`cardId` varchar(96) NOT NULL,
	`rating` enum('forgot','hard','easy') NOT NULL,
	`previousBox` int NOT NULL,
	`nextBox` int NOT NULL,
	`previousDueAt` timestamp NOT NULL,
	`nextDueAt` timestamp NOT NULL,
	`reviewedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `srs_reviews_id` PRIMARY KEY(`id`),
	CONSTRAINT `srs_reviews_client_event_id_unique` UNIQUE(`clientEventId`),
	KEY `srs_reviews_user_reviewed_idx` (`userId`,`reviewedAt`),
	KEY `srs_reviews_card_reviewed_idx` (`cardId`,`reviewedAt`)
);
