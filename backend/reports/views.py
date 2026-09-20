# reports/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from django.db.models import (
    Sum, Count, F, Q, DecimalField, ExpressionWrapper
)
from django.db.models.functions import TruncDate
from django.utils import timezone
from datetime import timedelta

from products.models import Product
from stock.models import StockMovement
from suppliers.models import Supplier

from .serializers import (
    InventoryOverviewSerializer,
    MovementsReportSerializer,
    SupplierPerformanceSerializer,
    LowStockItemSerializer,
)


def parse_date_range(request):
    """
    Reads ?range=week|month|quarter|year from query params.
    Returns (start_date, end_date) as aware datetimes.
    """
    range_param = request.query_params.get("range", "month")
    end   = timezone.now()

    if range_param == "week":
        start = end - timedelta(days=7)
    elif range_param == "month":
        start = end - timedelta(days=30)
    elif range_param == "quarter":
        start = end - timedelta(days=90)
    elif range_param == "year":
        start = end - timedelta(days=365)
    else:
        start = end - timedelta(days=30)  # default to month

    return start, end


class InventoryOverviewView(APIView):
    """
    GET /api/reports/inventory/
    Returns a full snapshot of the current inventory state.

    No date range — always reflects current stock levels.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        products = Product.objects.filter(is_active=True).select_related("supplier")

        total_products     = products.count()
        low_stock_count    = products.filter(stock__gt=0, stock__lte=F("threshold")).count()
        out_of_stock_count = products.filter(stock=0).count()
        in_stock_count     = products.filter(stock__gt=F("threshold")).count()

        # Total inventory value = sum(stock * unit_price)
        total_value = products.aggregate(
            total=Sum(
                ExpressionWrapper(
                    F("stock") * F("unit_price"),
                    output_field=DecimalField(max_digits=14, decimal_places=2),
                )
            )
        )["total"] or 0

        # Per-category breakdown
        categories_raw = (
            products.values("category")
            .annotate(
                product_count=Count("id"),
                total_value=Sum(
                    ExpressionWrapper(
                        F("stock") * F("unit_price"),
                        output_field=DecimalField(max_digits=14, decimal_places=2),
                    )
                ),
                low_stock=Count("id", filter=Q(stock__gt=0, stock__lte=F("threshold"))),
                out_of_stock=Count("id", filter=Q(stock=0)),
            )
            .order_by("category")
        )

        data = {
            "total_products":     total_products,
            "total_value":        total_value,
            "low_stock_count":    low_stock_count,
            "out_of_stock_count": out_of_stock_count,
            "in_stock_count":     in_stock_count,
            "categories": [
                {
                    "category":      row["category"],
                    "product_count": row["product_count"],
                    "total_value":   row["total_value"] or 0,
                    "low_stock":     row["low_stock"],
                    "out_of_stock":  row["out_of_stock"],
                }
                for row in categories_raw
            ],
        }

        serializer = InventoryOverviewSerializer(data)
        return Response(serializer.data, status=status.HTTP_200_OK)


class MovementsReportView(APIView):
    """
    GET /api/reports/movements/
    Aggregate stock movement data over a date range.

    Query params:
      ?range=week|month|quarter|year  (default: month)
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        start, end = parse_date_range(request)

        movements = StockMovement.objects.filter(
            created_at__gte=start,
            created_at__lte=end,
        )

        # Top-level totals
        totals = movements.aggregate(
            total_in=Sum("quantity", filter=Q(movement_type="in")),
            total_out=Sum("quantity", filter=Q(movement_type="out")),
            total_in_value=Sum(
                ExpressionWrapper(
                    F("quantity") * F("unit_cost"),
                    output_field=DecimalField(max_digits=14, decimal_places=2),
                ),
                filter=Q(movement_type="in", unit_cost__isnull=False),
            ),
        )

        total_in    = totals["total_in"]    or 0
        total_out   = totals["total_out"]   or 0
        in_value    = totals["total_in_value"] or 0

        # Daily breakdown
        daily_raw = (
            movements
            .annotate(date=TruncDate("created_at"))
            .values("date")
            .annotate(
                stock_in=Sum("quantity",  filter=Q(movement_type="in")),
                stock_out=Sum("quantity", filter=Q(movement_type="out")),
            )
            .order_by("date")
        )

        daily = [
            {
                "date":      row["date"],
                "stock_in":  row["stock_in"]  or 0,
                "stock_out": row["stock_out"] or 0,
                "net":       (row["stock_in"] or 0) - (row["stock_out"] or 0),
            }
            for row in daily_raw
        ]

        data = {
            "total_in":       total_in,
            "total_out":      total_out,
            "net_change":     total_in - total_out,
            "total_in_value": in_value,
            "daily":          daily,
        }

        serializer = MovementsReportSerializer(data)
        return Response(serializer.data, status=status.HTTP_200_OK)


