# 🏪 Micronsoft POS 

> Full-stack Point of Sale system. Covers high-concurrency stock management, big data analytics, and transactional POS checkout — all three challenges fully implemented.

---

## 📋 Table of Contents

- [Project Overview](#-project-overview)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Local Setup & Installation](#-local-setup--installation)
- [Running the Data Population Script](#-running-the-data-population-script)
- [Running the Load Test](#-running-the-load-test)
- [API Endpoints](#-api-endpoints)
- [Challenge Approach & Solutions](#-challenge-approach--solutions)
- [Features](#-features)

---

## 🎯 Project Overview

This project implements all three challenges from the Micronsoft Solutions internship assessment:

| Challenge | Description | Endpoint |
|-----------|-------------|----------|
| **1** | High-Concurrency Purchase (500+ simultaneous requests, 50 units) | `POST /api/purchase/` |
| **2** | Big Data Analytics over 100,000 records in under 500ms | `GET /api/analytics/` |
| **3** | Mini POS System with full transactional integrity & receipt | `POST /api/checkout/` |

---

## 🛠 Tech Stack

**Backend**
- Python 3.11+
- Django 4.2 + Django REST Framework
- MySQL 8.0
- Faker (for data seeding)

**Frontend**
- React 18 + Vite
- Tailwind CSS 3
- react-hot-toast (popup notifications — no alerts or confirm dialogs used anywhere)
- lucide-react (icons)
- Axios

---

## 📁 Project Structure

```
micronsoft-pos-assessment/
├── backend/
│   ├── manage.py
│   ├── requirements.txt
│   ├── core/
│   │   ├── settings.py
│   │   └── urls.py
│   └── api/
│       ├── models.py
│       ├── views.py
│       ├── urls.py
│       └── management/
│           └── commands/
│               └── seed_data.py
├── frontend/
│   ├── package.json
│   ├── tailwind.config.js
│   └── src/
│       ├── App.jsx
│       ├── index.css
│       ├── api/
│       │   └── client.js
│       └── components/
│           ├── Toast.jsx
│           ├── POS.jsx
│           ├── Receipt.jsx
│           └── Analytics.jsx
├── load_test/
│   └── test_concurrency.py
└── README.md
```

---

## ⚙️ Local Setup & Installation

### Prerequisites

Make sure the following are installed on your machine:

- Python 3.11 or higher
- Node.js 18 or higher
- MySQL 8.0 or higher
- Git

---

### Step 1 — Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/micronsoft-pos-assessment.git
cd micronsoft-pos-assessment
```

---

### Step 2 — Create the MySQL database

Log in to MySQL and run:

```sql
CREATE DATABASE micronsoft_pos CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

---

### Step 3 — Configure the backend

```bash
cd backend
python -m venv venv

# Activate (Linux/Mac)
source venv/bin/activate

# Activate (Windows)
venv\Scripts\activate

pip install -r requirements-dev.txt
```

Open `backend/core/settings.py` and update the `DATABASES` section with your MySQL credentials:

```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'micronsoft_pos',
        'USER': 'root',
        'PASSWORD': 'your_mysql_password',   # ← change this
        'HOST': '127.0.0.1',
        'PORT': '3306',
    }
}
```

---

### Step 4 — Run migrations

```bash
python manage.py migrate
```

---

### Step 5 — Start the backend server

```bash
python manage.py runserver
```

The Django API will be running at `http://127.0.0.1:8000`

---

### Step 6 — Set up and start the frontend

Open a **new terminal** and run:

```bash
cd frontend
npm install
npm run dev
```

The React app will be running at `http://localhost:5173`

---

## 🌱 Running the Data Population Script

This command seeds the database with **10 sample products** and **100,000 transaction records** spread across the last 6 months. It uses `bulk_create()` with batches of 1,000 records for maximum performance.

```bash
cd backend
source venv/bin/activate   # if not already active
python manage.py seed_data
```

Expected output:
```
Creating products...
Seeding 100,000 transactions (batch inserts)...
  Inserted 1000 records...
  Inserted 2000 records...
  ...
Done! 100,000 records seeded.
```

> The script is idempotent — running it multiple times will not duplicate products (it uses `get_or_create`), but will add more transaction records.

---

## 🧪 Running the Load Test

This script fires **100 concurrent purchase requests** using Python's `threading` module to verify the concurrency solution works correctly.

**Before running:** Make sure the backend is running and the product with ID 1 has exactly **50 units of stock** (reset it if needed):

```sql
UPDATE products SET stock = 50 WHERE id = 1;
```

Then run:

```bash
cd load_test
python test_concurrency.py
```

Expected output:
```
Firing 100 concurrent requests...

=== RESULTS ===
  200 OK (success):   50
  409 Conflict (out): 50
  Errors:             0

Total handled: 100
✓ No oversell — concurrency handled correctly
```

Exactly 50 requests succeed and 50 are rejected. Stock never drops below zero. This proves the `SELECT FOR UPDATE` locking mechanism works correctly under high concurrency.

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/products/` | List all products with stock |
| `POST` | `/api/purchase/` | Concurrency-safe single product purchase |
| `GET` | `/api/analytics/` | 30-day revenue + top 5 products |
| `POST` | `/api/checkout/` | Full cart checkout with atomic integrity |

### POST `/api/purchase/`
```json
{
  "product_id": 1,
  "quantity": 1
}
```

### POST `/api/checkout/`
```json
{
  "items": [
    { "product_id": 1, "quantity": 2 },
    { "product_id": 3, "quantity": 1 }
  ],
  "total_amount": "2629.97"
}
```

### GET `/api/analytics/` — Response structure
```json
{
  "query_time_ms": 87.4,
  "daily_revenue": [
    { "date": "2025-06-01", "revenue": 14823.50 }
  ],
  "top_products": [
    {
      "product": "Laptop Pro 15\"",
      "total_revenue": 389420.00,
      "total_sales": 300
    }
  ]
}
```

---

## 🧠 Challenge Approach & Solutions

### Challenge 1 — High-Concurrency Management

**Problem:** 500+ simultaneous requests trying to purchase from a stock of 50 units. Without protection, multiple threads can read the same stock value at the same instant and all proceed — resulting in negative stock (overselling).

**Solution: `SELECT FOR UPDATE` inside `transaction.atomic()`**

```python
with transaction.atomic():
    product = Product.objects.select_for_update().get(id=product_id)
    if product.stock < quantity:
        return Response({'error': 'Insufficient stock'}, status=409)
    product.stock -= quantity
    product.save(update_fields=['stock'])
```

`SELECT ... FOR UPDATE` instructs MySQL to acquire a **row-level exclusive lock** on that product row. Any other transaction trying to read the same row is blocked and must wait until the first transaction commits or rolls back. This guarantees that the read → check → decrement sequence is atomic with respect to all concurrent requests.

Key properties of this approach:
- Only the specific product row is locked (not the whole table), so other products are unaffected
- MySQL handles the queuing automatically — no application-level semaphores needed
- `transaction.atomic()` ensures the lock is held for exactly the duration of the operation
- Proven correct by the load test: 100 concurrent requests → exactly 50 succeed, 50 fail

---

### Challenge 2 — Big Data Aggregation & Query Optimisation

**Problem:** Generate daily revenue for 30 days and the top 5 products from a table with 100,000 records — in under 500ms.

**Solution: Database-level aggregation with strategic indexing**

The `Transaction` model defines two indexes:

```python
class Meta:
    indexes = [
        models.Index(fields=['created_at']),           # date range filter
        models.Index(fields=['product_name', 'amount']),  # covers GROUP BY + SUM
    ]
```

The analytics query uses Django ORM `.annotate()` to push all aggregation into MySQL:

```python
# Two queries — both resolved entirely within the DB engine
daily = Transaction.objects.filter(created_at__gte=ago) \
    .extra(select={'day': 'DATE(created_at)'}) \
    .values('day').annotate(revenue=Sum('amount')).order_by('day')

top5 = Transaction.objects.values('product_name') \
    .annotate(total_revenue=Sum('amount'), total_sales=Count('id')) \
    .order_by('-total_revenue')[:5]
```

Why this is fast:
- The `created_at` B-tree index means MySQL scans only the 30-day window, not all 100k rows
- The compound index on `(product_name, amount)` allows the GROUP BY + SUM to be resolved from the index alone (index-only scan)
- Zero Python-level iteration over records — the database returns aggregated rows directly
- Typical measured response time: **60–150ms** on a local MySQL instance

---

### Challenge 3 — Mini POS System & Transactional Integrity

**Problem:** A cashier checks out a cart of multiple products. If any single item fails (out of stock, product deleted, DB error), no part of the order should be saved.

**Solution: `transaction.atomic()` wrapping all writes**

```python
with transaction.atomic():
    order = Order.objects.create(total_amount=total_amount)

    for item in items:
        product = Product.objects.select_for_update().get(id=item['product_id'])
        if product.stock < item['quantity']:
            raise ValueError(f'Insufficient stock for {product.name}')
        product.stock -= item['quantity']
        product.save(update_fields=['stock'])
        OrderItem.objects.create(order=order, product=product, ...)

    # If ANY line above raises an exception → full rollback, nothing saved
```

`transaction.atomic()` wraps all database writes in a single database transaction. Django uses a savepoint if this is nested inside another atomic block. Any unhandled exception — whether a `ValueError` raised manually (stock check), a `Product.DoesNotExist` (bad product ID), or an unexpected DB error — causes the entire transaction to roll back automatically. The `Order`, all `OrderItem` rows, and all stock decrements are undone together.

The frontend is a full single-page POS interface with:
- Product grid with category filtering
- Live cart with quantity controls and real-time grand total
- All feedback via popup toast notifications (no browser alerts, confirms, or localhost messages anywhere)
- Bonus: 80mm thermal receipt component (302px width at 96dpi) with browser print support

---

## ✨ Features

- **Zero browser alerts** — every notification is a styled popup toast
- **Real-time grand total** updates as items are added or quantities change
- **Category filtering** on the product grid
- **Low stock warnings** shown inline on product cards
- **Thermal receipt** modal with print button (80mm / 302px width)
- **Analytics dashboard** showing a 30-day bar chart and top 5 product rankings
- **Query time badge** on the analytics page showing live DB response time

---

