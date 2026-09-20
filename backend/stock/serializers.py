from rest_framework import serializers
from .models import StockMovement
from products.models import Product


class StockMovementSerializer(serializers.ModelSerializer):
    """Read serializer — returned in list and detail views."""
    product_name     = serializers.CharField(source="product.name",    read_only=True)
    product_sku      = serializers.CharField(source="product.sku",     read_only=True)
    product_unit     = serializers.CharField(source="product.unit",    read_only=True)
    performed_by_name = serializers.CharField(
                            source="performed_by.username",
                            read_only=True,
                            default="—",
                        )

    class Meta:
        model  = StockMovement
        fields = [
            "id",
            "product", "product_name", "product_sku", "product_unit",
            "movement_type",
            "quantity",
            "unit_cost",
            "reason",
            "reference",
            "performed_by", "performed_by_name",
            "created_at",
        ]


class StockMovementWriteSerializer(serializers.ModelSerializer):
    """Write serializer — used for creating movements."""
    class Meta:
        model  = StockMovement
        fields = [
            "product",
            "movement_type",
            "quantity",
            "unit_cost",
            "reason",
            "reference",
        ]

    def validate(self, attrs):
        product       = attrs["product"]
        movement_type = attrs["movement_type"]
        quantity      = attrs["quantity"]

        if movement_type == StockMovement.OUT and quantity > product.stock:
            raise serializers.ValidationError({
                "quantity": (
                    f"Cannot remove {quantity} units — "
                    f"only {product.stock} in stock."
                )
            })

        return attrs

    def create(self, validated_data):
        # Attach the user from the request context
        user = self.context["request"].user
        return StockMovement.objects.create(
            **validated_data,
            performed_by=user,
        )