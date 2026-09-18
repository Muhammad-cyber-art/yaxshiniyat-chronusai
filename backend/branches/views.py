from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from .models import Branch
from .serializers import BranchSerializer


class BranchViewSet(viewsets.ModelViewSet):
    queryset = Branch.objects.filter(is_active=True).order_by("id")
    serializer_class = BranchSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    pagination_class = None