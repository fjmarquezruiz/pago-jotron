import { z } from 'zod';

/**
 * Pone en español los mensajes de error de Zod que no llevan texto propio: `Entrada inválida: se
 * esperaba número, recibido texto`, `Demasiado pequeño: se esperaba que número fuera >=1`. Sin
 * esto salen en inglés (`Invalid input: expected number…`) en las respuestas 400 de las rutas de
 * la API y en los formularios. Los mensajes que escribimos en cada esquema (`'El código postal
 * tiene 5 dígitos'`) tienen prioridad y no cambian.
 *
 * La configuración de Zod es global del módulo: este fichero se importa por efecto desde cada
 * fichero de esquemas (`import '@/lib/validations/locale'`), para que valga en el servidor y en
 * el navegador, que cargan los esquemas por separado.
 */
z.config(z.locales.es());
