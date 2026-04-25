from django.db.models.signals import pre_save, post_save, post_delete
from django.dispatch import receiver
from .models import Appointment, AppointmentAvailableSlot


@receiver(pre_save, sender=Appointment)
def cache_previous_slot(sender, instance, **kwargs):
    if not instance.pk:
        instance._old_slot_id = None
        return
    try:
        old = Appointment.objects.only("slot_id").get(pk=instance.pk)
        instance._old_slot_id = old.slot_id
    except Appointment.DoesNotExist:
        instance._old_slot_id = None


@receiver(post_save, sender=Appointment)
def update_slot_counts_on_save(sender, instance, **kwargs):
    # Refresh current/new slot
    if instance.slot_id:
        instance.slot.refresh_counts()

    # If slot changed, refresh old slot too
    old_slot_id = getattr(instance, "_old_slot_id", None)
    if old_slot_id and old_slot_id != instance.slot_id:
        old_slot = AppointmentAvailableSlot.objects.filter(pk=old_slot_id).first()
        if old_slot:
            old_slot.refresh_counts()


@receiver(post_delete, sender=Appointment)
def update_slot_counts_on_delete(sender, instance, **kwargs):
    if instance.slot_id:
        slot = AppointmentAvailableSlot.objects.filter(pk=instance.slot_id).first()
        if slot:
            slot.refresh_counts()