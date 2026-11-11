import bcrypt from 'bcryptjs';
import { db, pool } from './index';
import {
    cancellationTypes,
    orderStatuses,
    shippingTypes,
    typologies,
    users,
    wineries,
    guaranteesOfOrigin,
    tastingTags,
    grapes,
    categories,
    products,
    productVariants,
    productCategories,
    productGrapes,
    productTastingTags,
} from './schema';

/** Carga los datos iniciales y las cuentas demo en una BD vacía. */
async function main() {
    const existing = await db.select().from(users).limit(1);
    if (existing.length > 0) {
        console.log('La BD ya tiene datos; el seed es para una BD vacía.');
        return;
    }

    // Estados del pedido(RF8)
    await db
        .insert(orderStatuses)
        .values([
            { name: 'Pendiente de pago' },
            { name: 'Confirmado' },
            { name: 'En proceso' },
            { name: 'Preparado' },
            { name: 'Enviado' },
            { name: 'Entregado' },
            { name: 'Anulado' },
            { name: 'Bloqueado' },
        ]);

    // Motivos de anulación
    await db
        .insert(cancellationTypes)
        .values([
            { description: 'El cliente decidió cancelar el pedido antes de que se enviara.' },
            { description: 'Pedido duplicado por error.' },
            { description: 'El cliente se arrepintió de la compra.' },
            { description: 'Error en la dirección de envío proporcionada.' },
            { description: 'No se recibió la transferencia en el plazo indicado.' },
        ]);

    // Tipos de envío
    await db.insert(shippingTypes).values([
        {
            name: 'Envío estándar',
            cost: '4.95',
            minDeliveryDays: 3,
            maxDeliveryDays: 5,
            isBlocked: false,
        },
        {
            name: 'Envío exprés 24 h',
            cost: '9.95',
            minDeliveryDays: 1,
            maxDeliveryDays: 1,
            isBlocked: false,
        },
        {
            name: 'Recogida en bodega',
            cost: '0.00',
            minDeliveryDays: null,
            maxDeliveryDays: null,
            isBlocked: false,
        },
        {
            name: 'Envío a Baleares',
            cost: '14.95',
            minDeliveryDays: 4,
            maxDeliveryDays: 7,
            isBlocked: true,
        },
    ]);

    // Tipologías de producto
    await db.insert(typologies).values([
        { name: 'Tinto', productType: 'Vino', filterOrder: 1, taxRate: '21.00' },
        { name: 'Blanco', productType: 'Vino', filterOrder: 2, taxRate: '21.00' },
        { name: 'Rosado', productType: 'Vino', filterOrder: 3, taxRate: '21.00' },
        { name: 'Generoso', productType: 'Vino', filterOrder: 4, taxRate: '21.00' },
        { name: 'Dulce', productType: 'Vino', filterOrder: 5, taxRate: '21.00' },
        { name: 'Espumoso', productType: 'Vino', filterOrder: 6, taxRate: '21.00' },
        { name: 'Pasa moscatel', productType: 'Pasas', filterOrder: 7, taxRate: '10.00' },
    ]);

    // Cuentas demo (las que aparecen en la guía de uso y en README.txt)
    const [adminHash, editorHash, userHash] = await Promise.all([
        bcrypt.hash('Admin1234', 10),
        bcrypt.hash('Editor1234', 10),
        bcrypt.hash('Cliente1234', 10),
    ]);

    await db.insert(users).values([
        {
            name: 'Administrador',
            lastName: 'Demo',
            birthDate: '1980-01-01',
            passwordHash: adminHash,
            email: 'admin@jotron.com',
            role: 'Administrador',
        },
        {
            name: 'Editor',
            lastName: 'Demo',
            birthDate: '1985-01-01',
            passwordHash: editorHash,
            email: 'editor@jotron.com',
            role: 'Editor',
        },
        {
            name: 'Cliente',
            lastName: 'Demo',
            birthDate: '1990-01-01',
            passwordHash: userHash,
            email: 'user@jotron.com',
            role: 'Cliente',
        },
    ]);

    // Clientes de ejemplo para pedidos y pruebas (contraseña Demo1234!)
    const passwordHash = await bcrypt.hash('Demo1234!', 12);
    await db.insert(users).values([
        {
            name: 'Juan',
            lastName: 'Pérez Moreno',
            birthDate: '1985-05-15',
            passwordHash,
            idCard: '28764512E',
            email: 'juan.perez@example.com',
            phone: '600123456',
            role: 'Cliente',
            isActive: true,
        },
        {
            name: 'Ana',
            lastName: 'Gómez Ruiz',
            birthDate: '1990-08-20',
            passwordHash,
            idCard: '74851236J',
            email: 'ana.gomez@example.com',
            phone: '600654321',
            role: 'Cliente',
            isActive: true,
        },
        {
            name: 'Luis',
            lastName: 'Martínez Soto',
            birthDate: '1975-12-30',
            passwordHash,
            idCard: '25098734F',
            email: 'luis.martinez@example.com',
            phone: '600987654',
            role: 'Editor',
            isActive: true,
        },
        {
            name: 'Laura',
            lastName: 'Torres Gil',
            birthDate: '1983-11-25',
            passwordHash,
            idCard: '25789456Q',
            email: 'laura.torres@example.com',
            phone: '600333444',
            role: 'Cliente',
            isActive: true,
        },
        {
            name: 'Pedro',
            lastName: 'Ramírez Ortiz',
            birthDate: '1995-07-15',
            passwordHash,
            idCard: '77123987L',
            email: 'pedro.ramirez@example.com',
            phone: '600444555',
            role: 'Cliente',
            isActive: true,
        },
        {
            name: 'Sofía',
            lastName: 'López Díaz',
            birthDate: '1987-09-05',
            passwordHash,
            idCard: '28654321R',
            email: 'sofia.lopez@example.com',
            phone: '600555666',
            role: 'Cliente',
            isActive: true,
        },
        {
            name: 'Javier',
            lastName: 'García Luna',
            birthDate: '1991-04-18',
            passwordHash,
            idCard: '30987654F',
            email: 'javier.garcia@example.com',
            phone: '600666777',
            role: 'Cliente',
            isActive: true,
        },
    ]);

    // Bodegas andaluzas(Toro Albalá está bloqueada)
    await db.insert(wineries).values([
        {
            name: 'Bodega Pago de Jotrón',
            description:
                'Bodega familiar de la Axarquía. Elabora tintos, moscatel y pasas de Málaga en su propia finca.',
            address: 'Camino de los Paseros, s/n, 29000 Málaga',
            city: 'Málaga',
            province: 'Málaga',
            country: 'España',
            phone: '952000000',
            email: 'info@pagodejotron.com',
            website: 'https://www.pagodejotron.com',
            isBlocked: false,
        },
        {
            name: 'González Byass',
            description: 'Bodega de Jerez fundada en 1835, conocida por el fino Tío Pepe.',
            address: null,
            city: 'Jerez de la Frontera',
            province: 'Cádiz',
            country: 'España',
            phone: null,
            email: null,
            website: null,
            isBlocked: false,
        },
        {
            name: 'Bodegas Barbadillo',
            description: 'Bodega de Sanlúcar de Barrameda especializada en manzanilla.',
            address: null,
            city: 'Sanlúcar de Barrameda',
            province: 'Cádiz',
            country: 'España',
            phone: null,
            email: null,
            website: null,
            isBlocked: false,
        },
        {
            name: 'Emilio Lustau',
            description: 'Bodega de Jerez con una amplia gama de generosos y dulces.',
            address: null,
            city: 'Jerez de la Frontera',
            province: 'Cádiz',
            country: 'España',
            phone: null,
            email: null,
            website: null,
            isBlocked: false,
        },
        {
            name: 'Bodegas Hidalgo-La Gitana',
            description: 'Bodega familiar de Sanlúcar, elabora la manzanilla La Gitana.',
            address: null,
            city: 'Sanlúcar de Barrameda',
            province: 'Cádiz',
            country: 'España',
            phone: null,
            email: null,
            website: null,
            isBlocked: false,
        },
        {
            name: 'Bodegas Alvear',
            description: 'Bodega de Montilla dedicada a los vinos de pedro ximénez.',
            address: null,
            city: 'Montilla',
            province: 'Córdoba',
            country: 'España',
            phone: null,
            email: null,
            website: null,
            isBlocked: false,
        },
        {
            name: 'Bodegas Toro Albalá',
            description: null,
            address: null,
            city: 'Aguilar de la Frontera',
            province: 'Córdoba',
            country: 'España',
            phone: null,
            email: null,
            website: null,
            isBlocked: true,
        },
        {
            name: 'Cortijo Los Aguilares',
            description: 'Finca de la serranía de Ronda con tintos de altura.',
            address: null,
            city: 'Ronda',
            province: 'Málaga',
            country: 'España',
            phone: null,
            email: null,
            website: null,
            isBlocked: false,
        },
        {
            name: 'Bodegas Jorge Ordóñez',
            description: null,
            address: null,
            city: 'Vélez-Málaga',
            province: 'Málaga',
            country: 'España',
            phone: null,
            email: null,
            website: null,
            isBlocked: false,
        },
        {
            name: 'Huerta de Albalá',
            description: null,
            address: null,
            city: 'Arcos de la Frontera',
            province: 'Cádiz',
            country: 'España',
            phone: null,
            email: null,
            website: null,
            isBlocked: false,
        },
    ]);

    // Denominaciones de origen de Andalucía
    await db.insert(guaranteesOfOrigin).values([
        {
            name: 'Jerez-Xérès-Sherry',
            classification: 'DO',
            region: 'Marco de Jerez (Cádiz)',
            regulatoryCouncil: 'Consejo Regulador de Jerez-Xérès-Sherry y Manzanilla-Sanlúcar',
            foundedYear: 1933,
            website: 'https://www.sherry.wine',
            description:
                'Vinos generosos criados en el Marco de Jerez por el sistema de criaderas y soleras.',
            isBlocked: false,
        },
        {
            name: 'Manzanilla-Sanlúcar de Barrameda',
            classification: 'DO',
            region: 'Sanlúcar de Barrameda (Cádiz)',
            regulatoryCouncil: 'Consejo Regulador de Jerez-Xérès-Sherry y Manzanilla-Sanlúcar',
            foundedYear: null,
            website: 'https://www.sherry.wine',
            description: 'Manzanilla criada bajo velo de flor en Sanlúcar de Barrameda.',
            isBlocked: false,
        },
        {
            name: 'Montilla-Moriles',
            classification: 'DO',
            region: 'Sur de Córdoba',
            regulatoryCouncil: 'Consejo Regulador de Montilla-Moriles',
            foundedYear: null,
            website: null,
            description:
                'Finos, amontillados y dulces de pedro ximénez del sur de Córdoba, casi siempre sin encabezar.',
            isBlocked: false,
        },
        {
            name: 'Condado de Huelva',
            classification: 'DO',
            region: 'Huelva',
            regulatoryCouncil: 'Consejo Regulador del Condado de Huelva',
            foundedYear: null,
            website: null,
            description: null,
            isBlocked: false,
        },
        {
            name: 'Málaga',
            classification: 'DO',
            region: 'Málaga',
            regulatoryCouncil: 'Consejo Regulador de Málaga, Sierras de Málaga y Pasas de Málaga',
            foundedYear: 1933,
            website: null,
            description: 'Vinos dulces y licorosos de moscatel y pedro ximénez.',
            isBlocked: false,
        },
        {
            name: 'Sierras de Málaga',
            classification: 'DO',
            region: 'Málaga',
            regulatoryCouncil: 'Consejo Regulador de Málaga, Sierras de Málaga y Pasas de Málaga',
            foundedYear: null,
            website: null,
            description: 'Vinos tranquilos (blancos, rosados y tintos) de la provincia de Málaga.',
            isBlocked: false,
        },
        {
            name: 'Pasas de Málaga',
            classification: 'DOP',
            region: 'Axarquía y Manilva (Málaga)',
            regulatoryCouncil: 'Consejo Regulador de Málaga, Sierras de Málaga y Pasas de Málaga',
            foundedYear: null,
            website: null,
            description: 'Pasas de moscatel de Alejandría secadas al sol en paseros.',
            isBlocked: false,
        },
        {
            name: 'Granada',
            classification: 'DO',
            region: 'Granada',
            regulatoryCouncil: 'Consejo Regulador de Granada',
            foundedYear: null,
            website: null,
            description: null,
            isBlocked: false,
        },
        {
            name: 'Lebrija',
            classification: 'DO',
            region: 'Sevilla',
            regulatoryCouncil: 'Consejo Regulador de Lebrija',
            foundedYear: null,
            website: null,
            description: null,
            isBlocked: false,
        },
        {
            name: 'Cádiz',
            classification: 'VT',
            region: 'Cádiz',
            regulatoryCouncil: null,
            foundedYear: null,
            website: null,
            description: null,
            isBlocked: false,
        },
    ]);

    // Categorías de vino(estilo concreto; la familia va en Typology)
    await db
        .insert(categories)
        .values([
            { name: 'Tinto roble' },
            { name: 'Tinto crianza' },
            { name: 'Blanco seco' },
            { name: 'Rosado' },
            { name: 'Fino' },
            { name: 'Manzanilla' },
            { name: 'Amontillado' },
            { name: 'Oloroso' },
            { name: 'Pedro Ximénez' },
            { name: 'Moscatel dulce' },
        ]);

    // Variedades de uva
    await db.insert(grapes).values([
        { name: 'Tempranillo', color: 'Tinta' },
        { name: 'Syrah', color: 'Tinta' },
        { name: 'Moscatel de Alejandría', color: 'Blanca' },
        { name: 'Palomino Fino', color: 'Blanca' },
        { name: 'Pedro Ximénez', color: 'Blanca' },
        { name: 'Pinot Noir', color: 'Tinta' },
        { name: 'Petit Verdot', color: 'Tinta' },
        { name: 'Merlot', color: 'Tinta' },
        { name: 'Cabernet Sauvignon', color: 'Tinta' },
        { name: 'Zalema', color: 'Blanca' },
    ]);

    // Etiquetas de cata
    await db
        .insert(tastingTags)
        .values([
            { name: 'Afrutado' },
            { name: 'Floral' },
            { name: 'Tostado' },
            { name: 'Especiado' },
            { name: 'Salino' },
            { name: 'Seco' },
            { name: 'Dulce' },
            { name: 'Untuoso' },
            { name: 'Fresco' },
            { name: 'Mineral' },
        ]);

    // Productos: vinos andaluces y pasas de Málaga (las presentaciones van en ProductVariant)
    // Ids por nombre: así no dependo del orden de inserción
    const wineryId = Object.fromEntries(
        (await db.select().from(wineries)).map((r) => [r.name, r.id]),
    );
    const doId = Object.fromEntries(
        (await db.select().from(guaranteesOfOrigin)).map((r) => [r.name, r.id]),
    );
    const typologyId = Object.fromEntries(
        (await db.select().from(typologies)).map((r) => [r.name, r.id]),
    );

    // Productos: vinos andaluces y pasas de Málaga (las presentaciones van en productVariants)
    await db.insert(products).values([
        {
            name: 'Jotrón Tinto Roble',
            wineryId: wineryId['Bodega Pago de Jotrón'],
            guaranteeOfOriginId: doId['Sierras de Málaga'],
            typologyId: typologyId['Tinto'],
            vintage: 2023,
            image: 'jotron-tinto-roble.jpg',
            description:
                'Tinto con cuatro meses en barrica de roble francés, elaborado con tempranillo y syrah de nuestros viñedos.',
            visualNote: 'Rojo picota con ribete violáceo.',
            aromaNote: 'Fruta negra madura, regaliz y un fondo tostado suave.',
            palateNote: 'Sabroso, de taninos redondos y final largo.',
            minTemperature: '14.00',
            maxTemperature: '16.00',
            alcoholContent: '14.00',
            foodPairing: 'Carnes a la brasa, guisos y quesos curados.',
            createdAt: '2026-01-12 10:00:00',
            agingTime: '4 meses en barrica de roble francés',
            agingMethod:
                'Crianza corta en barricas de roble francés de segundo uso, con trasiegas cada dos meses para afinar el tanino sin tapar la fruta.',
            production: '18.000 botellas',
            vineyardAltitude: 850,
            soilType: 'Pizarra y arcilla',
            yield: 4500,
        },
        {
            name: 'Jotrón Moscatel Dulce',
            wineryId: wineryId['Bodega Pago de Jotrón'],
            guaranteeOfOriginId: doId['Málaga'],
            typologyId: typologyId['Dulce'],
            vintage: 2022,
            image: 'jotron-moscatel-dulce.jpg',
            description:
                'Vino dulce natural de moscatel de Alejandría, con la uva asoleada en los paseros de la finca.',
            visualNote: 'Oro viejo, limpio y brillante.',
            aromaNote: 'Pasa, miel de azahar y piel de naranja.',
            palateNote: 'Untuoso y fresco, sin llegar a empalagar.',
            minTemperature: '8.00',
            maxTemperature: '10.00',
            alcoholContent: '15.00',
            foodPairing: 'Postres de hojaldre, foie y quesos azules.',
            createdAt: '2026-01-12 10:10:00',
            agingTime: 'Sin crianza en madera',
            agingMethod:
                'Uva asoleada en paseros y fermentación parcial; reposa en depósito de acero inoxidable para conservar el aroma de la moscatel.',
            production: '6.000 botellas',
            vineyardAltitude: 700,
            soilType: 'Pizarra',
            yield: 3000,
        },
        {
            name: 'Pasas de Málaga Jotrón',
            wineryId: wineryId['Bodega Pago de Jotrón'],
            guaranteeOfOriginId: doId['Pasas de Málaga'],
            typologyId: typologyId['Pasa moscatel'],
            vintage: 2025,
            image: 'pasas-jotron-500g.jpg',
            description:
                'Pasas de moscatel secadas al sol en los paseros de la finca y despalilladas a mano.',
            foodPairing: 'Solas, con queso fresco o en ensaladas.',
            createdAt: '2026-01-12 10:20:00',
        },
        {
            name: 'Tío Pepe Fino',
            wineryId: wineryId['González Byass'],
            guaranteeOfOriginId: doId['Jerez-Xérès-Sherry'],
            typologyId: typologyId['Generoso'],
            image: 'tio-pepe-fino.jpg',
            description:
                'Fino muy seco de palomino, criado bajo velo de flor en el sistema de criaderas y soleras.',
            visualNote: 'Amarillo pajizo pálido.',
            aromaNote: 'Almendra, masa de pan y notas salinas.',
            palateNote: 'Seco, ligero y punzante.',
            minTemperature: '6.00',
            maxTemperature: '8.00',
            alcoholContent: '15.00',
            foodPairing: 'Jamón ibérico, aceitunas y pescaíto frito.',
            createdAt: '2026-02-03 09:30:00',
        },
        {
            name: 'Solear Manzanilla',
            wineryId: wineryId['Bodegas Barbadillo'],
            guaranteeOfOriginId: doId['Manzanilla-Sanlúcar de Barrameda'],
            typologyId: typologyId['Generoso'],
            image: 'solear-manzanilla.jpg',
            description:
                'Manzanilla criada bajo velo de flor en las bodegas de Sanlúcar de Barrameda.',
            visualNote: 'Amarillo pálido con reflejos verdosos.',
            aromaNote: 'Manzanilla de campo, levadura y brisa marina.',
            palateNote: 'Fresca, seca y con un final ligeramente amargo.',
            minTemperature: '6.00',
            maxTemperature: '8.00',
            alcoholContent: '15.00',
            foodPairing: 'Langostinos, marisco y pescado frito.',
            createdAt: '2026-02-03 09:40:00',
        },
        {
            name: 'Lustau San Emilio Pedro Ximénez',
            wineryId: wineryId['Emilio Lustau'],
            guaranteeOfOriginId: doId['Jerez-Xérès-Sherry'],
            typologyId: typologyId['Dulce'],
            image: 'lustau-san-emilio-px.jpg',
            description: 'Dulce natural de pedro ximénez con envejecimiento oxidativo en solera.',
            visualNote: 'Caoba muy oscuro, casi opaco.',
            aromaNote: 'Higo, dátil, café y cacao.',
            palateNote: 'Denso, muy dulce y largo.',
            minTemperature: '12.00',
            maxTemperature: '14.00',
            alcoholContent: '17.00',
            foodPairing: 'Helado de vainilla, chocolate negro y quesos azules.',
            createdAt: '2026-02-03 09:50:00',
        },
        {
            name: 'Alvear Fino C.B.',
            wineryId: wineryId['Bodegas Alvear'],
            guaranteeOfOriginId: doId['Montilla-Moriles'],
            typologyId: typologyId['Generoso'],
            image: 'alvear-fino-cb.jpg',
            description:
                'Fino de pedro ximénez de la Sierra de Montilla, criado bajo velo de flor sin encabezar.',
            visualNote: 'Oro pálido.',
            aromaNote: 'Almendra tostada y hierbas secas.',
            palateNote: 'Seco, suave y con buena persistencia.',
            minTemperature: '6.00',
            maxTemperature: '8.00',
            alcoholContent: '15.00',
            foodPairing: 'Salmorejo, flamenquín y tapas fritas.',
            createdAt: '2026-02-10 11:00:00',
        },
        {
            name: 'Cortijo Los Aguilares Pinot Noir',
            wineryId: wineryId['Cortijo Los Aguilares'],
            guaranteeOfOriginId: doId['Sierras de Málaga'],
            typologyId: typologyId['Tinto'],
            vintage: 2022,
            image: 'aguilares-pinot-noir.jpg',
            description:
                'Tinto de pinot noir de la serranía de Ronda, con crianza en barrica de roble francés.',
            visualNote: 'Rojo cereza de capa media.',
            aromaNote: 'Frutos rojos, sotobosque y especias dulces.',
            palateNote: 'Elegante, fresco y de tanino fino.',
            minTemperature: '14.00',
            maxTemperature: '16.00',
            alcoholContent: '14.00',
            foodPairing: 'Atún rojo, setas y carnes de caza.',
            createdAt: '2026-03-05 12:00:00',
        },
    ]);

    // Presentaciones: cada formato tiene su precio y su stock.
    const productId = Object.fromEntries(
        (await db.select().from(products)).map((r) => [r.name, r.id]),
    );
    await db.insert(productVariants).values([
        {
            productId: productId['Jotrón Tinto Roble'],
            format: 'Botella',
            capacity: 750,
            capacityUnit: 'ml',
            price: '9.50',
            stock: 120,
            isBlocked: false,
        },
        {
            productId: productId['Jotrón Moscatel Dulce'],
            format: 'Botella',
            capacity: 500,
            capacityUnit: 'ml',
            price: '14.00',
            stock: 60,
            isBlocked: false,
        },
        {
            productId: productId['Pasas de Málaga Jotrón'],
            format: 'Caja',
            capacity: 500,
            capacityUnit: 'g',
            price: '7.50',
            stock: 200,
            isBlocked: false,
        },
        {
            productId: productId['Pasas de Málaga Jotrón'],
            format: 'Caja',
            capacity: 1000,
            capacityUnit: 'g',
            price: '13.50',
            stock: 150,
            isBlocked: false,
        },
        {
            productId: productId['Tío Pepe Fino'],
            format: 'Botella',
            capacity: 750,
            capacityUnit: 'ml',
            price: '11.95',
            stock: 48,
            isBlocked: false,
        },
        {
            productId: productId['Solear Manzanilla'],
            format: 'Botella',
            capacity: 750,
            capacityUnit: 'ml',
            price: '9.90',
            stock: 60,
            isBlocked: false,
        },
        {
            productId: productId['Lustau San Emilio Pedro Ximénez'],
            format: 'Botella',
            capacity: 750,
            capacityUnit: 'ml',
            price: '22.50',
            stock: 24,
            isBlocked: false,
        },
        {
            productId: productId['Alvear Fino C.B.'],
            format: 'Botella',
            capacity: 750,
            capacityUnit: 'ml',
            price: '9.20',
            stock: 36,
            isBlocked: false,
        },
        {
            productId: productId['Cortijo Los Aguilares Pinot Noir'],
            format: 'Botella',
            capacity: 750,
            capacityUnit: 'ml',
            price: '24.00',
            stock: 18,
            isBlocked: false,
        },
    ]);

    const categoryId = Object.fromEntries(
        (await db.select().from(categories)).map((r) => [r.name, r.id]),
    );
    const grapeId = Object.fromEntries((await db.select().from(grapes)).map((r) => [r.name, r.id]));
    const tagId = Object.fromEntries(
        (await db.select().from(tastingTags)).map((r) => [r.name, r.id]),
    );

    // Estilo de cada vino (las pasas no llevan categoría)
    await db.insert(productCategories).values([
        { productId: productId['Jotrón Tinto Roble'], categoryId: categoryId['Tinto roble'] },
        { productId: productId['Jotrón Moscatel Dulce'], categoryId: categoryId['Moscatel dulce'] },
        { productId: productId['Tío Pepe Fino'], categoryId: categoryId['Fino'] },
        { productId: productId['Solear Manzanilla'], categoryId: categoryId['Manzanilla'] },
        {
            productId: productId['Lustau San Emilio Pedro Ximénez'],
            categoryId: categoryId['Pedro Ximénez'],
        },
        { productId: productId['Alvear Fino C.B.'], categoryId: categoryId['Fino'] },
        {
            productId: productId['Cortijo Los Aguilares Pinot Noir'],
            categoryId: categoryId['Tinto crianza'],
        },
    ]);

    // Uvas de cada producto, con su porcentaje
    await db.insert(productGrapes).values([
        {
            productId: productId['Jotrón Tinto Roble'],
            grapeId: grapeId['Tempranillo'],
            percentage: '70.00',
        },
        {
            productId: productId['Jotrón Tinto Roble'],
            grapeId: grapeId['Syrah'],
            percentage: '30.00',
        },
        {
            productId: productId['Jotrón Moscatel Dulce'],
            grapeId: grapeId['Moscatel de Alejandría'],
            percentage: '100.00',
        },
        {
            productId: productId['Pasas de Málaga Jotrón'],
            grapeId: grapeId['Moscatel de Alejandría'],
            percentage: '100.00',
        },
        {
            productId: productId['Tío Pepe Fino'],
            grapeId: grapeId['Palomino Fino'],
            percentage: '100.00',
        },
        {
            productId: productId['Solear Manzanilla'],
            grapeId: grapeId['Palomino Fino'],
            percentage: '100.00',
        },
        {
            productId: productId['Lustau San Emilio Pedro Ximénez'],
            grapeId: grapeId['Pedro Ximénez'],
            percentage: '100.00',
        },
        {
            productId: productId['Alvear Fino C.B.'],
            grapeId: grapeId['Pedro Ximénez'],
            percentage: '100.00',
        },
        {
            productId: productId['Cortijo Los Aguilares Pinot Noir'],
            grapeId: grapeId['Pinot Noir'],
            percentage: '100.00',
        },
    ]);

    // Etiquetas de cata
    await db.insert(productTastingTags).values([
        { productId: productId['Jotrón Tinto Roble'], tastingTagId: tagId['Afrutado'] },
        { productId: productId['Jotrón Tinto Roble'], tastingTagId: tagId['Tostado'] },
        { productId: productId['Jotrón Moscatel Dulce'], tastingTagId: tagId['Floral'] },
        { productId: productId['Jotrón Moscatel Dulce'], tastingTagId: tagId['Dulce'] },
        { productId: productId['Pasas de Málaga Jotrón'], tastingTagId: tagId['Dulce'] },
        { productId: productId['Tío Pepe Fino'], tastingTagId: tagId['Salino'] },
        { productId: productId['Solear Manzanilla'], tastingTagId: tagId['Salino'] },
        { productId: productId['Lustau San Emilio Pedro Ximénez'], tastingTagId: tagId['Dulce'] },
        { productId: productId['Alvear Fino C.B.'], tastingTagId: tagId['Salino'] },
        {
            productId: productId['Cortijo Los Aguilares Pinot Noir'],
            tastingTagId: tagId['Tostado'],
        },
    ]);

    console.log('Seed completado');
}

main()
    .catch((e) => {
        console.error(e);
        process.exitCode = 1;
    })
    .finally(() => pool.end());
