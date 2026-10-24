# Example: include this in the Django project's root urls.py
from django.urls import include, path

urlpatterns = [path("api/", include("projects.urls"))]
