import os
from django.core.exceptions import ValidationError

def validate_public_file(file):
    max_size = 5 * 1024 * 1024  # 5 MB
    valid_extensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif']

    if file.size > max_size:
        raise ValidationError("File size exceeds the 5MB limit.")

    ext = os.path.splitext(file.name)[1].lower()
    if ext not in valid_extensions:
        raise ValidationError(f"Unsupported file type. Allowed: {', '.join(valid_extensions)}")

def validate_private_file(file):
    max_size = 15 * 1024 * 1024  # 15 MB
    valid_extensions = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx', '.txt']

    if file.size > max_size:
        raise ValidationError("File size exceeds the 15MB limit.")

    ext = os.path.splitext(file.name)[1].lower()
    if ext not in valid_extensions:
        raise ValidationError(f"Unsupported file type. Allowed: {', '.join(valid_extensions)}")
