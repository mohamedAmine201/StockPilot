from django.contrib import admin
from django.conf import settings
from django.conf.urls.static import static
from django.urls import path, include, re_path
from django.views.generic import TemplateView


urlpatterns = [
    path("admin/", admin.site.urls),

    # API routes
    path("api/auth/", include("users.urls")),
    path("api/suppliers/", include("suppliers.urls")),
    path("api/products/", include("products.urls")),
    path("api/stock/", include("stock.urls")),
    path("api/reports/", include("reports.urls")),
    path("api/settings/", include("settings_app.urls")),
]

# Media files during development
urlpatterns += static(
    settings.MEDIA_URL,
    document_root=settings.MEDIA_ROOT,
)

# React SPA fallback - absolutely last
urlpatterns += [
    re_path(
        r"^(?!api/|admin/).*",
        TemplateView.as_view(template_name="index.html"),
    ),
]