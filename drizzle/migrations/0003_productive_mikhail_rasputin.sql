ALTER TABLE `addresses` ADD `recipient_name` varchar(200);--> statement-breakpoint
UPDATE `addresses` `a` JOIN `users` `u` ON `u`.`user_id` = `a`.`user_id` SET `a`.`recipient_name` = COALESCE(NULLIF(TRIM(CONCAT_WS(' ', `u`.`name`, `u`.`last_name`)), ''), `u`.`email`) WHERE `a`.`recipient_name` IS NULL;--> statement-breakpoint
ALTER TABLE `addresses` MODIFY `recipient_name` varchar(200) NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `payment_intent_id` varchar(64);--> statement-breakpoint
ALTER TABLE `orders` ADD CONSTRAINT `orders_payment_intent_id_unique` UNIQUE(`payment_intent_id`);
