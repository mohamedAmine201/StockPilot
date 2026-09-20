from django.db import models
from suppliers.models import Supplier


class Category(models.Model):
    name       = models.CharField(max_length=100, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering  = ["name"]
        verbose_name_plural = "categories"

    def __str__(self):
        return self.name


class Product(models.Model):
    name      = models.CharField(max_length=255)
    sku       = models.CharField(max_length=50, unique=True)
    category  = models.ForeignKey(
        Category, on_delete=models.SET_NULL,
        null=True, blank=True, related_name="products"
    )
    supplier  = models.ForeignKey(
        Supplier, on_delete=models.SET_NULL,
        null=True, blank=True, related_name="products"
    )
    unit            = models.CharField(max_length=20, default="pcs")
    price           = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    stock           = models.PositiveIntegerField(default=0)
    threshold       = models.PositiveIntegerField(default=10)
    description     = models.TextField(blank=True)
    is_active       = models.BooleanField(default=True)
    unit_price      = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    created_at      = models.DateTimeField(auto_now_add=True)
    updated_at      = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return f"{self.name} ({self.sku})"

    @property
    def status(self):
        if self.stock == 0:
            return "out_of_stock"
        if self.stock <= self.threshold:
            return "low_stock"
        return "in_stock"