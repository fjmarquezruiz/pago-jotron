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
-- Dumping data for table `addresses`
--

LOCK TABLES `addresses` WRITE;
/*!40000 ALTER TABLE `addresses` DISABLE KEYS */;
/*!40000 ALTER TABLE `addresses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `audit_logs`
--

LOCK TABLES `audit_logs` WRITE;
/*!40000 ALTER TABLE `audit_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `audit_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `cancellation_types`
--

LOCK TABLES `cancellation_types` WRITE;
/*!40000 ALTER TABLE `cancellation_types` DISABLE KEYS */;
INSERT INTO `cancellation_types` VALUES (1,'El cliente decidió cancelar el pedido antes de que se enviara.'),(2,'Pedido duplicado por error.'),(3,'El cliente se arrepintió de la compra.'),(4,'Error en la dirección de envío proporcionada.'),(5,'No se recibió la transferencia en el plazo indicado.');
/*!40000 ALTER TABLE `cancellation_types` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `cart_products`
--

LOCK TABLES `cart_products` WRITE;
/*!40000 ALTER TABLE `cart_products` DISABLE KEYS */;
/*!40000 ALTER TABLE `cart_products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `categories`
--

LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
INSERT INTO `categories` VALUES (7,'Amontillado'),(3,'Blanco seco'),(5,'Fino'),(6,'Manzanilla'),(10,'Moscatel dulce'),(8,'Oloroso'),(9,'Pedro Ximénez'),(4,'Rosado'),(2,'Tinto crianza'),(1,'Tinto roble');
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `grapes`
--

LOCK TABLES `grapes` WRITE;
/*!40000 ALTER TABLE `grapes` DISABLE KEYS */;
INSERT INTO `grapes` VALUES (1,'Tempranillo','Tinta'),(2,'Syrah','Tinta'),(3,'Moscatel de Alejandría','Blanca'),(4,'Palomino Fino','Blanca'),(5,'Pedro Ximénez','Blanca'),(6,'Pinot Noir','Tinta'),(7,'Petit Verdot','Tinta'),(8,'Merlot','Tinta'),(9,'Cabernet Sauvignon','Tinta'),(10,'Zalema','Blanca');
/*!40000 ALTER TABLE `grapes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `guarantees_of_origin`
--

LOCK TABLES `guarantees_of_origin` WRITE;
/*!40000 ALTER TABLE `guarantees_of_origin` DISABLE KEYS */;
INSERT INTO `guarantees_of_origin` VALUES (1,'Jerez-Xérès-Sherry','DO','Marco de Jerez (Cádiz)','Consejo Regulador de Jerez-Xérès-Sherry y Manzanilla-Sanlúcar',1933,'https://www.sherry.wine','Vinos generosos criados en el Marco de Jerez por el sistema de criaderas y soleras.',0),(2,'Manzanilla-Sanlúcar de Barrameda','DO','Sanlúcar de Barrameda (Cádiz)','Consejo Regulador de Jerez-Xérès-Sherry y Manzanilla-Sanlúcar',NULL,'https://www.sherry.wine','Manzanilla criada bajo velo de flor en Sanlúcar de Barrameda.',0),(3,'Montilla-Moriles','DO','Sur de Córdoba','Consejo Regulador de Montilla-Moriles',NULL,NULL,'Finos, amontillados y dulces de pedro ximénez del sur de Córdoba, casi siempre sin encabezar.',0),(4,'Condado de Huelva','DO','Huelva','Consejo Regulador del Condado de Huelva',NULL,NULL,NULL,0),(5,'Málaga','DO','Málaga','Consejo Regulador de Málaga, Sierras de Málaga y Pasas de Málaga',1933,NULL,'Vinos dulces y licorosos de moscatel y pedro ximénez.',0),(6,'Sierras de Málaga','DO','Málaga','Consejo Regulador de Málaga, Sierras de Málaga y Pasas de Málaga',NULL,NULL,'Vinos tranquilos (blancos, rosados y tintos) de la provincia de Málaga.',0),(7,'Pasas de Málaga','DOP','Axarquía y Manilva (Málaga)','Consejo Regulador de Málaga, Sierras de Málaga y Pasas de Málaga',NULL,NULL,'Pasas de moscatel de Alejandría secadas al sol en paseros.',0),(8,'Granada','DO','Granada','Consejo Regulador de Granada',NULL,NULL,NULL,0),(9,'Lebrija','DO','Sevilla','Consejo Regulador de Lebrija',NULL,NULL,NULL,0),(10,'Cádiz','VT','Cádiz',NULL,NULL,NULL,NULL,0);
/*!40000 ALTER TABLE `guarantees_of_origin` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `invoices`
--

LOCK TABLES `invoices` WRITE;
/*!40000 ALTER TABLE `invoices` DISABLE KEYS */;
/*!40000 ALTER TABLE `invoices` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `order_products`
--

LOCK TABLES `order_products` WRITE;
/*!40000 ALTER TABLE `order_products` DISABLE KEYS */;
/*!40000 ALTER TABLE `order_products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `order_statuses`
--

LOCK TABLES `order_statuses` WRITE;
/*!40000 ALTER TABLE `order_statuses` DISABLE KEYS */;
INSERT INTO `order_statuses` VALUES (7,'Anulado'),(8,'Bloqueado'),(2,'Confirmado'),(3,'En proceso'),(6,'Entregado'),(5,'Enviado'),(1,'Pendiente de pago'),(4,'Preparado');
/*!40000 ALTER TABLE `order_statuses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `orders`
--

LOCK TABLES `orders` WRITE;
/*!40000 ALTER TABLE `orders` DISABLE KEYS */;
/*!40000 ALTER TABLE `orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `product_categories`
--

LOCK TABLES `product_categories` WRITE;
/*!40000 ALTER TABLE `product_categories` DISABLE KEYS */;
INSERT INTO `product_categories` VALUES (1,1),(8,2),(4,5),(7,5),(5,6),(6,9),(2,10);
/*!40000 ALTER TABLE `product_categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `product_grapes`
--

LOCK TABLES `product_grapes` WRITE;
/*!40000 ALTER TABLE `product_grapes` DISABLE KEYS */;
INSERT INTO `product_grapes` VALUES (1,1,70.00),(1,2,30.00),(2,3,100.00),(3,3,100.00),(4,4,100.00),(5,4,100.00),(6,5,100.00),(7,5,100.00),(8,6,100.00);
/*!40000 ALTER TABLE `product_grapes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `product_steps`
--

LOCK TABLES `product_steps` WRITE;
/*!40000 ALTER TABLE `product_steps` DISABLE KEYS */;
/*!40000 ALTER TABLE `product_steps` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `product_tasting_tags`
--

LOCK TABLES `product_tasting_tags` WRITE;
/*!40000 ALTER TABLE `product_tasting_tags` DISABLE KEYS */;
INSERT INTO `product_tasting_tags` VALUES (1,1),(2,2),(1,3),(8,3),(4,5),(5,5),(7,5),(2,7),(3,7),(6,7);
/*!40000 ALTER TABLE `product_tasting_tags` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `product_variants`
--

LOCK TABLES `product_variants` WRITE;
/*!40000 ALTER TABLE `product_variants` DISABLE KEYS */;
INSERT INTO `product_variants` VALUES (1,1,'Botella',750,'ml',9.50,120,0),(2,2,'Botella',500,'ml',14.00,60,0),(3,3,'Caja',500,'g',7.50,200,0),(4,3,'Caja',1000,'g',13.50,150,0),(5,4,'Botella',750,'ml',11.95,48,0),(6,5,'Botella',750,'ml',9.90,60,0),(7,6,'Botella',750,'ml',22.50,24,0),(8,7,'Botella',750,'ml',9.20,36,0),(9,8,'Botella',750,'ml',24.00,18,0);
/*!40000 ALTER TABLE `product_variants` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
INSERT INTO `products` VALUES (1,'Jotrón Tinto Roble',1,6,1,2023,'jotron-tinto-roble.jpg','Tinto con cuatro meses en barrica de roble francés, elaborado con tempranillo y syrah de nuestros viñedos.','Rojo picota con ribete violáceo.','Fruta negra madura, regaliz y un fondo tostado suave.','Sabroso, de taninos redondos y final largo.',14.00,16.00,14.00,'4 meses en barrica de roble francés','Crianza corta en barricas de roble francés de segundo uso, con trasiegas cada dos meses para afinar el tanino sin tapar la fruta.','18.000 botellas',850,'Pizarra y arcilla',4500,'Carnes a la brasa, guisos y quesos curados.',0,'2026-01-12 10:00:00'),(2,'Jotrón Moscatel Dulce',1,5,5,2022,'jotron-moscatel-dulce.jpg','Vino dulce natural de moscatel de Alejandría, con la uva asoleada en los paseros de la finca.','Oro viejo, limpio y brillante.','Pasa, miel de azahar y piel de naranja.','Untuoso y fresco, sin llegar a empalagar.',8.00,10.00,15.00,'Sin crianza en madera','Uva asoleada en paseros y fermentación parcial; reposa en depósito de acero inoxidable para conservar el aroma de la moscatel.','6.000 botellas',700,'Pizarra',3000,'Postres de hojaldre, foie y quesos azules.',0,'2026-01-12 10:10:00'),(3,'Pasas de Málaga Jotrón',1,7,7,2025,'pasas-jotron-500g.jpg','Pasas de moscatel secadas al sol en los paseros de la finca y despalilladas a mano.',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'Solas, con queso fresco o en ensaladas.',0,'2026-01-12 10:20:00'),(4,'Tío Pepe Fino',2,1,4,NULL,'tio-pepe-fino.jpg','Fino muy seco de palomino, criado bajo velo de flor en el sistema de criaderas y soleras.','Amarillo pajizo pálido.','Almendra, masa de pan y notas salinas.','Seco, ligero y punzante.',6.00,8.00,15.00,NULL,NULL,NULL,NULL,NULL,NULL,'Jamón ibérico, aceitunas y pescaíto frito.',0,'2026-02-03 09:30:00'),(5,'Solear Manzanilla',3,2,4,NULL,'solear-manzanilla.jpg','Manzanilla criada bajo velo de flor en las bodegas de Sanlúcar de Barrameda.','Amarillo pálido con reflejos verdosos.','Manzanilla de campo, levadura y brisa marina.','Fresca, seca y con un final ligeramente amargo.',6.00,8.00,15.00,NULL,NULL,NULL,NULL,NULL,NULL,'Langostinos, marisco y pescado frito.',0,'2026-02-03 09:40:00'),(6,'Lustau San Emilio Pedro Ximénez',4,1,5,NULL,'lustau-san-emilio-px.jpg','Dulce natural de pedro ximénez con envejecimiento oxidativo en solera.','Caoba muy oscuro, casi opaco.','Higo, dátil, café y cacao.','Denso, muy dulce y largo.',12.00,14.00,17.00,NULL,NULL,NULL,NULL,NULL,NULL,'Helado de vainilla, chocolate negro y quesos azules.',0,'2026-02-03 09:50:00'),(7,'Alvear Fino C.B.',6,3,4,NULL,'alvear-fino-cb.jpg','Fino de pedro ximénez de la Sierra de Montilla, criado bajo velo de flor sin encabezar.','Oro pálido.','Almendra tostada y hierbas secas.','Seco, suave y con buena persistencia.',6.00,8.00,15.00,NULL,NULL,NULL,NULL,NULL,NULL,'Salmorejo, flamenquín y tapas fritas.',0,'2026-02-10 11:00:00'),(8,'Cortijo Los Aguilares Pinot Noir',8,6,1,2022,'aguilares-pinot-noir.jpg','Tinto de pinot noir de la serranía de Ronda, con crianza en barrica de roble francés.','Rojo cereza de capa media.','Frutos rojos, sotobosque y especias dulces.','Elegante, fresco y de tanino fino.',14.00,16.00,14.00,NULL,NULL,NULL,NULL,NULL,NULL,'Atún rojo, setas y carnes de caza.',0,'2026-03-05 12:00:00');
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `shipping_types`
--

LOCK TABLES `shipping_types` WRITE;
/*!40000 ALTER TABLE `shipping_types` DISABLE KEYS */;
INSERT INTO `shipping_types` VALUES (1,'Envío estándar',4.95,3,5,0),(2,'Envío exprés 24 h',9.95,1,1,0),(3,'Recogida en bodega',0.00,NULL,NULL,0),(4,'Envío a Baleares',14.95,4,7,1);
/*!40000 ALTER TABLE `shipping_types` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `tasting_tags`
--

LOCK TABLES `tasting_tags` WRITE;
/*!40000 ALTER TABLE `tasting_tags` DISABLE KEYS */;
INSERT INTO `tasting_tags` VALUES (1,'Afrutado'),(7,'Dulce'),(4,'Especiado'),(2,'Floral'),(9,'Fresco'),(10,'Mineral'),(5,'Salino'),(6,'Seco'),(3,'Tostado'),(8,'Untuoso');
/*!40000 ALTER TABLE `tasting_tags` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `typologies`
--

LOCK TABLES `typologies` WRITE;
/*!40000 ALTER TABLE `typologies` DISABLE KEYS */;
INSERT INTO `typologies` VALUES (1,'Tinto','Vino',1,21.00),(2,'Blanco','Vino',2,21.00),(3,'Rosado','Vino',3,21.00),(4,'Generoso','Vino',4,21.00),(5,'Dulce','Vino',5,21.00),(6,'Espumoso','Vino',6,21.00),(7,'Pasa moscatel','Pasas',7,10.00);
/*!40000 ALTER TABLE `typologies` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Administrador','Demo','1980-01-01','$2b$10$t28pKcetvO1GIX0YQ/fHKuRrA59F3AXF7ekN8ipty3P1.Xndeunci',NULL,'admin@jotron.com',NULL,'Administrador',1,'2026-11-11 09:42:22'),(2,'Editor','Demo','1985-01-01','$2b$10$t5ItwUHQk1iyRGzoqslV1ueH9AdlXRWEPrMuLx4UDerkwFS8JLUj2',NULL,'editor@jotron.com',NULL,'Editor',1,'2026-11-11 09:42:22'),(3,'Cliente','Demo','1990-01-01','$2b$10$nwL9cW1/izmJGn1TIf/1ruOjJEn3HyDJv358MfLKGMJ9vaTlOaaWW',NULL,'user@jotron.com',NULL,'Cliente',1,'2026-11-11 09:42:22'),(4,'Juan','Pérez Moreno','1985-05-15','$2b$12$G5tb4g4xVNyy6RBrIy97J.u/XtofxvaPXhhX2VfTIJJHbRglJsbEe','28764512E','juan.perez@example.com','600123456','Cliente',1,'2026-11-11 09:42:22'),(5,'Ana','Gómez Ruiz','1990-08-20','$2b$12$G5tb4g4xVNyy6RBrIy97J.u/XtofxvaPXhhX2VfTIJJHbRglJsbEe','74851236J','ana.gomez@example.com','600654321','Cliente',1,'2026-11-11 09:42:22'),(6,'Luis','Martínez Soto','1975-12-30','$2b$12$G5tb4g4xVNyy6RBrIy97J.u/XtofxvaPXhhX2VfTIJJHbRglJsbEe','25098734F','luis.martinez@example.com','600987654','Editor',1,'2026-11-11 09:42:22'),(7,'Laura','Torres Gil','1983-11-25','$2b$12$G5tb4g4xVNyy6RBrIy97J.u/XtofxvaPXhhX2VfTIJJHbRglJsbEe','25789456Q','laura.torres@example.com','600333444','Cliente',1,'2026-11-11 09:42:22'),(8,'Pedro','Ramírez Ortiz','1995-07-15','$2b$12$G5tb4g4xVNyy6RBrIy97J.u/XtofxvaPXhhX2VfTIJJHbRglJsbEe','77123987L','pedro.ramirez@example.com','600444555','Cliente',1,'2026-11-11 09:42:22'),(9,'Sofía','López Díaz','1987-09-05','$2b$12$G5tb4g4xVNyy6RBrIy97J.u/XtofxvaPXhhX2VfTIJJHbRglJsbEe','28654321R','sofia.lopez@example.com','600555666','Cliente',1,'2026-11-11 09:42:22'),(10,'Javier','García Luna','1991-04-18','$2b$12$G5tb4g4xVNyy6RBrIy97J.u/XtofxvaPXhhX2VfTIJJHbRglJsbEe','30987654F','javier.garcia@example.com','600666777','Cliente',1,'2026-11-11 09:42:22');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `wineries`
--

LOCK TABLES `wineries` WRITE;
/*!40000 ALTER TABLE `wineries` DISABLE KEYS */;
INSERT INTO `wineries` VALUES (1,'Bodega Pago de Jotrón','Bodega familiar de la Axarquía. Elabora tintos, moscatel y pasas de Málaga en su propia finca.','Camino de los Paseros, s/n, 29000 Málaga','Málaga','Málaga','España','952000000','info@pagodejotron.com','https://www.pagodejotron.com',0),(2,'González Byass','Bodega de Jerez fundada en 1835, conocida por el fino Tío Pepe.',NULL,'Jerez de la Frontera','Cádiz','España',NULL,NULL,NULL,0),(3,'Bodegas Barbadillo','Bodega de Sanlúcar de Barrameda especializada en manzanilla.',NULL,'Sanlúcar de Barrameda','Cádiz','España',NULL,NULL,NULL,0),(4,'Emilio Lustau','Bodega de Jerez con una amplia gama de generosos y dulces.',NULL,'Jerez de la Frontera','Cádiz','España',NULL,NULL,NULL,0),(5,'Bodegas Hidalgo-La Gitana','Bodega familiar de Sanlúcar, elabora la manzanilla La Gitana.',NULL,'Sanlúcar de Barrameda','Cádiz','España',NULL,NULL,NULL,0),(6,'Bodegas Alvear','Bodega de Montilla dedicada a los vinos de pedro ximénez.',NULL,'Montilla','Córdoba','España',NULL,NULL,NULL,0),(7,'Bodegas Toro Albalá',NULL,NULL,'Aguilar de la Frontera','Córdoba','España',NULL,NULL,NULL,1),(8,'Cortijo Los Aguilares','Finca de la serranía de Ronda con tintos de altura.',NULL,'Ronda','Málaga','España',NULL,NULL,NULL,0),(9,'Bodegas Jorge Ordóñez',NULL,NULL,'Vélez-Málaga','Málaga','España',NULL,NULL,NULL,0),(10,'Huerta de Albalá',NULL,NULL,'Arcos de la Frontera','Cádiz','España',NULL,NULL,NULL,0);
/*!40000 ALTER TABLE `wineries` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-11-11  9:42:23
