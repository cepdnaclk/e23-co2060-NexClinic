import logging
from django.core.mail import send_mail
from django.conf import settings
from .email_templates import EMAIL_TEMPLATES

logger = logging.getLogger(__name__)

def send_templated_email(template_name, context, recipients, fail_silently=False):
    """
    Fetches the email template by name, formats it with the provided context,
    and sends the email to the list of recipients.
    """
    template = EMAIL_TEMPLATES.get(template_name)
    if not template:
        logger.error(f"Email template '{template_name}' not found.")
        return 0

    try:
        subject = template["subject"].format(**context)
        message = template["body"].format(**context)
    except KeyError as e:
        logger.error(f"Missing context variable {e} for template '{template_name}'")
        return 0
    except Exception as e:
        logger.error(f"Error formatting template '{template_name}': {e}")
        return 0

    try:
        return send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=recipients,
            fail_silently=fail_silently,
        )
    except Exception as e:
        logger.error(f"Error sending templated email '{template_name}': {e}")
        if not fail_silently:
            raise
        return 0
