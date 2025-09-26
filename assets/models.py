# assets/models.py
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.conf import settings

class User(AbstractUser):
    ROLE_CHOICES = (
        ("admin", "Admin"),
        ("editor", "Editor"),
        ("viewer", "Viewer"),
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default="viewer")

    def __str__(self):
        return f"{self.username} ({self.role})"

    def can_upload(self):
        return self.role in ["admin", "editor"]

    def can_edit(self, asset):
        return self.role == "admin" or (self.role == "editor" and asset.uploaded_by == self)

    def can_view(self):
        return True


class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    def __str__(self):
        return self.name


class Tag(models.Model):
    name = models.CharField(max_length=100, unique=True)
    def __str__(self):
        return self.name


class Asset(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    file = models.FileField(upload_to="assets/")
    uploaded_at = models.DateTimeField(auto_now_add=True)
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="uploaded_assets"
    )
    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assets"
    )
    tags = models.ManyToManyField(Tag, blank=True, related_name="assets")
    metadata = models.JSONField(blank=True, null=True)  # store custom fields
    version = models.PositiveIntegerField(default=1)
    parent = models.ForeignKey("self", null=True, blank=True, on_delete=models.SET_NULL, related_name="children")

    class Meta:
        ordering = ["-uploaded_at"]

    def __str__(self):
        return f"{self.title} (v{self.version})"


class AssetVersion(models.Model):
    asset = models.ForeignKey(Asset, on_delete=models.CASCADE, related_name="versions")
    file = models.FileField(upload_to="assets/versions/")
    uploaded_at = models.DateTimeField(auto_now_add=True)
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    version = models.PositiveIntegerField()

    class Meta:
        ordering = ["-version"]

    def __str__(self):
        return f"{self.asset.title} (v{self.version})"
