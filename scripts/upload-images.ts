/**
 * Sube a Cloudinary las imágenes de una subcarpeta de `public/`.
 *
 * Uso, desde la raíz del proyecto:
 *   pnpm db:images [carpeta]
 *
 * - Sin argumento recorre `public/images/productos` (solo ese nivel, sin entrar en subcarpetas).
 * - Cada archivo va a la carpeta `pago-jotron/productos` de Cloudinary. Su `public_id` es el
 *   nombre sin extensión pasado por `slugify()` (`Tinto Roble 2022.JPG` → `tinto-roble-2022`),
 *   y se sube con `overwrite: false`. Si ese `public_id` ya existe, Cloudinary no vuelve a
 *   subirlo y lo devuelve marcado con `existing: true`, así que el script se puede relanzar
 *   sin duplicar nada.
 * - Si dos archivos dan el mismo `public_id`, sube el primero (por orden alfabético) y marca el
 *   otro como error; lo mismo si el nombre no deja ninguna letra ni número.
 * - Necesita NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY y CLOUDINARY_API_SECRET.
 * - Al terminar imprime las imágenes subidas, las omitidas y las que han fallado. Si alguna falla,
 *   sale con código 1.
 */
import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { v2 as cloudinary, type UploadApiResponse } from 'cloudinary';
import { slugify } from '@/lib/utils';

const CLOUDINARY_FOLDER = 'pago-jotron/productos';
const DEFAULT_SOURCE_DIR = 'public/images/productos';
const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif']);
const REQUIRED_ENV = [
    'NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
] as const;

interface ImageResult {
    file: string;
    publicId: string;
}

interface FailedImage {
    file: string;
    reason: string;
}

/** Configura el SDK con las variables de entorno; falla si falta alguna. */
function configureCloudinary(): void {
    const missing = REQUIRED_ENV.filter((name) => !process.env[name]);
    if (missing.length > 0) {
        throw new Error(
            `Faltan variables de entorno: ${missing.join(', ')}. ` +
                'Lanza el script con --env-file=.env.local.',
        );
    }

    cloudinary.config({
        cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
        secure: true,
    });
}

/**
 * Nombres de las imágenes que hay directamente dentro de `dir`, ordenados.
 * Ignora subcarpetas, archivos ocultos (.DS_Store) y todo lo que no sea una imagen.
 * @param dir Carpeta a recorrer.
 */
async function listImages(dir: string): Promise<string[]> {
    const entries = await readdir(dir, { withFileTypes: true });
    return entries
        .filter((entry) => entry.isFile())
        .map((entry) => entry.name)
        .filter((name) => IMAGE_EXTENSIONS.has(path.extname(name).toLowerCase()))
        .sort();
}

/** Mensaje legible de un error; el SDK rechaza con objetos `{ message }` que no son `Error`. */
function errorMessage(error: unknown): string {
    if (error instanceof Error) return error.message;
    if (typeof error === 'object' && error !== null && 'message' in error) {
        return String(error.message);
    }
    return String(error);
}

/**
 * Imprime un apartado del resumen: el título con el número de líneas y cada línea sangrada.
 * @param title Título del apartado.
 * @param lines Una línea por imagen.
 */
function printSection(title: string, lines: string[]): void {
    console.log(`\n${title} (${lines.length})`);
    for (const line of lines) console.log(`  ${line}`);
}

/**
 * Sube las imágenes de la carpeta indicada (o la de por defecto) a Cloudinary e imprime el resumen.
 * Una imagen que falla no detiene las demás: se lista en el resumen y el proceso sale con código 1.
 * @throws Si faltan variables de entorno o la carpeta no existe.
 */
async function main(): Promise<void> {
    configureCloudinary();

    const sourceDir = path.resolve(process.cwd(), process.argv[2] ?? DEFAULT_SOURCE_DIR);
    let files: string[];
    try {
        files = await listImages(sourceDir);
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
            throw new Error(`No existe la carpeta ${sourceDir}`);
        }
        throw error;
    }

    if (files.length === 0) {
        console.log(`No hay imágenes en ${sourceDir}`);
        return;
    }

    console.log(`Imágenes a subir: ${files.length} (de ${sourceDir} a ${CLOUDINARY_FOLDER})\n`);

    const uploaded: ImageResult[] = [];
    const skipped: ImageResult[] = [];
    const failed: FailedImage[] = [];
    const filesByPublicId = new Map<string, string>();

    // Una a una: son pocas imágenes y así el progreso sale en orden y no se satura la API.
    for (const file of files) {
        const publicId = slugify(path.parse(file).name);
        const sameIdFile = filesByPublicId.get(publicId);
        if (!publicId || sameIdFile) {
            const reason = publicId
                ? `da el mismo public_id que ${sameIdFile}`
                : 'el nombre no tiene ninguna letra ni número';
            failed.push({ file, reason });
            console.log(`✗ ${file}`);
            continue;
        }
        filesByPublicId.set(publicId, file);

        try {
            const result: UploadApiResponse = await cloudinary.uploader.upload(
                path.join(sourceDir, file),
                {
                    folder: CLOUDINARY_FOLDER,
                    public_id: publicId,
                    overwrite: false,
                },
            );

            const image = { file, publicId: result.public_id };
            if (result.existing) {
                skipped.push(image);
                console.log(`- ${file} (ya existía)`);
            } else {
                uploaded.push(image);
                console.log(`✓ ${file}`);
            }
        } catch (error) {
            failed.push({ file, reason: errorMessage(error) });
            console.log(`✗ ${file}`);
        }
    }

    console.log('\n--- Resumen ---');
    printSection(
        'Subidas',
        uploaded.map(({ file, publicId }) => `${file} → ${publicId}`),
    );
    printSection(
        'Omitidas (ya existían)',
        skipped.map(({ file, publicId }) => `${file} → ${publicId}`),
    );
    if (failed.length > 0) {
        printSection(
            'Con error',
            failed.map(({ file, reason }) => `${file}: ${reason}`),
        );
        process.exitCode = 1;
    }
}

main().catch((error) => {
    console.error(errorMessage(error));
    process.exitCode = 1;
});
