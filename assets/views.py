# assets/views.py
from rest_framework import viewsets, permissions, parsers, filters
from rest_framework.response import Response
from django_filters import rest_framework as django_filters
from .models import User, Asset, Category, Tag, AssetVersion
from .serializers import (
    UserSerializer, AssetSerializer, CategorySerializer,
    TagSerializer, AssetVersionSerializer, MyTokenObtainPairSerializer
)
from rest_framework_simplejwt.views import TokenObtainPairView


class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer


class IsAdminEditorOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return getattr(request.user, "role", None) in ("admin", "editor")

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        if getattr(request.user, "role", None) == "admin":
            return True
        if getattr(request.user, "role", None) == "editor" and getattr(obj, "uploaded_by", None) == request.user:
            return True
        return False


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAdminUser]


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticated]


class TagViewSet(viewsets.ModelViewSet):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    permission_classes = [permissions.IsAuthenticated]


class AssetFilter(django_filters.FilterSet):
    tags = django_filters.CharFilter(field_name="tags__name", lookup_expr="icontains")
    date_from = django_filters.DateFilter(field_name="uploaded_at", lookup_expr="gte")
    date_to = django_filters.DateFilter(field_name="uploaded_at", lookup_expr="lte")
    category = django_filters.NumberFilter(field_name="category__id")

    class Meta:
        model = Asset
        fields = ["uploaded_by", "category", "tags", "date_from", "date_to"]


class AssetViewSet(viewsets.ModelViewSet):
    queryset = Asset.objects.prefetch_related("tags", "versions", "category").all()
    serializer_class = AssetSerializer
    permission_classes = [IsAdminEditorOrReadOnly]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser]
    filter_backends = [django_filters.DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = AssetFilter
    search_fields = ["title", "description", "metadata"]
    ordering_fields = ["uploaded_at", "title"]

    def perform_create(self, serializer):
        request = self.request
        tags = request.data.getlist("tags[]") if hasattr(request.data, "getlist") else request.data.get("tags")
        parent_id = request.data.get("parent")
        parent_asset = Asset.objects.filter(pk=parent_id).first() if parent_id else None

        if parent_asset:
            last_version = parent_asset.version or 1
            new_version_num = last_version + 1
            av = AssetVersion.objects.create(
                asset=parent_asset,
                file=request.data.get("file"),
                uploaded_by=request.user,
                version=new_version_num
            )
            parent_asset.version = new_version_num
            parent_asset.file = av.file
            parent_asset.save()
            return

        asset = serializer.save(uploaded_by=self.request.user)
        if tags:
            if isinstance(tags, str):
                tag_names = [t.strip() for t in tags.split(",") if t.strip()]
            elif isinstance(tags, (list, tuple)):
                tag_names = tags
            else:
                tag_names = []
            for tname in tag_names:
                tag_obj, _ = Tag.objects.get_or_create(name=tname)
                asset.tags.add(tag_obj)
        return asset


class AssetVersionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AssetVersion.objects.select_related("uploaded_by", "asset").all()
    serializer_class = AssetVersionSerializer
    permission_classes = [permissions.IsAuthenticated]
