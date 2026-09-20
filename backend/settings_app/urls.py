from django.urls import path
from .views import (
    CompanyProfileView,
    InventoryPreferencesView,
    NotificationPreferencesView,
    PasswordChangeView,
    CategoriesView,
    ExportProductsView,
    ResetStockDataView,
    DeactivateAccountView,
)

urlpatterns = [
    path("company/",              CompanyProfileView.as_view(),          name="settings-company"),
    path("inventory/",            InventoryPreferencesView.as_view(),    name="settings-inventory"),
    path("notifications/",        NotificationPreferencesView.as_view(), name="settings-notifications"),
    path("password/",             PasswordChangeView.as_view(),          name="settings-password"),
    path("categories/",           CategoriesView.as_view(),              name="settings-categories"),
    path("export/products/",      ExportProductsView.as_view(),          name="settings-export-products"),
    path("danger/reset/",         ResetStockDataView.as_view(),          name="settings-danger-reset"),
    path("danger/deactivate/",    DeactivateAccountView.as_view(),       name="settings-danger-deactivate"),
]