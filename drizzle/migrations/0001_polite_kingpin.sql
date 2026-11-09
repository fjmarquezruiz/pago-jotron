CREATE TABLE `audit_logs` (
	`audit_log_id` int AUTO_INCREMENT NOT NULL,
	`user_id` int,
	`action` text NOT NULL,
	`logged_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`details` text,
	CONSTRAINT `audit_logs_audit_log_id` PRIMARY KEY(`audit_log_id`)
);
--> statement-breakpoint
CREATE TABLE `cancellation_types` (
	`cancellation_type_id` int AUTO_INCREMENT NOT NULL,
	`description` text NOT NULL,
	CONSTRAINT `cancellation_types_cancellation_type_id` PRIMARY KEY(`cancellation_type_id`)
);
--> statement-breakpoint
CREATE TABLE `cart_products` (
	`user_id` int NOT NULL,
	`variant_id` int NOT NULL,
	`quantity` int unsigned NOT NULL DEFAULT 1,
	`added_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `cart_products_user_id_variant_id_pk` PRIMARY KEY(`user_id`,`variant_id`),
	CONSTRAINT `ck_cartproduct_quantity` CHECK(`cart_products`.`quantity` > 0)
);
--> statement-breakpoint
CREATE TABLE `invoices` (
	`invoice_id` int AUTO_INCREMENT NOT NULL,
	`order_id` int NOT NULL,
	`number` varchar(50) NOT NULL,
	`issue_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`tax_base` decimal(10,2) NOT NULL,
	`tax_amount` decimal(10,2) NOT NULL,
	`total` decimal(10,2) NOT NULL,
	CONSTRAINT `invoices_invoice_id` PRIMARY KEY(`invoice_id`),
	CONSTRAINT `invoices_order_id_unique` UNIQUE(`order_id`),
	CONSTRAINT `invoices_number_unique` UNIQUE(`number`),
	CONSTRAINT `ck_invoice_total` CHECK(`invoices`.`total` = `invoices`.`tax_base` + `invoices`.`tax_amount`)
);
--> statement-breakpoint
CREATE TABLE `order_products` (
	`order_id` int NOT NULL,
	`variant_id` int NOT NULL,
	`quantity` int unsigned NOT NULL DEFAULT 1,
	`unit_price` decimal(10,2) NOT NULL,
	`tax_rate` decimal(5,2) NOT NULL,
	CONSTRAINT `order_products_order_id_variant_id_pk` PRIMARY KEY(`order_id`,`variant_id`),
	CONSTRAINT `ck_orderproduct_quantity` CHECK(`order_products`.`quantity` > 0)
);
--> statement-breakpoint
CREATE TABLE `order_statuses` (
	`status_id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(50) NOT NULL,
	CONSTRAINT `order_statuses_status_id` PRIMARY KEY(`status_id`),
	CONSTRAINT `order_statuses_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`order_id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`shipping_address_id` int,
	`billing_address_id` int,
	`payment_method` enum('Tarjeta','PayPal','Transferencia') NOT NULL,
	`shipping_type_id` int NOT NULL,
	`shipping_cost` decimal(10,2) NOT NULL DEFAULT '0.00',
	`total` decimal(10,2) NOT NULL,
	`status_id` int NOT NULL,
	`status_updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`cancelled_by` enum('Cliente','Administrador'),
	`cancellation_type_id` int,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`shipping_date` date,
	CONSTRAINT `orders_order_id` PRIMARY KEY(`order_id`),
	CONSTRAINT `ck_order_total` CHECK(`orders`.`total` >= 0 AND `orders`.`shipping_cost` >= 0)
);
--> statement-breakpoint
CREATE TABLE `shipping_types` (
	`shipping_type_id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(50) NOT NULL,
	`cost` decimal(10,2) NOT NULL DEFAULT '0.00',
	`min_delivery_days` tinyint unsigned,
	`max_delivery_days` tinyint unsigned,
	`is_blocked` boolean NOT NULL DEFAULT false,
	CONSTRAINT `shipping_types_shipping_type_id` PRIMARY KEY(`shipping_type_id`),
	CONSTRAINT `shipping_types_name_unique` UNIQUE(`name`),
	CONSTRAINT `ck_shipping_cost` CHECK(`shipping_types`.`cost` >= 0),
	CONSTRAINT `ck_shipping_days` CHECK(`shipping_types`.`min_delivery_days` IS NULL OR `shipping_types`.`max_delivery_days` IS NULL OR `shipping_types`.`min_delivery_days` <= `shipping_types`.`max_delivery_days`)
);
--> statement-breakpoint
ALTER TABLE `audit_logs` ADD CONSTRAINT `fk_auditlog_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `cart_products` ADD CONSTRAINT `fk_cartproduct_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `cart_products` ADD CONSTRAINT `fk_cartproduct_variant` FOREIGN KEY (`variant_id`) REFERENCES `product_variants`(`variant_id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `invoices` ADD CONSTRAINT `fk_invoice_order` FOREIGN KEY (`order_id`) REFERENCES `orders`(`order_id`) ON DELETE no action ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `order_products` ADD CONSTRAINT `fk_orderproduct_order` FOREIGN KEY (`order_id`) REFERENCES `orders`(`order_id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `order_products` ADD CONSTRAINT `fk_orderproduct_variant` FOREIGN KEY (`variant_id`) REFERENCES `product_variants`(`variant_id`) ON DELETE no action ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `orders` ADD CONSTRAINT `orders_user_id_users_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE no action ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `orders` ADD CONSTRAINT `fk_order_shipping_address` FOREIGN KEY (`shipping_address_id`) REFERENCES `addresses`(`address_id`) ON DELETE no action ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `orders` ADD CONSTRAINT `fk_order_billing_address` FOREIGN KEY (`billing_address_id`) REFERENCES `addresses`(`address_id`) ON DELETE no action ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `orders` ADD CONSTRAINT `fk_order_shipping_type` FOREIGN KEY (`shipping_type_id`) REFERENCES `shipping_types`(`shipping_type_id`) ON DELETE no action ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `orders` ADD CONSTRAINT `fk_order_status` FOREIGN KEY (`status_id`) REFERENCES `order_statuses`(`status_id`) ON DELETE no action ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `orders` ADD CONSTRAINT `fk_order_cancellation_type` FOREIGN KEY (`cancellation_type_id`) REFERENCES `cancellation_types`(`cancellation_type_id`) ON DELETE set null ON UPDATE cascade;