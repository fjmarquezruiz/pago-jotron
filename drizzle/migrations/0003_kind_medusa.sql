CREATE TABLE `product_categories` (
	`product_id` int NOT NULL,
	`category_id` int NOT NULL,
	CONSTRAINT `product_categories_product_id_category_id_pk` PRIMARY KEY(`product_id`,`category_id`)
);
--> statement-breakpoint
CREATE TABLE `product_grapes` (
	`product_id` int NOT NULL,
	`grape_id` int NOT NULL,
	`percentage` decimal(5,2),
	CONSTRAINT `product_grapes_product_id_grape_id_pk` PRIMARY KEY(`product_id`,`grape_id`),
	CONSTRAINT `ck_grape_percentage` CHECK(`product_grapes`.`percentage` > 0 AND `product_grapes`.`percentage` <= 100)
);
--> statement-breakpoint
CREATE TABLE `product_tasting_tags` (
	`product_id` int NOT NULL,
	`tasting_tag_id` int NOT NULL,
	CONSTRAINT `product_tasting_tags_product_id_tasting_tag_id_pk` PRIMARY KEY(`product_id`,`tasting_tag_id`)
);
--> statement-breakpoint
ALTER TABLE `product_categories` ADD CONSTRAINT `product_categories_product_id_products_product_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products`(`product_id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `product_categories` ADD CONSTRAINT `product_categories_category_id_category_category_id_fk` FOREIGN KEY (`category_id`) REFERENCES `category`(`category_id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `product_grapes` ADD CONSTRAINT `product_grapes_product_id_products_product_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products`(`product_id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `product_grapes` ADD CONSTRAINT `product_grapes_grape_id_grape_grape_id_fk` FOREIGN KEY (`grape_id`) REFERENCES `grape`(`grape_id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `product_tasting_tags` ADD CONSTRAINT `product_tasting_tags_product_id_products_product_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products`(`product_id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `product_tasting_tags` ADD CONSTRAINT `product_tasting_tags_tasting_tag_id_tasting_tag_tasting_tag_id_fk` FOREIGN KEY (`tasting_tag_id`) REFERENCES `tasting_tag`(`tasting_tag_id`) ON DELETE cascade ON UPDATE cascade;