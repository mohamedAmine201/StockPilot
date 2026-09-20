from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import CustomUser


class RegisterSerializer(serializers.ModelSerializer):
    """
    Used by the admin to create new user accounts.
    Not exposed publicly — only via CreateUserView (admin only).
    """
    password  = serializers.CharField(
        write_only=True, required=True, validators=[validate_password]
    )
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model  = CustomUser
        fields = ["id", "username", "email", "password", "password2", "role"]
        extra_kwargs = {
            "role": {"required": True},  # admin must explicitly assign a role
        }

    def validate(self, attrs):
        if attrs["password"] != attrs["password2"]:
            raise serializers.ValidationError({"password": "Passwords do not match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop("password2")
        password = validated_data.pop("password")
        user = CustomUser(**validated_data)
        user.set_password(password)
        user.save()
        return user


class UserSerializer(serializers.ModelSerializer):
    """
    Read serializer — returned in login responses, /me/, and user list.
    """
    class Meta:
        model  = CustomUser
        fields = ["id", "username", "email", "role", "is_active", "date_joined"]
        read_only_fields = fields


class LoginSerializer(serializers.Serializer):
    email    = serializers.EmailField(required=True)
    password = serializers.CharField(required=True, write_only=True)