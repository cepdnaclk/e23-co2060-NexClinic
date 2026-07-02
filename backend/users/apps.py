from django.apps import AppConfig


class UsersConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "users"

    def ready(self):
        # Signals are loaded explicitly only where safe; patient profile
        # creation is handled by the registration flow that has full data.
        pass
