from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Q

from .models import StockMovement
from .serializers import StockMovementSerializer, StockMovementWriteSerializer
from users.permissions import IsAnyRole, IsAdminOrManager


class StockMovementListCreateView(APIView):
    """
    GET  /api/stock/  — list all movements (any authenticated user)
    POST /api/stock/  — create a movement  (admin or manager)

    Query params:
      ?product=id           — filter by product
      ?movement_type=in|out|adjustment
      ?search=name|sku      — filter by product name or SKU
    """
    def get_permissions(self):
        if self.request.method == "GET":
            return [IsAnyRole()]
        return [IsAdminOrManager()]

    def get(self, request):
        qs = StockMovement.objects.select_related(
            "product", "performed_by"
        ).all()

        search = request.query_params.get("search", "").strip()
        if search:
            qs = qs.filter(
                Q(product__name__icontains=search) |
                Q(product__sku__icontains=search)
            )

        product = request.query_params.get("product")
        if product:
            qs = qs.filter(product_id=product)

        movement_type = request.query_params.get("movement_type")
        if movement_type:
            qs = qs.filter(movement_type=movement_type)

        serializer = StockMovementSerializer(qs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = StockMovementWriteSerializer(
            data=request.data,
            context={"request": request},
        )
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        movement = serializer.save()
        return Response(
            StockMovementSerializer(movement).data,
            status=status.HTTP_201_CREATED,
        )


class StockMovementDetailView(APIView):
    """
    GET /api/stock/<id>/  — retrieve a single movement (any authenticated user)

    Note: movements are immutable once created — no PATCH or DELETE.
    To correct a mistake, create a counter-movement.
    """
    permission_classes = [IsAnyRole]

    def get_object(self, pk):
        try:
            return StockMovement.objects.select_related(
                "product", "performed_by"
            ).get(pk=pk)
        except StockMovement.DoesNotExist:
            return None

    def get(self, request, pk):
        movement = self.get_object(pk)
        if not movement:
            return Response(
                {"error": "Movement not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(StockMovementSerializer(movement).data)