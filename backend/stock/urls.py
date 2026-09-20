from django.urls import path
from .views import StockMovementListCreateView, StockMovementDetailView

urlpatterns = [
    path("",        StockMovementListCreateView.as_view(), name="stock-list-create"),
    path("<int:pk>/", StockMovementDetailView.as_view(),  name="stock-detail"),
]