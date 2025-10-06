# assets/serializers.py
from rest_framework import serializers
from .models import User, Asset, Category, Tag, AssetVersion
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth.hashers import make_password


class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['role'] = user.role
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data['role'] = self.user.role
        return data


# ✅ Updated UserSerializer for Admin CRUD
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
        extra_kwargs = {
            "password": {"write_only": True},
        }

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


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ["id", "name"]


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name"]


class AssetVersionSerializer(serializers.ModelSerializer):
    uploaded_by = UserSerializer(read_only=True)

    class Meta:
        model = AssetVersion
        fields = ["id", "file", "uploaded_at", "uploaded_by", "version"]


class AssetSerializer(serializers.ModelSerializer):
    uploaded_by = UserSerializer(read_only=True)
    category = CategorySerializer(read_only=True)
    tags = TagSerializer(many=True, required=False)
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
            "category",
            "tags",
            "metadata",
            "version",
            "parent",
            "versions",
        ]
        read_only_fields = ("uploaded_by", "version", "uploaded_at", "versions")

    def create(self, validated_data):
        tags_data = validated_data.pop("tags", [])
        asset = Asset.objects.create(**validated_data)
        for t in tags_data:
            tag_obj, _ = Tag.objects.get_or_create(name=t.get("name"))
            asset.tags.add(tag_obj)
        return asset
