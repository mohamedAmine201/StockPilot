from rest_framework import serializers


class CategoryBreakdownSerializer(serializers.Serializer):
    category      = serializers.CharField()
    product_count = serializers.IntegerField()
    total_value   = serializers.DecimalField(max_digits=14, decimal_places=2)
    low_stock     = serializers.IntegerField()
    out_of_stock  = serializers.IntegerField()


class InventoryOverviewSerializer(serializers.Serializer):
    total_products    = serializers.IntegerField()
    total_value       = serializers.DecimalField(max_digits=14, decimal_places=2)
    low_stock_count   = serializers.IntegerField()
    out_of_stock_count = serializers.IntegerField()
    in_stock_count    = serializers.IntegerField()
    categories        = CategoryBreakdownSerializer(many=True)


class MovementSummarySerializer(serializers.Serializer):
    date        = serializers.DateField()
    stock_in    = serializers.IntegerField()
    stock_out   = serializers.IntegerField()
    net         = serializers.IntegerField()


class MovementsReportSerializer(serializers.Serializer):
    total_in       = serializers.IntegerField()
    total_out      = serializers.IntegerField()
    net_change     = serializers.IntegerField()
    total_in_value = serializers.DecimalField(max_digits=14, decimal_places=2)
    daily          = MovementSummarySerializer(many=True)


class SupplierPerformanceSerializer(serializers.Serializer):
    id             = serializers.IntegerField()
    name           = serializers.CharField()
    product_count  = serializers.IntegerField()
    total_received = serializers.IntegerField()   # units
    total_value    = serializers.DecimalField(max_digits=14, decimal_places=2)
    last_delivery  = serializers.DateTimeField(allow_null=True)


class LowStockItemSerializer(serializers.Serializer):
    id           = serializers.IntegerField()
    name         = serializers.CharField()
    sku          = serializers.CharField()
    category     = serializers.CharField()
    supplier     = serializers.CharField(allow_null=True)
    stock        = serializers.IntegerField()
    threshold    = serializers.IntegerField()
    stock_status = serializers.CharField()
    unit         = serializers.CharField()