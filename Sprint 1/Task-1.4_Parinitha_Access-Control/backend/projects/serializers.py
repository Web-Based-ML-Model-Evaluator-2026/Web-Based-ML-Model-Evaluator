from rest_framework import serializers
from .models import Project

class ProjectSerializer(serializers.ModelSerializer):
    owner = serializers.ReadOnlyField(source="owner_id")

    class Meta:
        model = Project
        fields = ["id", "name", "model_name", "description", "owner", "created_at"]
        read_only_fields = ["id", "owner", "created_at"]

    def validate_name(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Project name cannot be blank.")
        if len(value) > 100:
            raise serializers.ValidationError("Project name must be 100 characters or fewer.")
        return value

    def validate_model_name(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Model name cannot be blank.")
        if len(value) > 100:
            raise serializers.ValidationError("Model name must be 100 characters or fewer.")
        return value

    def validate_description(self, value):
        value = value.strip()
        if len(value) > 500:
            raise serializers.ValidationError("Description must be 500 characters or fewer.")
        return value
