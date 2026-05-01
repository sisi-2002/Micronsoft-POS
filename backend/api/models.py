from django.db import models


class Product(models.Model):
    name        = models.CharField(max_length=255)
    price       = models.DecimalField(max_digits=10, decimal_places=2)
    stock       = models.PositiveIntegerField(default=0)
    category    = models.CharField(max_length=100, default='General')
    image_emoji = models.CharField(max_length=10, default='📦')

    class Meta:
        db_table = 'products'

    def __str__(self):
        return self.name


class Order(models.Model):
    STATUS_CHOICES = [('pending', 'Pending'), ('completed', 'Completed'),
                      ('failed', 'Failed')]
    created_at   = models.DateTimeField(auto_now_add=True)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2)
    status       = models.CharField(max_length=20, choices=STATUS_CHOICES,
                                    default='completed')

    class Meta:
        db_table = 'orders'


class OrderItem(models.Model):
    order    = models.ForeignKey(Order, on_delete=models.CASCADE,
                                 related_name='items')
    product  = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField()
    price    = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        db_table = 'order_items'


class Transaction(models.Model):
    """Used exclusively for Challenge 2 analytics seeding."""
    product      = models.ForeignKey(Product, on_delete=models.CASCADE,
                                     null=True, blank=True)
    product_name = models.CharField(max_length=255)
    amount       = models.DecimalField(max_digits=12, decimal_places=2)
    created_at   = models.DateTimeField(db_index=True)  # index for fast range queries

    class Meta:
        db_table = 'transactions'
        indexes  = [
            models.Index(fields=['created_at']),
            models.Index(fields=['product_name', 'amount']),
        ]