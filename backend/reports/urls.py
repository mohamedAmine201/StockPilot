from django.urls import path
from .views import (
    InventoryOverviewView,
    MovementsReportView,
    SupplierPerformanceView,
    LowStockReportView,
    DashboardView,
)

urlpatterns = [
    path("inventory/",  InventoryOverviewView.as_view(),   name="report-inventory"),
    path("movements/",  MovementsReportView.as_view(),     name="report-movements"),
    path("suppliers/",  SupplierPerformanceView.as_view(), name="report-suppliers"),
    path("low-stock/",  LowStockReportView.as_view(),      name="report-low-stock"),
    path("dashboard/",  DashboardView.as_view(),           name="report-dashboard"),
]