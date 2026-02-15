# Guía de Puesta en Marcha y Pruebas del Proyecto

Este documento describe los pasos necesarios para instalar, configurar y probar el proyecto en un entorno de desarrollo local.

## Requisitos Previos

Asegúrate de tener instalado lo siguiente:
- **PHP** 8.2 o superior.
- **Composer** 2.x.
- **Node.js** 18.x o superior.
- **NPM** (incluido con Node.js).
- **SQLite** (generalmente disponible por defecto en PHP, o MySQL si prefieres).

## 1. Instalación

1.  **Clonar el repositorio**:
    ```bash
    git clone <url-del-repositorio>
    cd <nombre-del-proyecto>
    ```

2.  **Instalar dependencias de PHP**:
    ```bash
    composer install
    ```

3.  **Instalar dependencias de Node.js**:
    ```bash
    npm install
    ```

## 2. Configuración del Entorno (SQLite)

El proyecto está configurado para usar **SQLite** por defecto para facilitar el desarrollo local, evitando la necesidad de un servidor de base de datos externo como MySQL.

1.  **Copiar el archivo de entorno**:
    ```bash
    cp .env.example .env
    ```

2.  **Generar la clave de aplicación**:
    ```bash
    php artisan key:generate
    ```

3.  **Crear el archivo de base de datos**:
    Si no existe, crea un archivo vacío para la base de datos SQLite:
    ```bash
    touch database/database.sqlite
    ```

4.  **Configurar `.env`**:
    Asegúrate de que tu archivo `.env` tenga la configuración de base de datos así (comenta las líneas de MySQL):
    ```ini
    DB_CONNECTION=sqlite
    # DB_HOST=127.0.0.1
    # DB_PORT=3306
    # ...
    ```

## 3. Base de Datos

Ejecuta las migraciones para crear las tablas necesarias en la base de datos:

```bash
php artisan migrate
```

Si deseas poblar la base de datos con datos de prueba (seeders):
```bash
php artisan migrate --seed
```

## 4. Ejecutar el Proyecto

Necesitas correr dos procesos simultáneamente: el servidor backend (Laravel) y el servidor frontend (Vite).

### Opción A (Recomendada)
Usa el comando compuesto de Composer:
```bash
composer run dev
```

### Opción B (Manual)
En dos terminales separadas:

**Terminal 1 (Backend):**
```bash
php artisan serve
```
*El servidor arrancará en http://127.0.0.1:8000 (o 8001 si el 8000 está ocupado).*

**Terminal 2 (Frontend):**
```bash
npm run dev
```

## 5. Pruebas y Uso

1.  Visita la URL que te indica `php artisan serve` (ej. `http://127.0.0.1:8000`).
2.  **Registro**: Crea una cuenta nueva para verificar que la base de datos funciona.
3.  **Login**: Inicia sesión con tu nueva cuenta.

### Ejecutar Tests Automatizados

Para asegurar que todo funciona correctamente, puedes ejecutar la suite de pruebas de PHPUnit:

```bash
php artisan test
```

Esto ejecutará todos los tests definidos en la carpeta `tests/`.
