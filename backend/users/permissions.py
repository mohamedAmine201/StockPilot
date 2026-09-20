from rest_framework.permissions import BasePermission


class IsAdmin(BasePermission):
    """Allows access only to users with the admin role."""
    message = "You do not have permission to perform this action. Admin role required."

    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role == "admin"
        )


class IsAdminOrManager(BasePermission):
    """Allows access to admin and manager roles."""
    message = "You do not have permission to perform this action. Manager role or above required."

    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role in ("admin", "manager")
        )


class IsAnyRole(BasePermission):
    """Allows access to any authenticated user regardless of role."""
    message = "Authentication required."

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)