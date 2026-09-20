from django.db import models


class Supplier(models.Model):
    name         = models.CharField(max_length=255)
    contact      = models.CharField(max_length=255, blank=True)
    email        = models.EmailField(unique=True)
    phone        = models.CharField(max_length=30, blank=True)
    address      = models.TextField(blank=True)
    is_active    = models.BooleanField(default=True)
    notes        = models.TextField(blank=True)
    created_at   = models.DateTimeField(auto_now_add=True)
    updated_at   = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name