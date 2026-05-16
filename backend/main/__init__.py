from .celery import app as celery_app

# Expose celery app as 'celery_app'
__all__ = ('celery_app',)
