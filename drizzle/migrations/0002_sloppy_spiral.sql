ALTER TABLE `products` ADD `slug` varchar(150);--> statement-breakpoint
UPDATE `products` SET `slug` = CONCAT('producto-', `product_id`) WHERE `slug` IS NULL;--> statement-breakpoint
ALTER TABLE `products` MODIFY `slug` varchar(150) NOT NULL;--> statement-breakpoint
ALTER TABLE `products` ADD CONSTRAINT `products_slug_unique` UNIQUE(`slug`);
