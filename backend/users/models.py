from django.contrib.auth.models import AbstractUser
from django.db import models


class CustomUser(AbstractUser):
    ADMIN   = "admin"
    MANAGER = "manager"
    STAFF   = "staff"

    ROLE_CHOICES = [
        (ADMIN,   "Admin"),
        (MANAGER, "Manager"),
        (STAFF,   "Staff"),
    ]

    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default=STAFF,
    )

    # Makes email the unique identifier instead of username
    email = models.EmailField(unique=True)

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"

    @property
    def is_admin(self):
        return self.role == self.ADMIN

    @property
    def is_manager(self):
        return self.role == self.MANAGER

    @property
    def is_staff_member(self):
        return self.role == self.STAFF