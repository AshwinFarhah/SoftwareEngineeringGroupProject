from django.contrib import admin
from django.http import JsonResponse
from django.urls import path, include
from rest_framework import routers
from assets.views import UserViewSet, AssetViewSet, CategoryViewSet, TagViewSet, AssetVersionViewSet
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

router = routers.DefaultRouter()
router.register(r"users", UserViewSet)
router.register(r"assets", AssetViewSet, basename="assets")
router.register(r"categories", CategoryViewSet)
router.register(r"tags", TagViewSet)
router.register(r"versions", AssetVersionViewSet, basename="versions")

def home(request):
    return JsonResponse({"message": "Welcome to the DAM backend API!"})

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include(router.urls)),
    path("api/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
]
