import time
from datetime import timedelta

from django.db import transaction
from django.db.models import Sum, Count
from django.utils import timezone

from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import Product, Order, OrderItem, Transaction


# ─── Challenge 1: High-Concurrency Purchase ───────────────────────────────────

@api_view(['POST'])
def purchase(request):
    """
    Atomically decrement stock using SELECT FOR UPDATE.
    This locks the row in MySQL so no two concurrent requests
    can both read the same stock value — preventing overselling.
    """
    product_id = request.data.get('product_id')
    quantity   = int(request.data.get('quantity', 1))

    if not product_id:
        return Response({'error': 'product_id is required'},
                        status=status.HTTP_400_BAD_REQUEST)

    try:
        with transaction.atomic():
            # SELECT ... FOR UPDATE locks this row until the transaction ends
            product = Product.objects.select_for_update().get(id=product_id)

            if product.stock < quantity:
                return Response(
                    {'error': 'Insufficient stock',
                     'remaining': product.stock},
                    status=status.HTTP_409_CONFLICT
                )

            product.stock -= quantity
            product.save(update_fields=['stock'])

        return Response({
            'success': True,
            'message': f'Purchased {quantity}x {product.name}',
            'remaining_stock': product.stock,
        })

    except Product.DoesNotExist:
        return Response({'error': 'Product not found'},
                        status=status.HTTP_404_NOT_FOUND)


# ─── Challenge 2: Analytics Dashboard ────────────────────────────────────────

@api_view(['GET'])
def analytics(request):
    """
    Returns 30-day daily revenue + top 5 products.
    Optimised with:
      - DB-level aggregation (no Python loops)
      - Indexed created_at column
      - Compound index on (product_name, amount)
    """
    t0  = time.time()
    now = timezone.now()
    ago = now - timedelta(days=30)

    # Daily revenue — single GROUP BY query
    daily = (
        Transaction.objects
        .filter(created_at__gte=ago)
        .extra(select={'day': 'DATE(created_at)'})
        .values('day')
        .annotate(revenue=Sum('amount'))
        .order_by('day')
    )

    # Top 5 products — single GROUP BY query
    top5 = (
        Transaction.objects
        .values('product_name')
        .annotate(
            total_revenue=Sum('amount'),
            total_sales=Count('id'),
        )
        .order_by('-total_revenue')[:5]
    )

    elapsed_ms = (time.time() - t0) * 1000

    return Response({
        'query_time_ms': round(elapsed_ms, 2),
        'daily_revenue': [
            {'date': str(r['day']), 'revenue': float(r['revenue'])}
            for r in daily
        ],
        'top_products': [
            {
                'product': r['product_name'],
                'total_revenue': float(r['total_revenue']),
                'total_sales': r['total_sales'],
            }
            for r in top5
        ],
    })


# ─── Challenge 3: POS Checkout ────────────────────────────────────────────────

@api_view(['POST'])
def checkout(request):
    """
    Processes a full cart with transactional integrity.
    If ANY item fails (bad product, zero stock, etc.) the
    entire order is rolled back — no partial saves.
    """
    items        = request.data.get('items', [])
    total_amount = request.data.get('total_amount', 0)

    if not items:
        return Response({'error': 'Cart is empty'},
                        status=status.HTTP_400_BAD_REQUEST)

    try:
        with transaction.atomic():
            order = Order.objects.create(
                total_amount=total_amount,
                status='completed',
            )

            for item in items:
                product = (
                    Product.objects
                    .select_for_update()
                    .get(id=item['product_id'])
                )
                qty = int(item['quantity'])

                if product.stock < qty:
                    raise ValueError(
                        f'Insufficient stock for {product.name}. '
                        f'Available: {product.stock}'
                    )

                product.stock -= qty
                product.save(update_fields=['stock'])

                OrderItem.objects.create(
                    order=order,
                    product=product,
                    quantity=qty,
                    price=product.price,
                )

                # Mirror into Transaction table for analytics
                Transaction.objects.create(
                    product=product,
                    product_name=product.name,
                    amount=product.price * qty,
                    created_at=timezone.now(),
                )

        return Response({
            'success': True,
            'order_id': order.id,
            'total': float(order.total_amount),
            'message': 'Order placed successfully',
        }, status=status.HTTP_201_CREATED)

    except Product.DoesNotExist:
        return Response({'error': 'One or more products not found'},
                        status=status.HTTP_404_NOT_FOUND)
    except ValueError as e:
        return Response({'error': str(e)},
                        status=status.HTTP_409_CONFLICT)


# ─── Product listing (for POS UI) ─────────────────────────────────────────────

@api_view(['GET'])
def products(request):
    prods = Product.objects.filter(stock__gt=0).order_by('category', 'name')
    data  = [
        {
            'id': p.id, 'name': p.name,
            'price': float(p.price), 'stock': p.stock,
            'category': p.category, 'image_emoji': p.image_emoji,
        }
        for p in prods
    ]
    return Response(data)