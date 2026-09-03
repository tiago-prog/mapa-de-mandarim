ALTER TABLE `lesson_activities` DROP INDEX `lesson_activities_node_order_idx`;
--> statement-breakpoint
ALTER TABLE `lesson_activities` ADD CONSTRAINT `lesson_activities_node_step_order_idx` UNIQUE(`nodeId`,`stepId`,`orderIndex`);
