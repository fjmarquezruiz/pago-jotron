CREATE TABLE `invoice_series` (
	`year` int NOT NULL,
	`last_number` int NOT NULL DEFAULT 0,
	CONSTRAINT `invoice_series_year` PRIMARY KEY(`year`)
);
--> statement-breakpoint
ALTER TABLE `invoices` ADD `kind` enum('Completa','Simplificada') DEFAULT 'Completa' NOT NULL;--> statement-breakpoint
ALTER TABLE `invoices` ADD `snapshot` json NOT NULL;