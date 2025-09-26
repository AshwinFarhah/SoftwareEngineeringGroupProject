# assets/serializers.py
from rest_framework import serializers
from .models import User, Asset, Category, Tag, AssetVersion
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

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


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email", "role"]


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
            "id", "title", "description", "file", "uploaded_at", "uploaded_by",
            "category", "tags", "metadata", "version", "parent", "versions"
        ]
        read_only_fields = ("uploaded_by", "version", "uploaded_at", "versions")

    def create(self, validated_data):
        tags_data = validated_data.pop("tags", [])
        asset = Asset.objects.create(**validated_data)
        for t in tags_data:
            tag_obj, _ = Tag.objects.get_or_create(name=t.get("name"))
            asset.tags.add(tag_obj)
        return asset
