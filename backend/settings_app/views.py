import csv
from django.http import HttpResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from products.models import Product
from suppliers.models import Supplier
from stock.models import StockMovement
from users.models import CustomUser
from users.permissions import IsAdmin, IsAnyRole

from .models import CompanyProfile, InventoryPreferences, NotificationPreferences
from .serializers import (
    CompanyProfileSerializer,
    InventoryPreferencesSerializer,
    NotificationPreferencesSerializer,
    PasswordChangeSerializer,
)


class CompanyProfileView(APIView):
    """
    GET   /api/settings/company/  — retrieve company profile (any authenticated)
    PATCH /api/settings/company/  — update company profile   (admin only)
    """
    def get_permissions(self):
        if self.request.method == "GET":
            return [IsAuthenticated()]
        return [IsAdmin()]

    def get(self, request):
        profile    = CompanyProfile.get()
        serializer = CompanyProfileSerializer(profile)
        return Response(serializer.data)

    def patch(self, request):
        profile    = CompanyProfile.get()
        serializer = CompanyProfileSerializer(profile, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save()
        return Response(serializer.data)


class InventoryPreferencesView(APIView):
    """
    GET   /api/settings/inventory/  — retrieve prefs (any authenticated)
    PATCH /api/settings/inventory/  — update prefs   (admin only)
    """
    def get_permissions(self):
        if self.request.method == "GET":
            return [IsAuthenticated()]
        return [IsAdmin()]

    def get(self, request):
        prefs      = InventoryPreferences.get()
        serializer = InventoryPreferencesSerializer(prefs)
        return Response(serializer.data)

    def patch(self, request):
        prefs      = InventoryPreferences.get()
        serializer = InventoryPreferencesSerializer(prefs, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save()
        return Response(serializer.data)


class NotificationPreferencesView(APIView):
    """
    GET   /api/settings/notifications/  — retrieve current user's prefs
    PATCH /api/settings/notifications/  — update  current user's prefs
    Each user has their own row.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        prefs      = NotificationPreferences.get_for_user(request.user)
        serializer = NotificationPreferencesSerializer(prefs)
        return Response(serializer.data)

    def patch(self, request):
        prefs      = NotificationPreferences.get_for_user(request.user)
        serializer = NotificationPreferencesSerializer(
            prefs, data=request.data, partial=True
        )
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save()
        return Response(serializer.data)


class PasswordChangeView(APIView):
    """
    POST /api/settings/password/
    Any authenticated user can change their own password.
    Body: { current_password, new_password, confirm_password }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = PasswordChangeSerializer(
            data=request.data,
            context={"request": request},
        )
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        request.user.set_password(serializer.validated_data["new_password"])
        request.user.save()

        return Response(
            {"message": "Password changed successfully."},
            status=status.HTTP_200_OK,
        )


class CategoriesView(APIView):
    """
    GET /api/settings/categories/
    Returns distinct category names with product counts.
    No model needed — derived from Product.category field.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from django.db.models import Count
        categories = (
            Product.objects
            .filter(is_active=True)
            .values("category")
            .annotate(count=Count("id"))
            .order_by("category")
        )
        return Response(
            [{"name": c["category"], "count": c["count"]} for c in categories]
        )


class ExportProductsView(APIView):
    """
    GET /api/settings/export/products/
    Downloads all active products as a CSV file.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        response = HttpResponse(content_type="text/csv")
        response["Content-Disposition"] = 'attachment; filename="products.csv"'

        writer = csv.writer(response)
        writer.writerow([
            "Name", "SKU", "Category", "Supplier",
            "Unit", "Unit Price (DA)", "Stock", "Threshold", "Description",
        ])

        products = (
            Product.objects
            .filter(is_active=True)
            .select_related("supplier")
            .order_by("category", "name")
        )

        for p in products:
            writer.writerow([
                p.name,
                p.sku,
                p.category,
                p.supplier.name if p.supplier else "—",
                p.unit,
                p.unit_price,
                p.stock,
                p.threshold,
                p.description,
            ])

        return response


class ResetStockDataView(APIView):
    permission_classes = [IsAdmin]

    def post(self, request):
        confirm = request.data.get("confirm", "").strip()
        profile = CompanyProfile.get()

        if confirm != profile.name:
            return Response(
                {"error": "Confirmation text does not match the company name."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        StockMovement.objects.all().delete()
        Product.objects.all().delete()  # ← hard delete instead of soft delete

        return Response(
            {"message": "All stock data has been reset."},
            status=status.HTTP_200_OK,
        )


class DeactivateAccountView(APIView):
    """
    POST /api/settings/danger/deactivate/
    Admin only — soft-deletes the requesting user's own account.
    Body: { confirm: "DELETE" }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        confirm = request.data.get("confirm", "").strip()

        if confirm != "DELETE":
            return Response(
                {"error": 'Type "DELETE" to confirm.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = request.user
        user.is_active = False
        user.save()

        return Response(
            {"message": "Account deactivated."},
            status=status.HTTP_200_OK,
        )