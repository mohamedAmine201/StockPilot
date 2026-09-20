from django.db.models import Q
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from users.permissions import IsAdmin, IsAdminOrManager, IsAnyRole
from .models import Category, Product
from .serializers import (
    CategorySerializer,
    ProductSerializer,
    ProductWriteSerializer,
)


# ─────────────────────────────────────────────────────────
# Category views
# ─────────────────────────────────────────────────────────

class CategoryListCreateView(APIView):
    """
    GET  /api/products/categories/  — list all categories with product count
    POST /api/products/categories/  — create a category (admin/manager)

    The Settings page calls GET here to render the read-only category list.
    Categories are also created implicitly when a product is saved with a
    new category name — but an explicit POST lets managers add them upfront.
    """

    def get_permissions(self):
        if self.request.method == "GET":
            return [IsAnyRole()]
        return [IsAdminOrManager()]

    def get(self, request):
        qs = Category.objects.all()
        serializer = CategorySerializer(qs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = CategorySerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        category = serializer.save()
        return Response(
            CategorySerializer(category).data,
            status=status.HTTP_201_CREATED,
        )


class CategoryDetailView(APIView):
    """
    GET    /api/products/categories/<id>/  — get single category  (any role)
    PATCH  /api/products/categories/<id>/  — rename               (admin/manager)
    DELETE /api/products/categories/<id>/  — delete               (admin only)
    """

    def get_permissions(self):
        if self.request.method == "GET":
            return [IsAnyRole()]
        if self.request.method == "DELETE":
            return [IsAdmin()]
        return [IsAdminOrManager()]

    def get_object(self, pk):
        try:
            return Category.objects.get(pk=pk)
        except Category.DoesNotExist:
            return None

    def get(self, request, pk):
        cat = self.get_object(pk)
        if not cat:
            return Response({"error": "Category not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(CategorySerializer(cat).data)

    def patch(self, request, pk):
        cat = self.get_object(pk)
        if not cat:
            return Response({"error": "Category not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = CategorySerializer(cat, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        cat = serializer.save()
        return Response(CategorySerializer(cat).data)

    def delete(self, request, pk):
        cat = self.get_object(pk)
        if not cat:
            return Response({"error": "Category not found."}, status=status.HTTP_404_NOT_FOUND)

        products_count = cat.products.count()
        if products_count > 0:
            return Response(
                {
                    "error": (
                        f"Cannot delete '{cat.name}' — "
                        f"it is linked to {products_count} product(s). "
                        "Reassign those products first."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        cat.delete()
        return Response(
            {"message": f"Category '{cat.name}' deleted."},
            status=status.HTTP_204_NO_CONTENT,
        )


# ─────────────────────────────────────────────────────────
# Product views
# ─────────────────────────────────────────────────────────

class ProductListCreateView(APIView):
    """
    GET  /api/products/  — list products with filters
    POST /api/products/  — create a product (admin/manager)

    Query params:
      ?search=term          filter by name or SKU
      ?category=<id>        filter by category ID
      ?supplier=<id>        filter by supplier ID
      ?status=in_stock|low_stock|out_of_stock
    """

    def get_permissions(self):
        if self.request.method == "GET":
            return [IsAnyRole()]
        return [IsAdminOrManager()]

    def get(self, request):
        qs = Product.objects.select_related("category", "supplier").all()

        search = request.query_params.get("search", "").strip()
        if search:
            qs = qs.filter(
                Q(name__icontains=search) | Q(sku__icontains=search)
            )

        category = request.query_params.get("category")
        if category:
            qs = qs.filter(category_id=category)

        supplier = request.query_params.get("supplier")
        if supplier:
            qs = qs.filter(supplier_id=supplier)

        status_filter = request.query_params.get("status")
        if status_filter == "out_of_stock":
            qs = qs.filter(stock=0)
        elif status_filter == "low_stock":
            # stock > 0 AND stock <= threshold
            from django.db.models import F
            qs = qs.filter(stock__gt=0, stock__lte=F("threshold"))
        elif status_filter == "in_stock":
            from django.db.models import F
            qs = qs.filter(stock__gt=F("threshold"))

        serializer = ProductSerializer(qs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = ProductWriteSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        product = serializer.save()
        return Response(
            ProductSerializer(product).data,
            status=status.HTTP_201_CREATED,
        )


class ProductDetailView(APIView):
    """
    GET    /api/products/<id>/  — get single product   (any role)
    PATCH  /api/products/<id>/  — partial update        (admin/manager)
    DELETE /api/products/<id>/  — delete                (admin only)
    """

    def get_permissions(self):
        if self.request.method == "GET":
            return [IsAnyRole()]
        if self.request.method == "DELETE":
            return [IsAdmin()]
        return [IsAdminOrManager()]

    def get_object(self, pk):
        try:
            return Product.objects.select_related("category", "supplier").get(pk=pk)
        except Product.DoesNotExist:
            return None

    def get(self, request, pk):
        product = self.get_object(pk)
        if not product:
            return Response({"error": "Product not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(ProductSerializer(product).data)

    def patch(self, request, pk):
        product = self.get_object(pk)
        if not product:
            return Response({"error": "Product not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = ProductWriteSerializer(product, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        product = serializer.save()
        return Response(ProductSerializer(product).data)

    def delete(self, request, pk):
        product = self.get_object(pk)
        if not product:
            return Response({"error": "Product not found."}, status=status.HTTP_404_NOT_FOUND)
        name = product.name
        product.delete()
        return Response(
            {"message": f"Product '{name}' deleted."},
            status=status.HTTP_204_NO_CONTENT,
        )


class LowStockProductsView(APIView):
    """
    GET /api/products/low-stock/
    Returns products where stock <= threshold.
    Used by the dashboard and the stock page banner.
    """
    permission_classes = [IsAnyRole]

    def get(self, request):
        from django.db.models import F
        qs = (
            Product.objects
            .select_related("category", "supplier")
            .filter(stock__lte=F("threshold"))
            .order_by("stock")
        )
        return Response(ProductSerializer(qs, many=True).data)