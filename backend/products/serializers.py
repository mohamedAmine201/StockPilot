from rest_framework import serializers
from .models import Category, Product
from suppliers.serializers import SupplierMinimalSerializer


class CategorySerializer(serializers.ModelSerializer):
    products_count = serializers.SerializerMethodField()

    class Meta:
        model  = Category
        fields = ["id", "name", "products_count", "created_at"]
        read_only_fields = ["id", "created_at"]

    def get_products_count(self, obj):
        return obj.products.count()

    def validate_name(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Category name cannot be blank.")
        # On update exclude self from uniqueness check
        qs = Category.objects.filter(name__iexact=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("A category with this name already exists.")
        return value


class ProductSerializer(serializers.ModelSerializer):
    """Full read serializer — includes nested category and supplier names."""
    category_name = serializers.CharField(source="category.name", read_only=True, default=None)
    supplier_name = serializers.CharField(source="supplier.name", read_only=True, default=None)
    status        = serializers.CharField(read_only=True)

    class Meta:
        model  = Product
        fields = [
            "id", "name", "sku", "category", "category_name",
            "supplier", "supplier_name", "unit", "unit_price",
            "stock", "threshold", "description", "status",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "status", "created_at", "updated_at"]


class ProductWriteSerializer(serializers.ModelSerializer):
    """Write serializer — accepts category and supplier as IDs."""

    class Meta:
        model  = Product
        fields = [
            "name", "sku", "category", "supplier",
            "unit", "unit_price", "stock", "threshold", "description",
        ]

    def validate_sku(self, value):
        qs = Product.objects.filter(sku=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("A product with this SKU already exists.")
        return value

    def validate_price(self, value):
        if value < 0:
            raise serializers.ValidationError("Price cannot be negative.")
        return value