### Project Documentation

#### Description
This project is an ecommerce platform for a wine cellar. It is developed using Laravel 11 with Breeze and Inertia, utilizing React for the frontend. The system consists of two applications:

1. **Public Frontend**: Where users can explore and purchase wines, book visits, and read the blog.
2. **Dashboard**: An administration application to manage products, orders, users, and blog content.

#### Technologies
- **Backend**: Laravel 11
- **Authentication**: Breeze with Inertia
- **Frontend**: React with Vite
- **Database**: MySQL
- **Web Server**: Apache on Mac

#### Domain
The application will run on `pagotron.com`.

#### Key Features
- Product management (wines, categories, wineries, denominations of origin).
- Order and payment management.
- Reservations for guided tours and tastings.
- Blog with posts and categories.
- Administration panel to manage content and users.

#### Functional Requirements
- Only individuals aged 18 or older (or the legal age in their country) can register and make purchases.
- Age confirmation will be required via a checkbox during registration.
- Registration with email and a strong password.
- Ability to indicate wine, winery, and denomination of origin preferences during registration or later.
- Users can modify or delete their profile at any time.

#### User Types
- **Anonymous User**: Can browse and add products to the cart.
- **Customer**: Can make purchases, manage orders, and access promotions.
- **Editor**: Manages the product catalog and blog content.
- **Administrator**: Has all editor permissions and can also manage users, orders, products, and settings.

#### Cart and Orders
- Anonymous users and customers can add products to the cart if stock is available.
- Each wine's page will include recommendations based on purchase history or preferences.
- Customers can modify, update, or delete their profile at any time.
- Orders in the "In Process" status can be modified or canceled within the first 5 days.
- Invoices can be downloaded for completed orders.
- Payment methods: Credit card and PayPal.

#### Order Statuses
1. **Confirmed**: Order received in the system.
2. **In Process**: Preparation in progress.
3. **Prepared**: Ready for shipment.
4. **Shipped**: In transit to the customer.
5. **Delivered**: Order received by the customer.
6. **Canceled**: Order canceled (by customer or administrator).
7. **Blocked**: If an order remains in an intermediate state for more than 15 days, it is blocked for review.

- Stock is automatically updated when an order reaches the "Prepared" status.
- Orders without stock will not proceed until inventory is replenished.

#### Product and Blog Management
- Editors and administrators can add, edit, or delete products from the catalog.
- Management of wineries, denominations of origin, and grape types by editors.
- Creation and modification of blog posts by editors and administrators.
- Blog posts can be associated with wines, wineries, or denominations of origin.
- If a wine has no related articles, random selections will be displayed.

#### Administration and User Management
- Administrators can manage users, modify their type, and restrict sales of certain products.
- Creation and editing of informational pages about the winery (history, visits, contact, legal policies, etc.).
- Filtering of wines during the purchase process (denomination of origin, grape type, etc.).
- Password recovery and reset for users.
- Visits and tastings can be added to the cart and managed as products.

#### Installation and Configuration
1. Clone the repository:
   ```sh
   git clone https://github.com/fjmarquezruiz/pago-jotron.git
   cd proyecto
   ```
2. Install dependencies:
   ```sh
   composer install
   npm install
   ```
3. Configure the `.env` file and generate the application key:
   ```sh
   cp .env.example .env
   php artisan key:generate
   ```
4. Set up the database in `.env` and run migrations:
   ```sh
   php artisan migrate --seed
   ```
5. Start the server:
   ```sh
   composer run dev
   ```

#### Production Deployment
- Server configuration in production.
- Environment variable setup.
- Use of tools like Laravel Forge or DigitalOcean.
- HTTPS and SSL certificate configuration.
- Optimization with `config:cache`, `route:cache`.

#### APIs and Endpoints
- API documentation with examples of JSON requests and responses.
- Use of Laravel Sanctum for API authentication.

#### Security
- Policies and permissions in Laravel.
- Protection against CSRF, XSS, and SQL Injection.
- Authentication setup with Breeze/Inertia.

#### Testing and QA
- Unit and integration testing with PHPUnit.
- Interface testing with Laravel Dusk.

#### Monitoring and Logs
- Log configuration in Laravel (`storage/logs/laravel.log`).
- Use of tools like Sentry or Bugsnag for error monitoring.

#### Email and Notification Management
- Configuration of SMTP services or Mailtrap.
- Example of sending emails with Laravel Mailables.

#### Project Structure
- `app/` - Backend code in Laravel.
- `resources/js/` - Frontend code in React.
- `routes/web.php` - Application routes.
- `database/migrations/` - Database migrations.
- `public/` - Static files.

#### Additional Notes
- It is recommended to use Laravel Valet on Mac for local development.
- Tests can be run with:
   ```sh
   php artisan test
   ```