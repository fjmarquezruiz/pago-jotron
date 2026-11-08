import { sql } from 'drizzle-orm';
import { boolean, date, datetime, int, mysqlEnum, mysqlTable, varchar } from 'drizzle-orm/mysql-core';

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