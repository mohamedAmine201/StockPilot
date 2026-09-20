from django.db import models
from products.models import Product
from users.models import CustomUser


class StockMovement(models.Model):
    IN  = "in"
    OUT = "out"
    ADJUSTMENT = "adjustment"

    MOVEMENT_TYPE_CHOICES = [
        (IN,         "Stock In"),
        (OUT,        "Stock Out"),
        (ADJUSTMENT, "Adjustment"),
    ]

    product       = models.ForeignKey(
                        Product,
                        on_delete=models.CASCADE,
                        related_name="movements",
                    )
    movement_type = models.CharField(
                        max_length=20,
                        choices=MOVEMENT_TYPE_CHOICES,
                    )
    quantity      = models.PositiveIntegerField()
    unit_cost     = models.DecimalField(
                        max_digits=10,
                        decimal_places=2,
                        null=True,
                        blank=True,
                        help_text="Cost per unit at time of movement (stock-in only).",
                    )
    reason        = models.CharField(max_length=255, blank=True, default="")
    reference     = models.CharField(
                        max_length=100,
                        blank=True,
                        default="",
                        help_text="PO number, invoice ref, etc.",
                    )
    performed_by  = models.ForeignKey(
                        CustomUser,
                        on_delete=models.SET_NULL,
                        null=True,
                        related_name="stock_movements",
                    )
    created_at    = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.movement_type} — {self.product.name} x{self.quantity}"

    def save(self, *args, **kwargs):
        """
        Auto-update product stock on every movement save.
        """
        if self.movement_type == self.IN:
            self.product.stock += self.quantity
        elif self.movement_type == self.OUT:
            self.product.stock = max(0, self.product.stock - self.quantity)
        elif self.movement_type == self.ADJUSTMENT:
            # quantity field holds the new absolute stock level
            self.product.stock = self.quantity

        self.product.save()
        super().save(*args, **kwargs)