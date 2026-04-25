from datetime import timedelta

from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone

from users.activity_log_settings import ACTIVITY_LOG_RETENTION_DAYS
from users.models import UserActivityLog


class Command(BaseCommand):
    help = "Delete user activity logs older than the given number of days."

    def add_arguments(self, parser):
        default_days = ACTIVITY_LOG_RETENTION_DAYS if ACTIVITY_LOG_RETENTION_DAYS > 0 else 180
        parser.add_argument(
            "--days",
            type=int,
            default=default_days,
            help=f"Delete logs older than this many days (default: {default_days}).",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Show how many logs would be deleted without deleting.",
        )

    def handle(self, *args, **options):
        days = options["days"]
        dry_run = options["dry_run"]

        if days <= 0:
            raise CommandError("--days must be a positive integer.")

        cutoff = timezone.now() - timedelta(days=days)
        queryset = UserActivityLog.objects.filter(created_at__lt=cutoff)
        total = queryset.count()

        if dry_run:
            self.stdout.write(
                self.style.WARNING(
                    f"[DRY RUN] {total} activity logs older than {days} days would be deleted."
                )
            )
            return

        deleted_count, _ = queryset.delete()
        self.stdout.write(
            self.style.SUCCESS(
                f"Deleted {deleted_count} activity log rows older than {days} days."
            )
        )
