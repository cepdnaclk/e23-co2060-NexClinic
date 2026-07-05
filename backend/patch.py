import sys
import re

with open('doctor/views.py', 'r', encoding='utf-8') as f:
    text = f.read()

old_regex = r'        updated_template = serializer\.save\(\)\s*return Response\(\s*\{"template": SlotTemplateSerializer\(updated_template\)\.data\},\s*status=status\.HTTP_200_OK,\s*\)'

patch = '''        old_is_active = template.is_active
        updated_template = serializer.save()

        now = timezone.now()
        if "is_active" in serializer.validated_data and updated_template.is_active != old_is_active:
            with transaction.atomic():
                slots_to_update = AppointmentAvailableSlot.objects.filter(
                    slot_template=template,
                    date_start__gte=now,
                    booked_count=0
                )
                slots_to_update.update(is_active=updated_template.is_active)

        return Response(
            {"template": SlotTemplateSerializer(updated_template).data},
            status=status.HTTP_200_OK,
        )'''

text = re.sub(old_regex, patch, text)

delete_regex = r'        template\.is_active = False\s*template\.save\(update_fields=\["is_active"\]\)\s*return Response\(status=status\.HTTP_204_NO_CONTENT\)'

delete_patch = '''        with transaction.atomic():
            template.is_deleted = True
            template.is_active = False
            template.save(update_fields=["is_deleted", "is_active"])

            now = timezone.now()
            AppointmentAvailableSlot.objects.filter(
                slot_template=template,
                date_start__gte=now,
                booked_count=0
            ).update(is_active=False)

        return Response(status=status.HTTP_204_NO_CONTENT)'''

text = re.sub(delete_regex, delete_patch, text)

with open('doctor/views.py', 'w', encoding='utf-8') as f:
    f.write(text)

print("Patch complete")