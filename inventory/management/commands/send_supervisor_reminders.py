"""Send scheduled supervisor upload reminders. Run every 15–30 minutes via cron or Task Scheduler."""

from django.core.management.base import BaseCommand

from inventory.supervisor_reminders import send_scheduled_reminders


class Command(BaseCommand):
    help = 'Send Web Push reminders to supervisors with pending stock sheet uploads.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Log what would be sent without actually pushing.',
        )

    def handle(self, *args, **options):
        result = send_scheduled_reminders(dry_run=options['dry_run'])
        if result.get('skipped') == 'disabled':
            self.stdout.write('Reminders are disabled in Manage Centers.')
            return
        if result.get('skipped') == 'outside_window':
            self.stdout.write('Outside reminder window (start → deadline). Nothing sent.')
            return
        prefix = '[dry-run] ' if options['dry_run'] else ''
        self.stdout.write(
            f"{prefix}Sent {result.get('sent', 0)}, "
            f"failed {result.get('failed', 0)}, "
            f"skipped {result.get('skipped_devices', 0)} devices."
        )
