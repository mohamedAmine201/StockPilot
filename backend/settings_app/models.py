from django.db import models
from users.models import CustomUser


class CompanyProfile(models.Model):
    """
    Singleton — only one row ever exists.
    Represents the business using StockPilot.
    """
    name     = models.CharField(max_length=255, default="My Company")
    address  = models.CharField(max_length=500, blank=True, default="")
    phone    = models.CharField(max_length=50,  blank=True, default="")
    tax_id   = models.CharField(max_length=100, blank=True, default="")
    currency = models.CharField(max_length=50,  default="DA — Algerian Dinar")

    logo = models.ImageField(
        upload_to="company_logos/",
        blank=True,
        null=True,
    )

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Company Profile"

    def __str__(self):
        return self.name

    @classmethod
    def get(cls):
        """Always return the single instance, creating it if needed."""
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj


class InventoryPreferences(models.Model):
    """
    Singleton — global inventory defaults.
    """
    VALUATION_CHOICES = [
        ("weighted_average", "Weighted Average"),
        ("fifo",             "FIFO"),
        ("last_purchase",    "Last Purchase Price"),
    ]

    default_threshold    = models.PositiveIntegerField(default=10)
    default_unit         = models.CharField(max_length=20, default="pcs")
    valuation_method     = models.CharField(
                               max_length=30,
                               choices=VALUATION_CHOICES,
                               default="weighted_average",
                           )
    allow_negative_stock = models.BooleanField(default=False)

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Inventory Preferences"

    @classmethod
    def get(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj


class NotificationPreferences(models.Model):
    """
    Per-user notification settings.
    """
    user              = models.OneToOneField(
                            CustomUser,
                            on_delete=models.CASCADE,
                            related_name="notification_prefs",
                        )
    low_stock_in_app  = models.BooleanField(default=True)
    low_stock_email   = models.BooleanField(default=True)
    daily_digest      = models.BooleanField(default=False)
    weekly_digest     = models.BooleanField(default=True)
    alert_threshold   = models.PositiveIntegerField(default=20)

    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Notification prefs — {self.user.username}"

    @classmethod
    def get_for_user(cls, user):
        obj, _ = cls.objects.get_or_create(user=user)
        return obj