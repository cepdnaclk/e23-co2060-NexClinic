from celery import shared_task
from django.core.management import call_command

@shared_task
def generate_slots_weekly():
    call_command('generate_appointment_slots', days=14)