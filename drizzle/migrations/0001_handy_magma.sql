CREATE TABLE `category` (
	`category_id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	CONSTRAINT `category_category_id` PRIMARY KEY(`category_id`),
	CONSTRAINT `category_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `grape` (
	`grape_id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`color` enum('Tinta','Blanca','Rosada') NOT NULL,
	CONSTRAINT `grape_grape_id` PRIMARY KEY(`grape_id`),
	CONSTRAINT `grape_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `guarantee_of_origin` (
	`guarantee_of_origin_id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`classification` enum('DO','DOP','DOCa','IGP','VT') NOT NULL DEFAULT 'DO',
	`region` varchar(100),
	`regulatory_council` varchar(150),
	`founded_year` int,
	`website` varchar(255),
	`description` text,
	`is_blocked` boolean NOT NULL DEFAULT false,
	CONSTRAINT `guarantee_of_origin_guarantee_of_origin_id` PRIMARY KEY(`guarantee_of_origin_id`),
	CONSTRAINT `guarantee_of_origin_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `tasting_tag` (
	`tasting_tag_id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(50) NOT NULL,
	CONSTRAINT `tasting_tag_tasting_tag_id` PRIMARY KEY(`tasting_tag_id`),
	CONSTRAINT `tasting_tag_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `typology` (
	`typology_id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(50) NOT NULL,
	`product_type` enum('Vino','Pasas') NOT NULL DEFAULT 'Vino',
	`filter_order` int NOT NULL DEFAULT 0,
	`tax_rate` decimal(5,2) NOT NULL DEFAULT '21.00',
	CONSTRAINT `typology_typology_id` PRIMARY KEY(`typology_id`),
	CONSTRAINT `typology_name_unique` UNIQUE(`name`)
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
