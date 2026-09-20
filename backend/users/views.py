from django.contrib.auth import authenticate
from django.middleware.csrf import get_token
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError

from .models import CustomUser
from .serializers import RegisterSerializer, LoginSerializer, UserSerializer
from .permissions import IsAdmin


# ── Cookie config ────────────────────────────────────────
# Centralised so changing these affects login, refresh, logout together.
ACCESS_COOKIE  = "access"
REFRESH_COOKIE = "refresh"

COOKIE_DEFAULTS = {
    "httponly": True,       # JS cannot read the cookie — prevents XSS token theft
    "secure":   False,      # Set to True in production (requires HTTPS)
    "samesite": "Lax",      # Prevents CSRF on cross-site requests
    "path":     "/",
}

ACCESS_MAX_AGE  = 30 * 60          # 30 minutes  (matches SIMPLE_JWT setting)
REFRESH_MAX_AGE = 7 * 24 * 60 * 60 # 7 days      (matches SIMPLE_JWT setting)


def get_tokens_for_user(user):
    """
    Generate access + refresh tokens and inject custom claims
    (role, username, email) so the frontend never needs a
    separate /me call to know who is logged in.
    """
    refresh = RefreshToken.for_user(user)

    refresh["role"]     = user.role
    refresh["username"] = user.username
    refresh["email"]    = user.email

    return refresh


def set_auth_cookies(response, refresh_token):
    """
    Write both tokens into HttpOnly cookies on the response.
    The access token lives in 'access' cookie (30 min).
    The refresh token lives in 'refresh' cookie (7 days).
    """
    response.set_cookie(
        ACCESS_COOKIE,
        str(refresh_token.access_token),
        max_age=ACCESS_MAX_AGE,
        **COOKIE_DEFAULTS,
    )
    response.set_cookie(
        REFRESH_COOKIE,
        str(refresh_token),
        max_age=REFRESH_MAX_AGE,
        **COOKIE_DEFAULTS,
    )


def clear_auth_cookies(response):
    response.set_cookie(
        ACCESS_COOKIE,
        value="",
        max_age=0,
        **COOKIE_DEFAULTS,
    )
    response.set_cookie(
        REFRESH_COOKIE,
        value="",
        max_age=0,
        **COOKIE_DEFAULTS,
    )


