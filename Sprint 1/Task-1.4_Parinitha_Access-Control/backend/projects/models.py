from django.conf import settings
from django.db import models

class Project(models.Model):
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="ml_projects")
    name = models.CharField(max_length=100)
    model_name = models.CharField(max_length=100, default="Iris Flower Classifier")
    description = models.TextField(blank=True, max_length=500)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name
