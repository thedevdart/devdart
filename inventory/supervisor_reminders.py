"""Scheduled supervisor upload reminders via Web Push."""

import logging
from datetime import datetime, timedelta

from django.utils import timezone

from .supervisor_upload import ALLOWED_UPLOAD_DAYS_BACK
from .supervisor_push import send_web_push_to_device

logger = logging.getLogger(__name__)


def get_pending_upload_dates(center, lookback_days=None):
    """Dates within the upload window that have no stock sheet for this center."""
    days = lookback_days or ALLOWED_UPLOAD_DAYS_BACK
    today = timezone.localdate()
    pending = []
    for offset in range(1, days + 1):
        sheet_date = today - timedelta(days=offset)
        from .models import StockSheet
        if not StockSheet.objects.filter(center=center, date=sheet_date).exists():
            pending.append(sheet_date)
    pending.sort()
    return pending


def _format_dates(dates):
    return ', '.join(d.strftime('%d %b') for d in dates)


def _in_reminder_window(now, start_time, deadline_time):
    current = now.time()
    if start_time <= deadline_time:
        return start_time <= current <= deadline_time
    return current >= start_time or current <= deadline_time


def _interval_elapsed(now, last_sent, interval_hours):
    if not last_sent:
        return True
    return (now - last_sent) >= timedelta(hours=interval_hours)


def build_reminder_message(center_name, pending_dates, deadline_time):
    dates_str = _format_dates(pending_dates)
    deadline_str = deadline_time.strftime('%I:%M %p').lstrip('0')
    if len(pending_dates) == 1:
        title = f'Upload stock sheet — {center_name}'
        body = f'Sheet for {dates_str} is missing. Upload by {deadline_str} today.'
    else:
        title = f'{len(pending_dates)} sheets pending — {center_name}'
        body = f'Missing: {dates_str}. Upload by {deadline_str} today.'
    return title, body


def send_scheduled_reminders(dry_run=False):
    """Send reminders to paired devices with pending uploads. Returns a summary dict."""
    from .models import SupervisorDevice, SupervisorReminderSettings

    settings_obj = SupervisorReminderSettings.get()
    if not settings_obj.is_enabled:
        return {'ok': True, 'skipped': 'disabled', 'sent': 0, 'failed': 0, 'devices': 0}

    now = timezone.localtime()
    if not _in_reminder_window(now, settings_obj.start_time, settings_obj.deadline_time):
        return {
            'ok': True,
            'skipped': 'outside_window',
            'sent': 0,
            'failed': 0,
            'devices': 0,
        }

    lookback = settings_obj.lookback_days or ALLOWED_UPLOAD_DAYS_BACK
    devices = SupervisorDevice.objects.filter(
        is_active=True,
        push_subscription__isnull=False,
    ).exclude(push_subscription={}).select_related('center')

    sent = 0
    failed = 0
    skipped_devices = 0

    for device in devices:
        if not device.push_subscription or not device.push_subscription.get('endpoint'):
            skipped_devices += 1
            continue

        pending = get_pending_upload_dates(device.center, lookback)
        if not pending:
            skipped_devices += 1
            continue

        if not _interval_elapsed(now, device.last_reminder_sent_at, settings_obj.interval_hours):
            skipped_devices += 1
            continue

        title, body = build_reminder_message(
            device.center.name, pending, settings_obj.deadline_time
        )

        if dry_run:
            logger.info('Would remind device %s (%s): %s', device.id, device.center.name, body)
            sent += 1
            continue

        if send_web_push_to_device(device, title, body):
            device.last_reminder_sent_at = now
            device.save(update_fields=['last_reminder_sent_at'])
            sent += 1
        else:
            failed += 1

    return {
        'ok': True,
        'sent': sent,
        'failed': failed,
        'skipped_devices': skipped_devices,
        'devices': devices.count(),
    }
