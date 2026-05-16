from celery import shared_task
from django.core import management

@shared_task
def generate_slots(days=14):
    """Wrapper task to call the management command that generates appointment slots."""
    try:
        management.call_command('generate_appointment_slots', '--days', str(days))
    except Exception as e:
        # Log, but keep task lightweight; logging configured in Django settings
        import logging
        logger = logging.getLogger(__name__)
        logger.exception('generate_slots task failed: %s', e)
        raise
