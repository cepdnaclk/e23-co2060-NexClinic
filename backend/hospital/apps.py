from django.apps import AppConfig
import logging
from django.conf import settings


class HospitalConfig(AppConfig):
    name = "hospital"
    verbose_name = "Hospital"

    def ready(self):
        # Import signal handlers to register them
        try:
            import hospital.signals  # noqa: F401
        except Exception as exc:
            # Log the exception so import issues are visible during startup.
            logger = logging.getLogger(__name__)
            logger.exception("Failed to import hospital.signals: %s", exc)
            # In debug mode, re-raise to surface the error during development
            if getattr(settings, 'DEBUG', False):
                raise
