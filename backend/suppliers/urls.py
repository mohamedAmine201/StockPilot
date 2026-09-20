from django.urls import path
from . import views

urlpatterns = [
    path("",          views.SupplierListCreateView.as_view(), name="supplier-list-create"),
    path("minimal/",  views.SupplierMinimalListView.as_view(), name="supplier-minimal"),
    path("<int:pk>/", views.SupplierDetailView.as_view(),     name="supplier-detail"),
]