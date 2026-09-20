from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import CompanyProfile, InventoryPreferences, NotificationPreferences


class CompanyProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model  = CompanyProfile
        fields = ["name", "address", "phone", "tax_id", "logo", "currency", "updated_at"]
        read_only_fields = ["updated_at"]


class InventoryPreferencesSerializer(serializers.ModelSerializer):
    class Meta:
        model  = InventoryPreferences
        fields = [
            "default_threshold", "default_unit",
            "valuation_method", "allow_negative_stock",
            "updated_at",
        ]
        read_only_fields = ["updated_at"]


class NotificationPreferencesSerializer(serializers.ModelSerializer):
    class Meta:
        model  = NotificationPreferences
        fields = [
            "low_stock_in_app", "low_stock_email",
            "daily_digest", "weekly_digest",
            "alert_threshold", "updated_at",
        ]
        read_only_fields = ["updated_at"]


class PasswordChangeSerializer(serializers.Serializer):
    current_password = serializers.CharField(required=True, write_only=True)
    new_password     = serializers.CharField(
                           required=True,
                           write_only=True,
                           validators=[validate_password],
                       )
    confirm_password = serializers.CharField(required=True, write_only=True)

    def validate(self, attrs):
        if attrs["new_password"] != attrs["confirm_password"]:
            raise serializers.ValidationError(
                {"confirm_password": "Passwords do not match."}
            )
        return attrs

    def validate_current_password(self, value):
        user = self.context["request"].user
        if not user.check_password(value):
            raise serializers.ValidationError("Current password is incorrect.")
        return value