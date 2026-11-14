import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

config({ path: '.env.local' });

const url = new URL(process.env.DATABASE_URL!);

export default defineConfig({
    schema: './src/db/schema.ts',
    out: './drizzle/migrations',
    dialect: 'mysql',
    dbCredentials: {
        host: url.hostname,
        port: Number(url.port || 3306),
        user: decodeURIComponent(url.username),
        password: decodeURIComponent(url.password),
        database: url.pathname.slice(1),
        ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: true } : undefined,
    },
});
