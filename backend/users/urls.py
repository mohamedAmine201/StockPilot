# users/urls.py
from django.urls import path
from .views import (
    LoginView,
    LogoutView,
    RefreshTokenView,
    MeView,
    CreateUserView,
    UserListView,
    UserDetailView,
    UpdateMeView,
    csrf_cookie
)

urlpatterns = [
    path("csrf/",    csrf_cookie,              name="auth-csrf"),

    # ── Auth ────────────────────────────────────────────
    path("login/",   LoginView.as_view(),        name="auth-login"),
    path("logout/",  LogoutView.as_view(),        name="auth-logout"),
    path("refresh/", RefreshTokenView.as_view(),  name="auth-refresh"),
    path("me/",      MeView.as_view(),            name="auth-me"),
    path("me/update/", UpdateMeView.as_view(), name="auth-me-update"),

    # ── User management (admin only) ────────────────────
    path("users/",          UserListView.as_view(),   name="user-list"),
    path("users/create/",   CreateUserView.as_view(), name="user-create"),
    path("users/<int:pk>/", UserDetailView.as_view(), name="user-detail"),
]