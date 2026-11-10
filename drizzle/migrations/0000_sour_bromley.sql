CREATE TABLE `addresses` (
	`address_id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`phone` varchar(20) NOT NULL,
	`street_type` enum('Calle','Avenida','Plaza','Paseo','Camino','Carretera','Ronda','Travesía','Glorieta','Urbanización') NOT NULL DEFAULT 'Calle',
	`street_name` varchar(100) NOT NULL,
	`number` varchar(10) NOT NULL,
	`floor` varchar(20),
	`postal_code` varchar(10) NOT NULL,
	`city` varchar(100) NOT NULL,
	`province` varchar(100) NOT NULL,
	`country` varchar(100) NOT NULL DEFAULT 'España',
	`address_type` enum('Envío','Facturación') NOT NULL DEFAULT 'Envío',
	`is_active` boolean NOT NULL DEFAULT true,
	CONSTRAINT `addresses_address_id` PRIMARY KEY(`address_id`)
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`category_id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	CONSTRAINT `categories_category_id` PRIMARY KEY(`category_id`),
	CONSTRAINT `categories_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `grapes` (
	`grape_id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`color` enum('Tinta','Blanca','Rosada') NOT NULL,
	CONSTRAINT `grapes_grape_id` PRIMARY KEY(`grape_id`),
	CONSTRAINT `grapes_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `guarantees_of_origin` (
	`guarantee_of_origin_id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`classification` enum('DO','DOP','DOCa','IGP','VT') NOT NULL DEFAULT 'DO',
	`region` varchar(100),
	`regulatory_council` varchar(150),
	`founded_year` int,
	`website` varchar(255),
	`description` text,
	`is_blocked` boolean NOT NULL DEFAULT false,
	CONSTRAINT `guarantees_of_origin_guarantee_of_origin_id` PRIMARY KEY(`guarantee_of_origin_id`),
	CONSTRAINT `guarantees_of_origin_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
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
CREATE TABLE `product_tasting_tags` (
	`product_id` int NOT NULL,
	`tasting_tag_id` int NOT NULL,
	CONSTRAINT `product_tasting_tags_product_id_tasting_tag_id_pk` PRIMARY KEY(`product_id`,`tasting_tag_id`)
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
CREATE TABLE `tasting_tags` (
	`tasting_tag_id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(50) NOT NULL,
	CONSTRAINT `tasting_tags_tasting_tag_id` PRIMARY KEY(`tasting_tag_id`),
	CONSTRAINT `tasting_tags_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `typologies` (
	`typology_id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(50) NOT NULL,
	`product_type` enum('Vino','Pasas') NOT NULL DEFAULT 'Vino',
	`filter_order` int NOT NULL DEFAULT 0,
	`tax_rate` decimal(5,2) NOT NULL DEFAULT '21.00',
	CONSTRAINT `typologies_typology_id` PRIMARY KEY(`typology_id`),
	CONSTRAINT `typologies_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`user_id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100),
	`last_name` varchar(100),
	`birth_date` date NOT NULL,
	`password_hash` varchar(255) NOT NULL,
	`id_card` varchar(20),
	`email` varchar(100) NOT NULL,
	`phone` varchar(20),
	`role` enum('Cliente','Editor','Administrador') NOT NULL DEFAULT 'Cliente',
	`is_active` boolean NOT NULL DEFAULT true,
	`registration_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `users_user_id` PRIMARY KEY(`user_id`),
	CONSTRAINT `users_id_card_unique` UNIQUE(`id_card`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `wineries` (
	`winery_id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`address` varchar(255),
	`city` varchar(100),
	`province` varchar(100),
	`country` varchar(100) NOT NULL DEFAULT 'España',
	`phone` varchar(20),
	`email` varchar(100),
	`website` varchar(255),
	`is_blocked` boolean NOT NULL DEFAULT false,
	CONSTRAINT `wineries_winery_id` PRIMARY KEY(`winery_id`),
	CONSTRAINT `wineries_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
ALTER TABLE `addresses` ADD CONSTRAINT `addresses_user_id_users_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE no action ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `product_categories` ADD CONSTRAINT `fk_pc_product` FOREIGN KEY (`product_id`) REFERENCES `products`(`product_id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `product_categories` ADD CONSTRAINT `fk_pc_category` FOREIGN KEY (`category_id`) REFERENCES `categories`(`category_id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `product_grapes` ADD CONSTRAINT `fk_pg_product` FOREIGN KEY (`product_id`) REFERENCES `products`(`product_id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `product_grapes` ADD CONSTRAINT `fk_pg_grape` FOREIGN KEY (`grape_id`) REFERENCES `grapes`(`grape_id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `product_steps` ADD CONSTRAINT `product_steps_product_id_products_product_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products`(`product_id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `product_tasting_tags` ADD CONSTRAINT `fk_ptt_product` FOREIGN KEY (`product_id`) REFERENCES `products`(`product_id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `product_tasting_tags` ADD CONSTRAINT `fk_ptt_tasting_tag` FOREIGN KEY (`tasting_tag_id`) REFERENCES `tasting_tags`(`tasting_tag_id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `product_variants` ADD CONSTRAINT `product_variants_product_id_products_product_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products`(`product_id`) ON DELETE no action ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `products` ADD CONSTRAINT `products_winery_id_wineries_winery_id_fk` FOREIGN KEY (`winery_id`) REFERENCES `wineries`(`winery_id`) ON DELETE no action ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `products` ADD CONSTRAINT `products_typology_id_typologies_typology_id_fk` FOREIGN KEY (`typology_id`) REFERENCES `typologies`(`typology_id`) ON DELETE no action ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `products` ADD CONSTRAINT `fk_product_guarantee` FOREIGN KEY (`guarantee_of_origin_id`) REFERENCES `guarantees_of_origin`(`guarantee_of_origin_id`) ON DELETE no action ON UPDATE cascade;