class LoginView(APIView):
    """
    POST /api/auth/login/
    Public — no auth required.
    Body: { email, password }

    On success:
      - Sets HttpOnly 'access'  cookie (30 min)
      - Sets HttpOnly 'refresh' cookie (7 days)
      - Returns { user } in the response body (no tokens in body)
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        email    = serializer.validated_data["email"]
        password = serializer.validated_data["password"]

        try:
            user_obj = CustomUser.objects.get(email=email)
        except CustomUser.DoesNotExist:
            return Response(
                {"error": "Invalid email or password."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        user = authenticate(request, username=user_obj.username, password=password)
        if user is None:
            return Response(
                {"error": "Invalid email or password."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if not user.is_active:
            return Response(
                {"error": "This account has been deactivated. Contact your administrator."},
                status=status.HTTP_403_FORBIDDEN,
            )

        refresh  = get_tokens_for_user(user)
        response = Response(
            {"user": UserSerializer(user).data},
            status=status.HTTP_200_OK,
        )
        set_auth_cookies(response, refresh)
        return response


class LogoutView(APIView):
    """
    POST /api/auth/logout/
    Authenticated — reads refresh token from HttpOnly cookie,
    blacklists it, then clears both cookies.
    Body: empty
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.COOKIES.get(REFRESH_COOKIE)

        if not refresh_token:
            return Response(
                {"error": "No refresh token found."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except TokenError:
            # Token already expired or invalid — still clear cookies
            pass

        response = Response(
            {"message": "Logged out successfully."},
            status=status.HTTP_200_OK,
        )
        clear_auth_cookies(response)
        return response


# users/views.py — only RefreshTokenView needs changing
class RefreshTokenView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        refresh_token = request.COOKIES.get(REFRESH_COOKIE)

        if not refresh_token:
            return Response(
                {"error": "No refresh token found."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        try:
            old_refresh = RefreshToken(refresh_token)
            user        = CustomUser.objects.get(id=old_refresh["user_id"])
            new_refresh = get_tokens_for_user(user)   # generate first

            old_refresh.blacklist()                   # blacklist after — safe now

            response = Response(
                {"message": "Token refreshed."},
                status=status.HTTP_200_OK,
            )
            set_auth_cookies(response, new_refresh)
            return response

        except (TokenError, CustomUser.DoesNotExist):
            response = Response(
                {"error": "Invalid or expired refresh token. Please log in again."},
                status=status.HTTP_401_UNAUTHORIZED,
            )
            clear_auth_cookies(response)
            return response


class MeView(APIView):
    """
    GET /api/auth/me/
    Returns the currently authenticated user's profile.
    Used to re-hydrate frontend auth state on page refresh.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(
            UserSerializer(request.user).data,
            status=status.HTTP_200_OK,
        )


class UpdateMeView(APIView):
    """
    PATCH /api/auth/me/update/
    Authenticated user updates their own username and email.
    """
    permission_classes = [IsAuthenticated]

    def patch(self, request):
        user = request.user
        allowed = {"username", "email"}
        data = {k: v for k, v in request.data.items() if k in allowed}

        if "email" in data:
            if CustomUser.objects.filter(email=data["email"]).exclude(pk=user.pk).exists():
                return Response(
                    {"email": "This email is already in use."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            user.email = data["email"]

        if "username" in data:
            user.username = data["username"]

        user.save()
        return Response(UserSerializer(user).data, status=status.HTTP_200_OK)

class CreateUserView(APIView):
    """
    POST /api/auth/users/create/
    Admin-only — creates a new user account.
    Body: { username, email, password, password2, role }
    """
    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user = serializer.save()

        return Response(
            {"user": UserSerializer(user).data},
            status=status.HTTP_201_CREATED,
        )


class UserListView(APIView):
    """
    GET /api/auth/users/
    Admin-only — list all users.
    """
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        users = CustomUser.objects.all().order_by("date_joined")
        return Response(
            UserSerializer(users, many=True).data,
            status=status.HTTP_200_OK,
        )


class UserDetailView(APIView):
    """
    GET    /api/auth/users/<id>/  — get single user   (admin only)
    PATCH  /api/auth/users/<id>/  — update role/status (admin only)
    DELETE /api/auth/users/<id>/  — soft delete        (admin only)
    """
    permission_classes = [IsAuthenticated, IsAdmin]

    def get_object(self, pk):
        try:
            return CustomUser.objects.get(pk=pk)
        except CustomUser.DoesNotExist:
            return None

    def get(self, request, pk):
        user = self.get_object(pk)
        if not user:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(UserSerializer(user).data)

    def patch(self, request, pk):
        user = self.get_object(pk)
        if not user:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        allowed_fields = {"role", "is_active"}
        data = {k: v for k, v in request.data.items() if k in allowed_fields}

        if "role" in data and data["role"] not in dict(CustomUser.ROLE_CHOICES):
            return Response(
                {"error": f"Invalid role. Choose from {list(dict(CustomUser.ROLE_CHOICES).keys())}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        for attr, value in data.items():
            setattr(user, attr, value)
        user.save()

        return Response(UserSerializer(user).data, status=status.HTTP_200_OK)

    def delete(self, request, pk):
        user = self.get_object(pk)
        if not user:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        if user == request.user:
            return Response(
                {"error": "You cannot deactivate your own account."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.is_active = False
        user.save()

        return Response(
            {"message": f"User {user.username} has been deactivated."},
            status=status.HTTP_200_OK,
        )
    

from django.middleware.csrf import get_token
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny

# users/views.py
@api_view(["GET"])
@permission_classes([AllowAny])
def csrf_cookie(request):
    token = get_token(request)  # sets the cookie AND returns the token
    return Response({"csrfToken": token})