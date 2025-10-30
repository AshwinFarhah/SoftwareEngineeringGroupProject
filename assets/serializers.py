from rest_framework import serializers
from .models import User, Asset, Category, Tag, AssetVersion
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth.hashers import make_password


# ✅ JWT Token Serializer with role
class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["role"] = user.role
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data["role"] = self.user.role
        return data


# ✅ User Serializer for Admin CRUD
class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "first_name",
            "last_name",
            "email",
            "password",
            "role",
        ]
        extra_kwargs = {"password": {"write_only": True}}

    def create(self, validated_data):
        password = validated_data.pop("password", None)
        user = User(**validated_data)
        if password:
            user.set_password(password)
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.password = make_password(password)
        instance.save()
        return instance


# ✅ Tag & Category Serializers
class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ["id", "name"]


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name"]


# ✅ AssetVersion Serializer (with metadata)
class AssetVersionSerializer(serializers.ModelSerializer):
    uploaded_by = UserSerializer(read_only=True)
    category = CategorySerializer(read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    # Optional write-only fields if needed
    category_id = serializers.IntegerField(write_only=True, required=False)
    tag_names = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = AssetVersion
        fields = [
            "id",
            "file",
            "uploaded_at",
            "uploaded_by",
            "version",
            "status",
            "comment",
            "title",
            "description",
            "category",
            "category_id",
            "tags",
            "tag_names",
        ]
        read_only_fields = ["uploaded_at", "uploaded_by", "version", "status"]


# ✅ Asset Serializer (always returns latest approved version)
class AssetSerializer(serializers.ModelSerializer):
    uploaded_by = UserSerializer(read_only=True)
    category_id = serializers.IntegerField(write_only=True, required=False)
    tags = TagSerializer(many=True, read_only=True)
    versions = AssetVersionSerializer(many=True, read_only=True)

    class Meta:
        model = Asset
        fields = [
            "id",
            "title",
            "description",
            "file",
            "uploaded_at",
            "uploaded_by",
            "category_id",
            "tags",
            "metadata",
            "version",
            "parent",
            "versions",
        ]
        read_only_fields = ("uploaded_by", "version", "uploaded_at", "versions")

    def to_representation(self, instance):
        """
        Override default representation to show latest approved version's data
        for title, description, file, category, tags.
        """
        rep = super().to_representation(instance)
        latest = instance.latest_version()
        if latest:
            rep["title"] = latest.title or instance.title
            rep["description"] = latest.description or instance.description
            rep["file"] = latest.file.url if latest.file else instance.file.url
            rep["version"] = latest.version or instance.version
            rep["category"] = CategorySerializer(latest.category).data if latest.category else (
                CategorySerializer(instance.category).data if instance.category else None
            )
            rep["tags"] = TagSerializer(latest.tags.all(), many=True).data
        else:
            rep["title"] = instance.title
            rep["description"] = instance.description
            rep["file"] = instance.file.url if instance.file else None
            rep["version"] = instance.version
            rep["category"] = CategorySerializer(instance.category).data if instance.category else None
            rep["tags"] = TagSerializer(instance.tags.all(), many=True).data
        return rep

    def create(self, validated_data):
        category_id = validated_data.pop("category_id", None)
        tag_names = validated_data.pop("tag_names", None)
        tags_data = validated_data.pop("tags", [])

        asset = Asset.objects.create(**validated_data)

        # assign category if provided
        if category_id:
            try:
                category = Category.objects.get(pk=category_id)
                asset.category = category
            except Category.DoesNotExist:
                pass

        # handle tags (from string or list)
        if tag_names:
            for t in [x.strip() for x in tag_names.split(",") if x.strip()]:
                tag_obj, _ = Tag.objects.get_or_create(name=t)
                asset.tags.add(tag_obj)

        for t in tags_data:
            tag_obj, _ = Tag.objects.get_or_create(name=t.get("name"))
            asset.tags.add(tag_obj)

        asset.save()
        return asset

    def update(self, instance, validated_data):
        category_id = validated_data.pop("category_id", None)
        tag_names = validated_data.pop("tag_names", None)
        tags_data = validated_data.pop("tags", None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        # update category if provided
        if category_id:
            try:
                category = Category.objects.get(pk=category_id)
                instance.category = category
            except Category.DoesNotExist:
                pass

        # update tags
        if tag_names is not None:
            instance.tags.clear()
            for t in [x.strip() for x in tag_names.split(",") if x.strip()]:
                tag_obj, _ = Tag.objects.get_or_create(name=t)
                instance.tags.add(tag_obj)

        if tags_data is not None:
            instance.tags.clear()
            for t in tags_data:
                tag_obj, _ = Tag.objects.get_or_create(name=t.get("name"))
                instance.tags.add(tag_obj)

        instance.save()
        return instance
