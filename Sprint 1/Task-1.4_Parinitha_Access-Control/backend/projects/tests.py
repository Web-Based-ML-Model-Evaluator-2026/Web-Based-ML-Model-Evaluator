from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from .models import Project

User = get_user_model()

class ProjectAccessAndValidationTests(APITestCase):
    def setUp(self):
        self.alice = User.objects.create_user(username="alice", password="demo-pass-123")
        self.bob = User.objects.create_user(username="bob", password="demo-pass-456")
        self.alice_project = Project.objects.create(owner=self.alice, name="Alice Iris Demo",
                                                    model_name="Iris Flower Classifier")
        self.list_url = reverse("project-list")

    def test_unauthenticated_user_cannot_list_projects(self):
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_user_sees_only_own_projects(self):
        Project.objects.create(owner=self.bob, name="Bob Project", model_name="Iris Flower Classifier")
        self.client.force_authenticate(user=self.alice)
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        names = [item["name"] for item in response.data]
        self.assertIn("Alice Iris Demo", names)
        self.assertNotIn("Bob Project", names)

    def test_user_cannot_retrieve_another_users_project(self):
        self.client.force_authenticate(user=self.bob)
        response = self.client.get(reverse("project-detail", args=[self.alice_project.id]))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_blank_project_name_is_rejected(self):
        self.client.force_authenticate(user=self.alice)
        response = self.client.post(self.list_url, {"name": "   ",
            "model_name": "Iris Flower Classifier", "description": ""}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("name", response.data)

    def test_owner_is_set_from_logged_in_user(self):
        self.client.force_authenticate(user=self.alice)
        response = self.client.post(self.list_url, {"name": "  Iris Evaluation  ",
            "model_name": "Iris Flower Classifier", "description": "",
            "owner": self.bob.id}, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["name"], "Iris Evaluation")
        self.assertEqual(response.data["owner"], self.alice.id)
