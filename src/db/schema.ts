import { sql } from 'drizzle-orm';
import { boolean, date, datetime, int, mysqlEnum, mysqlTable, text, varchar, decimal, unique, check, primaryKey } from 'drizzle-orm/mysql-core';

/** Usuarios de la tienda: clientes, editores y administradores (RF1, RF2). */
export const users = mysqlTable('users', {
    id: int('user_id').autoincrement().primaryKey(),
    name: varchar('name', { length: 100 }),
    lastName: varchar('last_name', { length: 100 }),
    birthDate: date('birth_date', { mode: 'string' }).notNull(),
    passwordHash: varchar('password_hash', { length: 255 }).notNull(),
    idCard: varchar('id_card', { length: 20 }).unique(),
    email: varchar('email', { length: 100 }).notNull().unique(),
    phone: varchar('phone', { length: 20 }),
    role: mysqlEnum('role', ['Cliente', 'Editor', 'Administrador']).notNull().default('Cliente'),
    isActive: boolean('is_active').notNull().default(true),
    registrationDate: datetime('registration_date').notNull().default(sql`CURRENT_TIMESTAMP`),
});

/** Direcciones de envío y facturación de cada usuario (RF3). */
export const addresses = mysqlTable('addresses', {
    id: int('address_id').autoincrement().primaryKey(),
    userId: int('user_id').notNull().references(() => users.id, { onUpdate: 'cascade' }),
    phone: varchar('phone', { length: 20 }).notNull(),
    streetType: mysqlEnum('street_type', ['Calle', 'Avenida', 'Plaza', 'Paseo', 'Camino', 'Carretera', 'Ronda', 'Travesía', 'Glorieta', 'Urbanización']).notNull().default('Calle'),
    streetName: varchar('street_name', { length: 100 }).notNull(),
    number: varchar('number', { length: 10 }).notNull(),
    floor: varchar('floor', { length: 20 }), // Ampliación: piso y puerta ("3º B")
    postalCode: varchar('postal_code', { length: 10 }).notNull(),
    city: varchar('city', { length: 100 }).notNull(),
    province: varchar('province', { length: 100 }).notNull(),
    country: varchar('country', { length: 100 }).notNull().default('España'),
    addressType: mysqlEnum('address_type', ['Envío', 'Facturación']).notNull().default('Envío'),
    isActive: boolean('is_active').notNull().default(true),
});

/** Bodegas que elaboran los productos (RF4). Columnas MVP2 opcionales. */
export const wineries = mysqlTable('wineries', {
    id: int('winery_id').autoincrement().primaryKey(),
    name: varchar('name', { length: 100 }).notNull().unique(),
    description: text('description'),
    address: varchar('address', { length: 255 }),
    city: varchar('city', { length: 100 }),
    province: varchar('province', { length: 100 }),
    country: varchar('country', { length: 100 }).notNull().default('España'),
    phone: varchar('phone', { length: 20 }),
    email: varchar('email', { length: 100 }),
    website: varchar('website', { length: 255 }),
    isBlocked: boolean('is_blocked').notNull().default(false),
});

/** Denominaciones de origen y otras garantías de calidad de los productos (RF4, RF5). */
export const guaranteesOfOrigin = mysqlTable('guarantee_of_origin', {
    id: int('guarantee_of_origin_id').autoincrement().primaryKey(),
    name: varchar('name', { length: 100 }).notNull().unique(),
    classification: mysqlEnum('classification', ['DO', 'DOP', 'DOCa', 'IGP', 'VT']).notNull().default('DO'),
    region: varchar('region', { length: 100 }),
    regulatoryCouncil: varchar('regulatory_council', { length: 150 }),
    foundedYear: int('founded_year'),
    website: varchar('website', { length: 255 }),
    description: text('description'),
    isBlocked: boolean('is_blocked').notNull().default(false),
});

/** Familias de producto para los filtros; fijan el IVA (RF4, RF5). */
export const typologies = mysqlTable('typology', {
    id: int('typology_id').autoincrement().primaryKey(),
    name: varchar('name', { length: 50 }).notNull().unique(),
    productType: mysqlEnum('product_type', ['Vino', 'Pasas']).notNull().default('Vino'),
    filterOrder: int('filter_order').notNull().default(0),
    taxRate: decimal('tax_rate', { precision: 5, scale: 2 }).notNull().default('21.00'), // IVA en %: 21 vino, 10 pasas. Lo heredan sus productos
});

/** Estilos concretos del vino: Fino, Manzanilla, Tinto roble... (RF4, RF5). */
export const categories = mysqlTable('category', {
    id: int('category_id').autoincrement().primaryKey(),
    name: varchar('name', { length: 100 }).notNull().unique(),
});

/** Uvas utilizadas en la elaboración de vinos (RF4, RF5). */
export const grapes = mysqlTable('grape', {
    id: int('grape_id').autoincrement().primaryKey(),
    name: varchar('name', { length: 100 }).notNull().unique(),
    color: mysqlEnum('color', ['Tinta', 'Blanca', 'Rosada']).notNull(), // Color de la piel; filtro de la lista de uvas
});

/** Etiquetas de cata de los vinos: Afrutado, Salino... (RF4). */
export const tastingTags = mysqlTable('tasting_tag', {
    id: int('tasting_tag_id').autoincrement().primaryKey(),
    name: varchar('name', { length: 50 }).notNull().unique(),
});

