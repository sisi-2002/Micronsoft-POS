import random
from datetime import timedelta
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db import transaction
from faker import Faker
from api.models import Product, Transaction

fake = Faker()

PRODUCTS = [
    ('Laptop Pro 15"',    1299.99, '💻', 50,  'Electronics'),
    ('Wireless Mouse',     29.99,  '🖱️', 200, 'Accessories'),
    ('USB-C Hub',          49.99,  '🔌', 150, 'Accessories'),
    ('Mechanical Keyboard',89.99,  '⌨️', 100, 'Accessories'),
    ('4K Monitor',        449.99,  '🖥️', 30,  'Electronics'),
    ('Webcam HD',          79.99,  '📷', 80,  'Electronics'),
    ('Noise-Cancel Headphones', 199.99, '🎧', 60, 'Electronics'),
    ('Standing Desk Mat',  39.99, '🟫', 120, 'Office'),
    ('LED Desk Lamp',      34.99,  '💡', 90,  'Office'),
    ('Phone Stand',        19.99,  '📱', 180, 'Accessories'),
]


class Command(BaseCommand):
    help = 'Seed 100,000 transaction records and sample products'

    def handle(self, *args, **kwargs):
        self.stdout.write('Creating products...')
        products = []
        for name, price, emoji, stock, cat in PRODUCTS:
            p, _ = Product.objects.get_or_create(
                name=name,
                defaults={'price': price, 'stock': stock,
                          'category': cat, 'image_emoji': emoji}
            )
            products.append(p)

        self.stdout.write('Seeding 100,000 transactions (batch inserts)...')
        now    = timezone.now()
        start  = now - timedelta(days=180)
        batch  = []
        BATCH_SIZE = 1000

        for i in range(100_000):
            p   = random.choice(products)
            qty = random.randint(1, 5)
            ts  = start + timedelta(
                seconds=random.randint(0, int((now - start).total_seconds()))
            )
            batch.append(Transaction(
                product=p,
                product_name=p.name,
                amount=p.price * qty,
                created_at=ts,
            ))
            if len(batch) == BATCH_SIZE:
                Transaction.objects.bulk_create(batch)
                batch = []
                self.stdout.write(f'  Inserted {i + 1} records...')

        if batch:
            Transaction.objects.bulk_create(batch)

        self.stdout.write(self.style.SUCCESS('Done! 100,000 records seeded.'))