class SupplierPerformanceView(APIView):
    """
    GET /api/reports/suppliers/
    Per-supplier: product count, units received, total value, last delivery.

    Query params:
      ?range=week|month|quarter|year  (default: month)
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        start, end = parse_date_range(request)

        suppliers = Supplier.objects.filter(is_active=True).prefetch_related(
            "products__movements"
        )

        result = []
        for supplier in suppliers:
            products = supplier.products.filter(is_active=True)

            movements_qs = StockMovement.objects.filter(
                product__in=products,
                movement_type="in",
                created_at__gte=start,
                created_at__lte=end,
            )

            agg = movements_qs.aggregate(
                total_received=Sum("quantity"),
                total_value=Sum(
                    ExpressionWrapper(
                        F("quantity") * F("unit_cost"),
                        output_field=DecimalField(max_digits=14, decimal_places=2),
                    ),
                    filter=Q(unit_cost__isnull=False),
                ),
            )

            last_movement = movements_qs.order_by("-created_at").first()

            result.append({
                "id":             supplier.id,
                "name":           supplier.name,
                "product_count":  products.count(),
                "total_received": agg["total_received"] or 0,
                "total_value":    agg["total_value"]    or 0,
                "last_delivery":  last_movement.created_at if last_movement else None,
            })

        # Sort by total_received descending
        result.sort(key=lambda x: x["total_received"], reverse=True)

        serializer = SupplierPerformanceSerializer(result, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class LowStockReportView(APIView):
    """
    GET /api/reports/low-stock/
    All products at or below their reorder threshold.
    Includes out-of-stock items.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        products = (
            Product.objects
            .filter(is_active=True, stock__lte=F("threshold"))
            .select_related("supplier")
            .order_by("stock")
        )

        result = [
            {
                "id":           p.id,
                "name":         p.name,
                "sku":          p.sku,
                "category":     p.category,
                "supplier":     p.supplier.name if p.supplier else None,
                "stock":        p.stock,
                "threshold":    p.threshold,
                "stock_status": p.stock_status,
                "unit":         p.unit,
            }
            for p in products
        ]

        serializer = LowStockItemSerializer(result, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    



from django.utils.timezone import now
from datetime import timedelta



class DashboardView(APIView):
    """
    GET /api/reports/dashboard/
    Single endpoint — returns everything the dashboard needs in one call.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        today     = now()
        week_ago  = today - timedelta(days=7)
        two_weeks = today - timedelta(days=14)

        products = Product.objects.all()

        # ── Stat cards ────────────────────────────────────

        total_products = products.count()

        inventory_value = products.aggregate(
            total=Sum(
                ExpressionWrapper(
                    F("stock") * F("price"),   # field is "price" not "unit_price"
                    output_field=DecimalField(max_digits=14, decimal_places=2),
                )
            )
        )["total"] or 0

        low_stock_count = products.filter(
            stock__gt=0, stock__lte=F("threshold")
        ).count() + products.filter(stock=0).count()

        movements_this_week = StockMovement.objects.filter(
            created_at__gte=week_ago
        ).count()

        movements_last_week = StockMovement.objects.filter(
            created_at__gte=two_weeks,
            created_at__lt=week_ago,
        ).count()

        # ── Low stock table ───────────────────────────────
        # select_related includes "category" so no extra query per row
        low_stock_products = (
            products
            .filter(stock__lte=F("threshold"))
            .select_related("category", "supplier")
            .order_by("stock")[:8]
        )

        low_stock_data = [
            {
                "id":        p.id,
                "name":      p.name,
                "sku":       p.sku,
                "category":  p.category.name if p.category else None,
                "stock":     p.stock,
                "threshold": p.threshold,
            }
            for p in low_stock_products
        ]

        # ── Line chart — last 7 days daily in/out ─────────
        daily_raw = (
            StockMovement.objects
            .filter(created_at__gte=week_ago)
            .annotate(date=TruncDate("created_at"))
            .values("date")
            .annotate(
                stock_in=Sum(
                    "quantity",
                    filter=Q(movement_type="in"),
                ),
                stock_out=Sum(
                    "quantity",
                    filter=Q(movement_type="out"),
                ),
            )
            .order_by("date")
        )

        # Fill in zeros for days with no movements
        daily_map = {row["date"]: row for row in daily_raw}
        movement_chart = []
        for i in range(6, -1, -1):
            d   = (today - timedelta(days=i)).date()
            row = daily_map.get(d, {})
            movement_chart.append({
                "day": d.strftime("%a"),
                "in":  row.get("stock_in",  0) or 0,
                "out": row.get("stock_out", 0) or 0,
            })

        # ── Donut chart — product count by category ───────
        category_raw = (
            products
            .values("category__name")
            .annotate(value=Count("id"))
            .order_by("-value")
        )
        category_chart = [
            {
                "name":  row["category__name"] or "Uncategorised",
                "value": row["value"],
            }
            for row in category_raw
        ]

        # ── Recent activity — last 8 movements ────────────
        recent = (
            StockMovement.objects
            .select_related("product")
            .order_by("-created_at")[:8]
        )

        def time_ago(dt):
            diff    = today - dt
            seconds = int(diff.total_seconds())
            if seconds < 60:
                return "Just now"
            if seconds < 3600:
                m = seconds // 60
                return f"{m} minute{'s' if m != 1 else ''} ago"
            if seconds < 86400:
                h = seconds // 3600
                return f"{h} hour{'s' if h != 1 else ''} ago"
            if seconds < 172800:
                return "Yesterday"
            d = seconds // 86400
            return f"{d} days ago"

        recent_activity = [
            {
                "product":  m.product.name,
                "type":     m.movement_type,
                "quantity": m.quantity,
                "time":     time_ago(m.created_at),
            }
            for m in recent
        ]

        return Response({
            "stats": {
                "inventory_value":     float(inventory_value),
                "total_products":      total_products,
                "low_stock_count":     low_stock_count,
                "movements_7d":        movements_this_week,
                "movements_last_week": movements_last_week,
            },
            "low_stock":       low_stock_data,
            "movement_chart":  movement_chart,
            "category_chart":  category_chart,
            "recent_activity": recent_activity,
        })