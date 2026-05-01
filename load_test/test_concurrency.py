"""
Fires 100 concurrent purchase requests to POST /api/purchase/.
Product must have exactly 50 units in stock before running.
Expected result: exactly 50 succeed, 50 fail with 409.
"""
import threading
import requests
import json
from collections import Counter

API_URL    = 'http://127.0.0.1:8000/api/purchase/'
PRODUCT_ID = 1   # ← Update to your seeded product's ID
THREADS    = 100
results    = []
lock       = threading.Lock()


def make_purchase():
    try:
        r = requests.post(
            API_URL,
            json={'product_id': PRODUCT_ID, 'quantity': 1},
            timeout=10,
        )
        with lock:
            results.append(r.status_code)
    except Exception as e:
        with lock:
            results.append('error')


threads = [threading.Thread(target=make_purchase) for _ in range(THREADS)]

print(f'Firing {THREADS} concurrent requests...')
for t in threads:
    t.start()
for t in threads:
    t.join()

counts = Counter(results)
print('\n=== RESULTS ===')
print(f'  200 OK (success):   {counts[200]}')
print(f'  409 Conflict (out): {counts[409]}')
print(f'  Errors:             {counts["error"]}')
print(f'\nTotal handled: {sum(counts.values())}')
print('Stock oversell occurred!' if counts[200] > 50 else '✓ No oversell — concurrency handled correctly')