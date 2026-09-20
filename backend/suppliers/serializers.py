from rest_framework import serializers
from django.db import models
from django.db.models import Sum, Q, F
from .models import Supplier


class SupplierSerializer(serializers.ModelSerializer):
    """Full serializer — used for list and detail views."""

    # Computed fields — read only
    products_count    = serializers.SerializerMethodField()
    total_movements   = serializers.SerializerMethodField()
    total_value       = serializers.SerializerMethodField()

    class Meta:
        model  = Supplier
        fields = [
            "id",
            "name",
            "contact",
            "email",
            "phone",
            "address",
            "is_active",
            "notes",
            "products_count",
            "total_movements",
            "total_value",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_products_count(self, obj):
        return obj.products.count()

    def get_total_movements(self, obj):
        return 0  # temporary — fix once stock movements app is created

    def get_total_value(self, obj):
        return 0  # temporary — fix once stock movements app is created


    def get_total_movements(self, obj):
        return obj.products.aggregate(
            total=Sum(
                "movements__quantity",
                filter=Q(movements__movement_type="in")
            )
        )["total"] or 0

    def get_total_value(self, obj):
        return obj.products.aggregate(
            total=Sum(
                F("movements__quantity") * F("movements__unit_cost"),
                filter=Q(movements__movement_type="in"),
            )
        )["total"] or 0


class SupplierWriteSerializer(serializers.ModelSerializer):
    """
    Write serializer — used for create and update.
    Keeps validation separate from the computed read fields.
    """
    class Meta:
        model  = Supplier
        fields = [
            "id",
            "name",
            "contact",
            "email",
            "phone",
            "address",
            "is_active",
            "notes",
        ]

    def validate_name(self, value):
        if not value.strip():
            raise serializers.ValidationError("Supplier name cannot be blank.")
        return value.strip()

    def validate_email(self, value):
        # On update, exclude the current instance from uniqueness check
        qs = Supplier.objects.filter(email=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("A supplier with this email already exists.")
        return value


class SupplierMinimalSerializer(serializers.ModelSerializer):
    """
    Minimal serializer — used in Product serializer dropdown
    so the frontend gets id + name without all the computed fields.
    """
    class Meta:
        model  = Supplier
        fields = ["id", "name"]