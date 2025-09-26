# assets/views.py
from rest_framework import viewsets, permissions, parsers, filters, status
from rest_framework.response import Response
from django_filters import rest_framework as django_filters
from .models import User, Asset, Category, Tag, AssetVersion
from .serializers import UserSerializer, AssetSerializer, CategorySerializer, TagSerializer, AssetVersionSerializer
# assets/serializers.py (add this at the bottom or top)
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .serializers import MyTokenObtainPairSerializer

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    serializer_class = MyTokenObtainPairSerializer
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['role'] = user.role  # Add role to JWT claims
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data['role'] = self.user.role  # Include role in response body
        return data

class IsAdminEditorOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        if not request.user or not request.user.is_authenticated:
            return False
        return getattr(request.user, "role", None) in ("admin", "editor")

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        if getattr(request.user, "role", None) == "admin":
            return True
        if getattr(request.user, "role", None) == "editor" and getattr(obj, "uploaded_by", None) == request.user:
            return True
        return False

# assets/views.py
class AssetPermission(permissions.BasePermission):
    """
    Admin: full control
    Editor: can edit own assets, upload
    Viewer: only view/download
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        # SAFE_METHODS = GET/HEAD/OPTIONS → anyone authenticated can view/download
        if request.method in permissions.SAFE_METHODS:
            return True

        # POST = upload
        if request.method == "POST":
            return request.user.role in ["admin", "editor"]

        # PUT/PATCH/DELETE
        return request.user.role in ["admin", "editor"]

    def has_object_permission(self, request, view, obj):
        # SAFE_METHODS = preview/download
        if request.method in permissions.SAFE_METHODS:
            return True

        # Admin can edit any asset
        if request.user.role == "admin":
            return True

        # Editor can edit own assets
        if request.user.role == "editor" and obj.uploaded_by == request.user:
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
        # handle tags passed in request.data (either list of names or objects)
        request = self.request
        tags = request.data.getlist("tags[]") if hasattr(request.data, "getlist") else request.data.get("tags")
        # if uploading a new version for an existing asset, handle parent_id
        parent_id = request.data.get("parent")
        if parent_id:
            try:
                parent_asset = Asset.objects.get(pk=parent_id)
            except Asset.DoesNotExist:
                parent_asset = None
        else:
            parent_asset = None

        # if parent_asset exists -> create a new AssetVersion and increment parent version
        if parent_asset:
            # create version object
            last_version = parent_asset.version or 1
            new_version_num = last_version + 1
            av = AssetVersion.objects.create(
                asset=parent_asset,
                file=request.data.get("file"),
                uploaded_by=request.user,
                version=new_version_num
            )
            # update parent asset version (and optionally file to latest)
            parent_asset.version = new_version_num
            # if you want parent.asset.file to point to latest file:
            parent_asset.file = av.file
            parent_asset.save()
            return
        # Normal asset create
        asset = serializer.save(uploaded_by=self.request.user)
        # tags: could be comma separated names or JSON; handle simple cases:
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
