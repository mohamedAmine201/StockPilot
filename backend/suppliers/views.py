from django.db.models import Q
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from users.permissions import IsAdmin, IsAdminOrManager, IsAnyRole
from .models import Supplier
from .serializers import SupplierSerializer, SupplierWriteSerializer, SupplierMinimalSerializer


class SupplierListCreateView(APIView):
    """
    GET  /api/suppliers/  — list all suppliers
    POST /api/suppliers/  — create a supplier (admin/manager)

    Query params:
      ?search=name        — filter by name, contact, or email
      ?is_active=true     — filter by active status
    """

    def get_permissions(self):
        if self.request.method == "GET":
            return [IsAnyRole()]
        return [IsAdminOrManager()]

    def get(self, request):
        qs = Supplier.objects.all()

        # Search
        search = request.query_params.get("search", "").strip()
        if search:
            qs = qs.filter(
                Q(name__icontains=search)    |
                Q(contact__icontains=search) |
                Q(email__icontains=search)
            )

        # Active filter
        is_active = request.query_params.get("is_active")
        if is_active is not None:
            qs = qs.filter(is_active=is_active.lower() == "true")

        serializer = SupplierSerializer(qs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = SupplierWriteSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        supplier = serializer.save()

        return Response(
            SupplierSerializer(supplier).data,
            status=status.HTTP_201_CREATED,
        )


class SupplierDetailView(APIView):
    """
    GET    /api/suppliers/<id>/  — get single supplier   (any role)
    PATCH  /api/suppliers/<id>/  — partial update        (admin/manager)
    DELETE /api/suppliers/<id>/  — delete supplier       (admin only)
    """

    def get_permissions(self):
        if self.request.method == "GET":
            return [IsAnyRole()]
        if self.request.method == "DELETE":
            return [IsAdmin()]
        return [IsAdminOrManager()]

    def get_object(self, pk):
        try:
            return Supplier.objects.get(pk=pk)
        except Supplier.DoesNotExist:
            return None

    def get(self, request, pk):
        supplier = self.get_object(pk)
        if not supplier:
            return Response(
                {"error": "Supplier not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(
            SupplierSerializer(supplier).data,
            status=status.HTTP_200_OK,
        )

    def patch(self, request, pk):
        supplier = self.get_object(pk)
        if not supplier:
            return Response(
                {"error": "Supplier not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # partial=True means only provided fields are updated
        serializer = SupplierWriteSerializer(
            supplier, data=request.data, partial=True
        )
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        supplier = serializer.save()

        return Response(
            SupplierSerializer(supplier).data,
            status=status.HTTP_200_OK,
        )

    def delete(self, request, pk):
        supplier = self.get_object(pk)
        if not supplier:
            return Response(
                {"error": "Supplier not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Check if supplier has linked products before deleting
        products_count = supplier.products.count()
        if products_count > 0:
            return Response(
                {
                    "error": (
                        f"Cannot delete '{supplier.name}' — "
                        f"it is linked to {products_count} product(s). "
                        "Reassign or remove those products first."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        supplier.delete()

        return Response(
            {"message": f"Supplier '{supplier.name}' deleted successfully."},
            status=status.HTTP_204_NO_CONTENT,
        )


class SupplierMinimalListView(APIView):
    """
    GET /api/suppliers/minimal/
    Returns id + name only — used to populate dropdowns
    in the Products and Stock forms without fetching all fields.
    Only active suppliers are returned.
    """
    permission_classes = [IsAnyRole]

    def get(self, request):
        suppliers = Supplier.objects.filter(is_active=True).only("id", "name")
        serializer = SupplierMinimalSerializer(suppliers, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)