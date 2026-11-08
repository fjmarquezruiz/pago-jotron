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
ALTER TABLE `addresses` ADD CONSTRAINT `addresses_user_id_users_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE no action ON UPDATE cascade;