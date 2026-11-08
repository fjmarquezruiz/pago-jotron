CREATE TABLE `product_steps` (
	`step_id` int AUTO_INCREMENT NOT NULL,
	`product_id` int NOT NULL,
	`position` int NOT NULL,
	`title` varchar(100) NOT NULL,
	`description` text,
	CONSTRAINT `product_steps_step_id` PRIMARY KEY(`step_id`),
	CONSTRAINT `uq_step_position` UNIQUE(`product_id`,`position`)
);
--> statement-breakpoint
CREATE TABLE `product_variants` (
	`variant_id` int AUTO_INCREMENT NOT NULL,
	`product_id` int NOT NULL,
	`format` varchar(50) NOT NULL,
	`capacity` int NOT NULL,
	`capacity_unit` enum('ml','g') NOT NULL DEFAULT 'ml',
	`price` decimal(10,2) NOT NULL,
	`stock` int NOT NULL DEFAULT 0,
	`is_blocked` boolean NOT NULL DEFAULT false,
	CONSTRAINT `product_variants_variant_id` PRIMARY KEY(`variant_id`),
	CONSTRAINT `uq_variant_format` UNIQUE(`product_id`,`format`,`capacity`),
	CONSTRAINT `ck_variant_capacity` CHECK(`product_variants`.`capacity` > 0),
	CONSTRAINT `ck_variant_price` CHECK(`product_variants`.`price` >= 0),
	CONSTRAINT `ck_variant_stock` CHECK(`product_variants`.`stock` >= 0)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`product_id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`winery_id` int NOT NULL,
	`guarantee_of_origin_id` int NOT NULL,
	`typology_id` int NOT NULL,
	`vintage` int,
	`image` varchar(255),
	`description` text,
	`visual_note` text,
	`aroma_note` text,
	`palate_note` text,
	`min_temperature` decimal(5,2),
	`max_temperature` decimal(5,2),
	`alcohol_content` decimal(5,2),
	`aging_time` varchar(100),
	`aging_method` text,
	`production` varchar(50),
	`vineyard_altitude` int,
	`soil_type` varchar(100),
	`yield` int,
	`food_pairing` text,
	`is_blocked` boolean NOT NULL DEFAULT false,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `products_product_id` PRIMARY KEY(`product_id`),
	CONSTRAINT `ck_product_temp` CHECK(`products`.`min_temperature` <= `products`.`max_temperature`),
	CONSTRAINT `ck_product_altitude` CHECK(`products`.`vineyard_altitude` >= 0),
	CONSTRAINT `ck_product_yield` CHECK(`products`.`yield` > 0)
);
--> statement-breakpoint
ALTER TABLE `product_steps` ADD CONSTRAINT `product_steps_product_id_products_product_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products`(`product_id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `product_variants` ADD CONSTRAINT `product_variants_product_id_products_product_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products`(`product_id`) ON DELETE no action ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `products` ADD CONSTRAINT `products_winery_id_wineries_winery_id_fk` FOREIGN KEY (`winery_id`) REFERENCES `wineries`(`winery_id`) ON DELETE no action ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `products` ADD CONSTRAINT `products_guarantee_of_origin_id_guarantee_of_origin_guarantee_of_origin_id_fk` FOREIGN KEY (`guarantee_of_origin_id`) REFERENCES `guarantee_of_origin`(`guarantee_of_origin_id`) ON DELETE no action ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `products` ADD CONSTRAINT `products_typology_id_typology_typology_id_fk` FOREIGN KEY (`typology_id`) REFERENCES `typology`(`typology_id`) ON DELETE no action ON UPDATE cascade;