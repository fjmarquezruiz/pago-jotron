-- Pago de Jotrón - Estructura de la BD (MVP1). Nombres en snake_case y plural: equivalen a las entidades del diseño de la T2 (Product -> products, ProductID -> product_id).
-- MySQL dump 10.13  Distrib 8.4.13, for Linux (x86_64)
--
-- Host: localhost    Database: jotron
-- ------------------------------------------------------
-- Server version	8.4.13

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `addresses`
--

DROP TABLE IF EXISTS `addresses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `addresses` (
  `address_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `phone` varchar(20) NOT NULL,
  `street_type` enum('Calle','Avenida','Plaza','Paseo','Camino','Carretera','Ronda','Travesía','Glorieta','Urbanización') NOT NULL DEFAULT 'Calle',
  `street_name` varchar(100) NOT NULL,
  `number` varchar(10) NOT NULL,
  `floor` varchar(20) DEFAULT NULL,
  `postal_code` varchar(10) NOT NULL,
  `city` varchar(100) NOT NULL,
  `province` varchar(100) NOT NULL,
  `country` varchar(100) NOT NULL DEFAULT 'España',
  `address_type` enum('Envío','Facturación') NOT NULL DEFAULT 'Envío',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`address_id`),
  KEY `addresses_user_id_users_user_id_fk` (`user_id`),
  CONSTRAINT `addresses_user_id_users_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `audit_logs`
--

DROP TABLE IF EXISTS `audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_logs` (
  `audit_log_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `action` text NOT NULL,
  `logged_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `details` text,
  PRIMARY KEY (`audit_log_id`),
  KEY `fk_auditlog_user` (`user_id`),
  CONSTRAINT `fk_auditlog_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `cancellation_types`
--

