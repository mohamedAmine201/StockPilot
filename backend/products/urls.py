from django.urls import path
from .views import (
    CategoryListCreateView,
    CategoryDetailView,
    ProductListCreateView,
    ProductDetailView,
    LowStockProductsView,
)

urlpatterns = [
    # Categories
    path("categories/",          CategoryListCreateView.as_view(), name="category-list-create"),
    path("categories/<int:pk>/", CategoryDetailView.as_view(),     name="category-detail"),

    # Products
    path("",                     ProductListCreateView.as_view(),   name="product-list-create"),
    path("low-stock/",           LowStockProductsView.as_view(),    name="product-low-stock"),
    path("<int:pk>/",            ProductDetailView.as_view(),        name="product-detail"),
]