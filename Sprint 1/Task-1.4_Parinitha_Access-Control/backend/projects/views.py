from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Project
from .permissions import IsProjectOwner
from .serializers import ProjectSerializer

class ProjectViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticated, IsProjectOwner]

    def get_queryset(self):
        return Project.objects.filter(owner=self.request.user)

    def perform_create(self, serializer):
        # Never trust an owner ID sent by the browser.
        serializer.save(owner=self.request.user)
