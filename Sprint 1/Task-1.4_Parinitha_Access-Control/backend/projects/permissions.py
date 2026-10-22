from rest_framework.permissions import BasePermission

class IsProjectOwner(BasePermission):
    message = "You do not have permission to access this project."

    def has_object_permission(self, request, view, obj):
        return bool(
            request.user
            and request.user.is_authenticated
            and getattr(obj, "owner_id", None) == request.user.id
        )
