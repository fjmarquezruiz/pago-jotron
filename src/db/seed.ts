import bcrypt from 'bcryptjs';
import { db, pool } from './index';
import { cancellationTypes, orderStatuses, shippingTypes, typologies, users } from './schema';

/** Carga los datos iniciales y las cuentas demo en una BD vacía. */
async function main() {
    const existing = await db.select().from(users).limit(1);
    if (existing.length > 0) {
        console.log('La BD ya tiene datos; el seed es para una BD vacía.');
        return;
    }

    // Estados del pedido(RF8)
    await db.insert(orderStatuses).values([
        { name: 'Pendiente de pago' },
        { name: 'Confirmado' },
        { name: 'En proceso' },
        { name: 'Preparado' },
        { name: 'Enviado' },
        { name: 'Entregado' },
        { name: 'Anulado' },
        { name: 'Bloqueado' },
    ]).execute();

    // Motivos de anulación
    await db.insert(cancellationTypes).values([
        { description: 'El cliente decidió cancelar el pedido antes de que se enviara.' },
        { description: 'Pedido duplicado por error.' },
        { description: 'El cliente se arrepintió de la compra.' },
        { description: 'Error en la dirección de envío proporcionada.' },
        { description: 'No se recibió la transferencia en el plazo indicado.' },
    ]).execute();

    // Tipos de envío
    await db.insert(shippingTypes).values([
        { name: 'Envío estándar', cost: '4.95', minDeliveryDays: 3, maxDeliveryDays: 5, isBlocked: false },
        { name: 'Envío exprés 24 h', cost: '9.95', minDeliveryDays: 1, maxDeliveryDays: 1, isBlocked: false },
        { name: 'Recogida en bodega', cost: '0.00', minDeliveryDays: null, maxDeliveryDays: null, isBlocked: false },
        { name: 'Envío a Baleares', cost: '14.95', minDeliveryDays: 4, maxDeliveryDays: 7, isBlocked: true },
    ]).execute();

    // Tipologías de producto
    await db.insert(typologies).values([
        { name: 'Tinto', productType: 'Vino', filterOrder: 1, taxRate: '21.00' },
        { name: 'Blanco', productType: 'Vino', filterOrder: 2, taxRate: '21.00' },
        { name: 'Rosado', productType: 'Vino', filterOrder: 3, taxRate: '21.00' },
        { name: 'Generoso', productType: 'Vino', filterOrder: 4, taxRate: '21.00' },
        { name: 'Dulce', productType: 'Vino', filterOrder: 5, taxRate: '21.00' },
        { name: 'Espumoso', productType: 'Vino', filterOrder: 6, taxRate: '21.00' },
        { name: 'Pasa moscatel', productType: 'Pasas', filterOrder: 7, taxRate: '10.00' },
    ]).execute();

    // Cuentas demo (las que aparecen en la guía de uso y en README.txt)
    const [adminHash, editorHash, userHash] = await Promise.all([
        bcrypt.hash('admin123', 10),
        bcrypt.hash('editor123', 10),
        bcrypt.hash('user1234', 10),
    ]);

    await db.insert(users).values([
        { name: 'Administrador', lastName: 'Demo', birthDate: '1980-01-01', passwordHash: adminHash, email: 'admin@jotron.com', role: 'Administrador' },
        { name: 'Editor', lastName: 'Demo', birthDate: '1985-01-01', passwordHash: editorHash, email: 'editor@jotron.com', role: 'Editor' },
        { name: 'Cliente', lastName: 'Demo', birthDate: '1990-01-01', passwordHash: userHash, email: 'user@jotron.com', role: 'Cliente' },
    ]);

    // Clientes de ejemplo para pedidos y pruebas (contraseña Demo1234!)
    const passwordHash = await bcrypt.hash('Demo1234!', 12);
    await db.insert(users).values([
        { name: 'Juan', lastName: 'Pérez Moreno', birthDate: '1985-05-15', passwordHash, idCard: '28764512E', email: 'juan.perez@example.com', phone: '600123456', role: 'Cliente', isActive: true },
        { name: 'Ana', lastName: 'Gómez Ruiz', birthDate: '1990-08-20', passwordHash, idCard: '74851236J', email: 'ana.gomez@example.com', phone: '600654321', role: 'Cliente', isActive: true },
        { name: 'Luis', lastName: 'Martínez Soto', birthDate: '1975-12-30', passwordHash, idCard: '25098734F', email: 'luis.martinez@example.com', phone: '600987654', role: 'Editor', isActive: true },
        { name: 'Laura', lastName: 'Torres Gil', birthDate: '1983-11-25', passwordHash, idCard: '25789456Q', email: 'laura.torres@example.com', phone: '600333444', role: 'Cliente', isActive: true },
        { name: 'Pedro', lastName: 'Ramírez Ortiz', birthDate: '1995-07-15', passwordHash, idCard: '77123987L', email: 'pedro.ramirez@example.com', phone: '600444555', role: 'Cliente', isActive: true },
        { name: 'Sofía', lastName: 'López Díaz', birthDate: '1987-09-05', passwordHash, idCard: '28654321R', email: 'sofia.lopez@example.com', phone: '600555666', role: 'Cliente', isActive: true },
        { name: 'Javier', lastName: 'García Luna', birthDate: '1991-04-18', passwordHash, idCard: '30987654F', email: 'javier.garcia@example.com', phone: '600666777', role: 'Cliente', isActive: true }
    ]).execute();

    console.log('Seed completado');
}

main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(() => pool.end());


