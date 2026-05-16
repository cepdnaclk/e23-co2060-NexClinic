from django.apps import AppConfig


class HospitalConfig(AppConfig):
    name = "hospital"
    verbose_name = "Hospital"

    def ready(self):
        # Import signal handlers to register them
        try:
            import hospital.signals  # noqa: F401
        except Exception:
            pass