/** Vinos y pasas del catálogo: ficha común a todas sus presentaciones (RF4). */
export const products = mysqlTable('products', {
    id: int('product_id').autoincrement().primaryKey(),
    name: varchar('name', { length: 100 }).notNull(),
    wineryId: int('winery_id').notNull().references(() => wineries.id, { onUpdate: 'cascade' }),
    guaranteeOfOriginId: int('guarantee_of_origin_id').notNull().references(() => guaranteesOfOrigin.id, { onUpdate: 'cascade' }),
    typologyId: int('typology_id').notNull().references(() => typologies.id, { onUpdate: 'cascade' }),
    vintage: int('vintage'),
    image: varchar('image', { length: 255 }),
    description: text('description'),
    visualNote: text('visual_note'),
    aromaNote: text('aroma_note'),
    palateNote: text('palate_note'),
    minTemperature: decimal('min_temperature', { precision: 5, scale: 2 }),
    maxTemperature: decimal('max_temperature', { precision: 5, scale: 2 }),
    alcoholContent: decimal('alcohol_content', { precision: 5, scale: 2 }),
    agingTime: varchar('aging_time', { length: 100 }),
    agingMethod: text('aging_method'),
    production: varchar('production', { length: 50 }),
    vineyardAltitude: int('vineyard_altitude'),
    soilType: varchar('soil_type', { length: 100 }),
    yield: int('yield'),
    foodPairing: text('food_pairing'),
    isBlocked: boolean('is_blocked').notNull().default(false),
    createdAt: datetime('created_at', { mode: 'string' }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (t) => ({
    ckTemp: check('ck_product_temp', sql`${t.minTemperature} <= ${t.maxTemperature}`),
    ckAltitude: check('ck_product_altitude', sql`${t.vineyardAltitude} >= 0`),
    ckYield: check('ck_product_yield', sql`${t.yield} > 0`),
}));

/** Variantes de producto: botella, media botella, caja, racimo... (RF4). */
export const productVariants = mysqlTable('product_variants', {
    id: int('variant_id').autoincrement().primaryKey(),
    productId: int('product_id').notNull().references(() => products.id, { onUpdate: 'cascade' }),
    format: varchar('format', { length: 50 }).notNull(), // Botella, Media botella, Mágnum, Caja, Racimo
    capacity: int('capacity').notNull(), // En mililitros o gramos según capacityUnit
    capacityUnit: mysqlEnum('capacity_unit', ['ml', 'g']).notNull().default('ml'),
    price: decimal('price', { precision: 10, scale: 2 }).notNull(),
    stock: int('stock').notNull().default(0),
    isBlocked: boolean('is_blocked').notNull().default(false),
}, (t) => ({
    uqFormat: unique('uq_variant_format').on(t.productId, t.format, t.capacity),
    ckCapacity: check('ck_variant_capacity', sql`${t.capacity} > 0`),
    ckPrice: check('ck_variant_price', sql`${t.price} >= 0`),
    ckStock: check('ck_variant_stock', sql`${t.stock} >= 0`),
}));

/** Pasos para la elaboración del producto (RF4). */
export const productSteps = mysqlTable('product_steps', {
    id: int('step_id').autoincrement().primaryKey(),
    productId: int('product_id').notNull().references(() => products.id, { onUpdate: 'cascade', onDelete: 'cascade' }),
    position: int('position').notNull(),
    title: varchar('title', { length: 100 }).notNull(),
    description: text('description'),
}, (t) => ({
    uqPosition: unique('uq_step_position').on(t.productId, t.position),
}));

/** Relación muchos a muchos entre productos y categorías (RF4). */
export const productCategories = mysqlTable('product_categories', {
    productId: int('product_id').notNull().references(() => products.id, { onUpdate: 'cascade', onDelete: 'cascade' }),
    categoryId: int('category_id').notNull().references(() => categories.id, { onUpdate: 'cascade', onDelete: 'cascade' }),
}, (t) => ({
    pkProductCategory: primaryKey({ columns: [t.productId, t.categoryId] }),
}));

/** Relación muchos a muchos entre productos y uvas (RF4). */
export const productGrapes = mysqlTable('product_grapes', {
    productId: int('product_id').notNull().references(() => products.id, { onUpdate: 'cascade', onDelete: 'cascade' }),
    grapeId: int('grape_id').notNull().references(() => grapes.id, { onUpdate: 'cascade', onDelete: 'cascade' }),
    percentage: decimal('percentage', { precision: 5, scale: 2 }),
}, (t) => ({
    pkProductGrape: primaryKey({ columns: [t.productId, t.grapeId] }),
    ckPercentage: check('ck_grape_percentage', sql`${t.percentage} > 0 AND ${t.percentage} <= 100`),
}));

/** Relación muchos a muchos entre productos y etiquetas de cata (RF4). */
export const productTastingTags = mysqlTable('product_tasting_tags', {
    productId: int('product_id').notNull().references(() => products.id, { onUpdate: 'cascade', onDelete: 'cascade' }),
    tastingTagId: int('tasting_tag_id').notNull().references(() => tastingTags.id, { onUpdate: 'cascade', onDelete: 'cascade' }),
}, (t) => ({
    pkProductTastingTag: primaryKey({ columns: [t.productId, t.tastingTagId] }),
}));