DROP TABLE IF EXISTS `cancellation_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cancellation_types` (
  `cancellation_type_id` int NOT NULL AUTO_INCREMENT,
  `description` text NOT NULL,
  PRIMARY KEY (`cancellation_type_id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `cart_products`
--

DROP TABLE IF EXISTS `cart_products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cart_products` (
  `user_id` int NOT NULL,
  `variant_id` int NOT NULL,
  `quantity` int unsigned NOT NULL DEFAULT '1',
  `added_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`,`variant_id`),
  KEY `fk_cartproduct_variant` (`variant_id`),
  CONSTRAINT `fk_cartproduct_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_cartproduct_variant` FOREIGN KEY (`variant_id`) REFERENCES `product_variants` (`variant_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `ck_cartproduct_quantity` CHECK ((`quantity` > 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categories` (
  `category_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  PRIMARY KEY (`category_id`),
  UNIQUE KEY `categories_name_unique` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `grapes`
--

DROP TABLE IF EXISTS `grapes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `grapes` (
  `grape_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `color` enum('Tinta','Blanca','Rosada') NOT NULL,
  PRIMARY KEY (`grape_id`),
  UNIQUE KEY `grapes_name_unique` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `guarantees_of_origin`
--

DROP TABLE IF EXISTS `guarantees_of_origin`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `guarantees_of_origin` (
  `guarantee_of_origin_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `classification` enum('DO','DOP','DOCa','IGP','VT') NOT NULL DEFAULT 'DO',
  `region` varchar(100) DEFAULT NULL,
  `regulatory_council` varchar(150) DEFAULT NULL,
  `founded_year` int DEFAULT NULL,
  `website` varchar(255) DEFAULT NULL,
  `description` text,
  `is_blocked` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`guarantee_of_origin_id`),
  UNIQUE KEY `guarantees_of_origin_name_unique` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `invoices`
--

DROP TABLE IF EXISTS `invoices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `invoices` (
  `invoice_id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL,
  `number` varchar(50) NOT NULL,
  `issue_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `tax_base` decimal(10,2) NOT NULL,
  `tax_amount` decimal(10,2) NOT NULL,
  `total` decimal(10,2) NOT NULL,
  PRIMARY KEY (`invoice_id`),
  UNIQUE KEY `invoices_order_id_unique` (`order_id`),
  UNIQUE KEY `invoices_number_unique` (`number`),
  CONSTRAINT `fk_invoice_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON UPDATE CASCADE,
  CONSTRAINT `ck_invoice_total` CHECK ((`total` = (`tax_base` + `tax_amount`)))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `order_products`
--

DROP TABLE IF EXISTS `order_products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_products` (
  `order_id` int NOT NULL,
  `variant_id` int NOT NULL,
  `quantity` int unsigned NOT NULL DEFAULT '1',
  `unit_price` decimal(10,2) NOT NULL,
  `tax_rate` decimal(5,2) NOT NULL,
  PRIMARY KEY (`order_id`,`variant_id`),
  KEY `fk_orderproduct_variant` (`variant_id`),
  CONSTRAINT `fk_orderproduct_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_orderproduct_variant` FOREIGN KEY (`variant_id`) REFERENCES `product_variants` (`variant_id`) ON UPDATE CASCADE,
  CONSTRAINT `ck_orderproduct_quantity` CHECK ((`quantity` > 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `order_statuses`
--

DROP TABLE IF EXISTS `order_statuses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_statuses` (
  `status_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  PRIMARY KEY (`status_id`),
  UNIQUE KEY `order_statuses_name_unique` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `orders`
--

DROP TABLE IF EXISTS `orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `orders` (
  `order_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `shipping_address_id` int DEFAULT NULL,
  `billing_address_id` int DEFAULT NULL,
  `payment_method` enum('Tarjeta','PayPal','Transferencia') NOT NULL,
  `shipping_type_id` int NOT NULL,
  `shipping_cost` decimal(10,2) NOT NULL DEFAULT '0.00',
  `total` decimal(10,2) NOT NULL,
  `status_id` int NOT NULL,
  `status_updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `cancelled_by` enum('Cliente','Administrador') DEFAULT NULL,
  `cancellation_type_id` int DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `shipping_date` date DEFAULT NULL,
  PRIMARY KEY (`order_id`),
  KEY `orders_user_id_users_user_id_fk` (`user_id`),
  KEY `fk_order_shipping_address` (`shipping_address_id`),
  KEY `fk_order_billing_address` (`billing_address_id`),
  KEY `fk_order_shipping_type` (`shipping_type_id`),
  KEY `fk_order_status` (`status_id`),
  KEY `fk_order_cancellation_type` (`cancellation_type_id`),
  CONSTRAINT `fk_order_billing_address` FOREIGN KEY (`billing_address_id`) REFERENCES `addresses` (`address_id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_order_cancellation_type` FOREIGN KEY (`cancellation_type_id`) REFERENCES `cancellation_types` (`cancellation_type_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_order_shipping_address` FOREIGN KEY (`shipping_address_id`) REFERENCES `addresses` (`address_id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_order_shipping_type` FOREIGN KEY (`shipping_type_id`) REFERENCES `shipping_types` (`shipping_type_id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_order_status` FOREIGN KEY (`status_id`) REFERENCES `order_statuses` (`status_id`) ON UPDATE CASCADE,
  CONSTRAINT `orders_user_id_users_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON UPDATE CASCADE,
  CONSTRAINT `ck_order_total` CHECK (((`total` >= 0) and (`shipping_cost` >= 0)))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `product_categories`
--

DROP TABLE IF EXISTS `product_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_categories` (
  `product_id` int NOT NULL,
  `category_id` int NOT NULL,
  PRIMARY KEY (`product_id`,`category_id`),
  KEY `fk_pc_category` (`category_id`),
  CONSTRAINT `fk_pc_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`category_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_pc_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `product_grapes`
--

DROP TABLE IF EXISTS `product_grapes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_grapes` (
  `product_id` int NOT NULL,
  `grape_id` int NOT NULL,
  `percentage` decimal(5,2) DEFAULT NULL,
  PRIMARY KEY (`product_id`,`grape_id`),
  KEY `fk_pg_grape` (`grape_id`),
  CONSTRAINT `fk_pg_grape` FOREIGN KEY (`grape_id`) REFERENCES `grapes` (`grape_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_pg_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `ck_grape_percentage` CHECK (((`percentage` > 0) and (`percentage` <= 100)))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `product_steps`
--

DROP TABLE IF EXISTS `product_steps`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_steps` (
  `step_id` int NOT NULL AUTO_INCREMENT,
  `product_id` int NOT NULL,
  `position` int NOT NULL,
  `title` varchar(100) NOT NULL,
  `description` text,
  PRIMARY KEY (`step_id`),
  UNIQUE KEY `uq_step_position` (`product_id`,`position`),
  CONSTRAINT `product_steps_product_id_products_product_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `product_tasting_tags`
--

DROP TABLE IF EXISTS `product_tasting_tags`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_tasting_tags` (
  `product_id` int NOT NULL,
  `tasting_tag_id` int NOT NULL,
  PRIMARY KEY (`product_id`,`tasting_tag_id`),
  KEY `fk_ptt_tasting_tag` (`tasting_tag_id`),
  CONSTRAINT `fk_ptt_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_ptt_tasting_tag` FOREIGN KEY (`tasting_tag_id`) REFERENCES `tasting_tags` (`tasting_tag_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `product_variants`
--

DROP TABLE IF EXISTS `product_variants`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_variants` (
  `variant_id` int NOT NULL AUTO_INCREMENT,
  `product_id` int NOT NULL,
  `format` varchar(50) NOT NULL,
  `capacity` int NOT NULL,
  `capacity_unit` enum('ml','g') NOT NULL DEFAULT 'ml',
  `price` decimal(10,2) NOT NULL,
  `stock` int NOT NULL DEFAULT '0',
  `is_blocked` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`variant_id`),
  UNIQUE KEY `uq_variant_format` (`product_id`,`format`,`capacity`),
  CONSTRAINT `product_variants_product_id_products_product_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON UPDATE CASCADE,
  CONSTRAINT `ck_variant_capacity` CHECK ((`capacity` > 0)),
  CONSTRAINT `ck_variant_price` CHECK ((`price` >= 0)),
  CONSTRAINT `ck_variant_stock` CHECK ((`stock` >= 0))
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `products` (
  `product_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `winery_id` int NOT NULL,
  `guarantee_of_origin_id` int NOT NULL,
  `typology_id` int NOT NULL,
  `vintage` int DEFAULT NULL,
  `image` varchar(255) DEFAULT NULL,
  `description` text,
  `visual_note` text,
  `aroma_note` text,
  `palate_note` text,
  `min_temperature` decimal(5,2) DEFAULT NULL,
  `max_temperature` decimal(5,2) DEFAULT NULL,
  `alcohol_content` decimal(5,2) DEFAULT NULL,
  `aging_time` varchar(100) DEFAULT NULL,
  `aging_method` text,
  `production` varchar(50) DEFAULT NULL,
  `vineyard_altitude` int DEFAULT NULL,
  `soil_type` varchar(100) DEFAULT NULL,
  `yield` int DEFAULT NULL,
  `food_pairing` text,
  `is_blocked` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`product_id`),
  KEY `products_winery_id_wineries_winery_id_fk` (`winery_id`),
  KEY `products_typology_id_typologies_typology_id_fk` (`typology_id`),
  KEY `fk_product_guarantee` (`guarantee_of_origin_id`),
  CONSTRAINT `fk_product_guarantee` FOREIGN KEY (`guarantee_of_origin_id`) REFERENCES `guarantees_of_origin` (`guarantee_of_origin_id`) ON UPDATE CASCADE,
  CONSTRAINT `products_typology_id_typologies_typology_id_fk` FOREIGN KEY (`typology_id`) REFERENCES `typologies` (`typology_id`) ON UPDATE CASCADE,
  CONSTRAINT `products_winery_id_wineries_winery_id_fk` FOREIGN KEY (`winery_id`) REFERENCES `wineries` (`winery_id`) ON UPDATE CASCADE,
  CONSTRAINT `ck_product_altitude` CHECK ((`vineyard_altitude` >= 0)),
  CONSTRAINT `ck_product_temp` CHECK ((`min_temperature` <= `max_temperature`)),
  CONSTRAINT `ck_product_yield` CHECK ((`yield` > 0))
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `shipping_types`
--

DROP TABLE IF EXISTS `shipping_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `shipping_types` (
  `shipping_type_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `cost` decimal(10,2) NOT NULL DEFAULT '0.00',
  `min_delivery_days` tinyint unsigned DEFAULT NULL,
  `max_delivery_days` tinyint unsigned DEFAULT NULL,
  `is_blocked` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`shipping_type_id`),
  UNIQUE KEY `shipping_types_name_unique` (`name`),
  CONSTRAINT `ck_shipping_cost` CHECK ((`cost` >= 0)),
  CONSTRAINT `ck_shipping_days` CHECK (((`min_delivery_days` is null) or (`max_delivery_days` is null) or (`min_delivery_days` <= `max_delivery_days`)))
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tasting_tags`
--

DROP TABLE IF EXISTS `tasting_tags`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tasting_tags` (
  `tasting_tag_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  PRIMARY KEY (`tasting_tag_id`),
  UNIQUE KEY `tasting_tags_name_unique` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `typologies`
--

DROP TABLE IF EXISTS `typologies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `typologies` (
  `typology_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `product_type` enum('Vino','Pasas') NOT NULL DEFAULT 'Vino',
  `filter_order` int NOT NULL DEFAULT '0',
  `tax_rate` decimal(5,2) NOT NULL DEFAULT '21.00',
  PRIMARY KEY (`typology_id`),
  UNIQUE KEY `typologies_name_unique` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `user_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) DEFAULT NULL,
  `last_name` varchar(100) DEFAULT NULL,
  `birth_date` date NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `id_card` varchar(20) DEFAULT NULL,
  `email` varchar(100) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `role` enum('Cliente','Editor','Administrador') NOT NULL DEFAULT 'Cliente',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `registration_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `users_email_unique` (`email`),
  UNIQUE KEY `users_id_card_unique` (`id_card`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `wineries`
--

DROP TABLE IF EXISTS `wineries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `wineries` (
  `winery_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` text,
  `address` varchar(255) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `province` varchar(100) DEFAULT NULL,
  `country` varchar(100) NOT NULL DEFAULT 'España',
  `phone` varchar(20) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `website` varchar(255) DEFAULT NULL,
  `is_blocked` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`winery_id`),
  UNIQUE KEY `wineries_name_unique` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-11-10 18:11:38
