from django.urls import path
from . import views

urlpatterns = [
    path('purchase/',  views.purchase,  name='purchase'),
    path('analytics/', views.analytics, name='analytics'),
    path('checkout/',  views.checkout,  name='checkout'),
    path('products/',  views.products,  name='products'),
]