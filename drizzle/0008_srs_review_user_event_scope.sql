ALTER TABLE `srs_reviews` DROP INDEX `srs_reviews_client_event_id_unique`;
--> statement-breakpoint
ALTER TABLE `srs_reviews` ADD CONSTRAINT `srs_reviews_user_event_idx` UNIQUE(`userId`,`clientEventId`);
