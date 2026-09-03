CREATE TABLE `user_word_states` (
	`userId` int NOT NULL,
	`lexicalEntryId` varchar(64) NOT NULL,
	`status` enum('new','known','learning') NOT NULL DEFAULT 'new',
	`lastSeenAt` timestamp,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_word_states_userId_lexicalEntryId_pk` PRIMARY KEY(`userId`,`lexicalEntryId`)
);
