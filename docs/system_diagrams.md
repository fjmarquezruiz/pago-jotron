# System Diagrams

## 1. Data Flow Diagram (DFD) - Level 0
Overview of data movement in the Pago Jotron system.

```mermaid
graph TD
    User[User/Customer] -->|Browse Wines, Add to Cart| Frontend[Frontend (React)]
    Frontend -->|API Requests| Backend[Backend (Laravel API)]
    Backend -->|Read/Write| DB[(Database)]
    Backend -->|Auth Token| Frontend
    User -->|Checkout & Payment| Frontend
    Frontend -->|Process Order| Backend
    Backend -->|Payment Info| Gateway[Payment Gateway]
    Gateway -->|Payment Status| Backend
    Backend -->|Email Confirmation| Email[Email Service]
    Admin[Admin User] -->|Manage Products/Orders| Backend
```

## 2. Sequence Diagram - Checkout Process
Detailed interaction during the checkout phase.

```mermaid
sequenceDiagram
    actor User
    participant Frontend as React App
    participant API as Laravel API
    participant DB as Database
    participant Payment as Payment Gateway

    User->>Frontend: Click "Checkout"
    Frontend->>API: GET /api/user/cart
    API->>DB: Retrieve Cart Items
    DB-->>API: Return Items
    API-->>Frontend: Cart Data
    User->>Frontend: Enter Shipping/Billing Info
    User->>Frontend: Click "Pay"
    Frontend->>API: POST /checkout/process
    API->>DB: Create Order (Status: Pending)
    API->>Payment: Process Payment
    alt Payment Successful
        Payment-->>API: Success
        API->>DB: Update Order (Status: Paid)
        API->>DB: Reduce Stock
        API-->>Frontend: Success Response
        Frontend->>User: Show Success Page
    else Payment Failed
        Payment-->>API: Failure
        API->>DB: Update Order (Status: Failed)
        API-->>Frontend: Error Response
        Frontend->>User: Show Error Message
    end
```

## 3. State Diagram - Order Status
Lifecycle of an order within the system.

```mermaid
stateDiagram-v2
    [*] --> PendingPayment: Order Created
    PendingPayment --> Paid: Payment Successful
    PendingPayment --> Cancelled: User Cancels/Timeout
    Paid --> Processing: Admin Accepts
    Processing --> Shipped: Order Dispatched
    Shipped --> Delivered: Customer Receives
    Delivered --> [*]
    
    Processing --> Refunded: Admin Refunds
    Paid --> Refunded: Admin Refunds
    Refunded --> [*]
```

## 4. Activity Diagram - User Purchase Flow
The step-by-step workflow of a user making a purchase.

```mermaid
flowchart TD
    Start([User Visits Site]) --> Browse{Browse Wines}
    Browse -->|View Details| ViewProduct[Product Page]
    ViewProduct --> AddCart[Add to Cart]
    AddCart --> Continue{Continue Shopping?}
    Continue -->|Yes| Browse
    Continue -->|No| ViewCart[View Cart]
    ViewCart --> LoginCheck{Is Logged In?}
    LoginCheck -->|No| Login[Login/Register]
    LoginCheck -->|Yes| Checkout[Proceed to Checkout]
    Login --> Checkout
    Checkout --> Address[Select Address]
    Address --> Payment[Enter Payment Details]
    Payment --> Confirm{Confirm Order?}
    Confirm -->|Yes| ProcessPayment[Process Payment]
    ProcessPayment --> Success{Success?}
    Success -->|Yes| OrderComplete[Order Confirmation]
    Success -->|No| Retry[Retry Payment]
    Retry --> Payment
    OrderComplete --> End([End])
```

## 5. Entity-Relationship Diagram (ERD)
Core database structure and relationships.

```mermaid
erDiagram
    User ||--o{ Order : places
    User ||--o{ Direccion : has
    Order ||--|{ OrderItem : contains
    Vino ||--o{ OrderItem : is_in
    Bodega ||--o{ Vino : produces
    Denominacion ||--o{ Vino : classified_as
    Categoria ||--o{ Vino : belongs_to
    Vino }|--|{ Uva : made_of

    User {
        int id
        string name
        string email
        string password
    }

    Vino {
        int id
        string name
        float price
        int stock
        int year
    }

    Order {
        int id
        int user_id
        string status
        float total
        datetime created_at
    }

    Direccion {
        int id
        int user_id
        string address
        string city
        string type
    }
```
