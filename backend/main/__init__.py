"""Project package init.

Guard the Celery import so management commands still run when Celery
is not installed in a minimal development environment.
"""
import logging

try:
	from .celery import app as celery_app
except Exception as exc:  # Avoid failing import if celery isn't available
	celery_app = None
	logging.getLogger(__name__).warning(
		"Celery app not available (celery import failed): %s", exc
	)

# Expose celery_app (may be None if Celery isn't installed)
__all__ = ('celery_app',)
