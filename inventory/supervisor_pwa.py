"""Supervisor PWA: device pairing, session, and authenticated upload APIs."""

import json
from datetime import datetime, timedelta
from functools import wraps

from pathlib import Path

from django.conf import settings
from django.http import HttpResponse, JsonResponse
from django.shortcuts import get_object_or_404, render
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_POST

from hub.decorators import require_app_access

from .models import Center, CenterPairingCode, CenterUploadToken, StockSheet, SupervisorDevice
from .supervisor_upload import (
    ALLOWED_UPLOAD_DAYS_BACK,
    MAX_UPLOAD_FILE_BYTES,
    process_supervisor_upload,
    validate_supervisor_upload_request,
)

DEVICE_TOKEN_HEADER = 'X-Supervisor-Device-Token'
LOCAL_STORAGE_KEY = 'supervisor_device_token'


def get_device_from_request(request):
    token = request.headers.get(DEVICE_TOKEN_HEADER) or request.META.get(
        f'HTTP_{DEVICE_TOKEN_HEADER.upper().replace("-", "_")}'
    )
    if not token:
        return None
    try:
        return SupervisorDevice.objects.select_related('center').get(
            device_token=token, is_active=True
        )
    except SupervisorDevice.DoesNotExist:
        return None


def require_supervisor_device(view_func):
    @wraps(view_func)
    def _wrapped(request, *args, **kwargs):
        device = get_device_from_request(request)
        if not device:
            return JsonResponse({'error': 'Device not paired or inactive.'}, status=401)
        request.supervisor_device = device
        return view_func(request, *args, **kwargs)
    return _wrapped


def _active_upload_token_for_center(center):
    try:
        token_obj = CenterUploadToken.objects.get(center=center, is_active=True)
        return token_obj
    except CenterUploadToken.DoesNotExist:
        return None


def _session_payload(device):
    center = device.center
    today = timezone.localdate()
    yesterday = today - timedelta(days=1)
    allowed_dates = [today - timedelta(days=i) for i in range(ALLOWED_UPLOAD_DAYS_BACK + 1)]

    recent = StockSheet.objects.filter(center=center).order_by('-date')[:5]
    recent_uploads = []
    for sheet in recent:
        recent_uploads.append({
            'date': sheet.date.isoformat(),
            'is_reviewed': sheet.entries.exists(),
        })

    yesterday_sheet = StockSheet.objects.filter(center=center, date=yesterday).first()
    upload_token_active = _active_upload_token_for_center(center) is not None

    return {
        'paired': True,
        'center_id': center.id,
        'center_name': center.name,
        'today': today.isoformat(),
        'yesterday': yesterday.isoformat(),
        'default_date': yesterday.isoformat(),
        'allowed_dates': [d.isoformat() for d in allowed_dates],
        'max_file_mb': MAX_UPLOAD_FILE_BYTES // (1024 * 1024),
        'upload_token_active': upload_token_active,
        'yesterday_uploaded': yesterday_sheet is not None,
        'yesterday_reviewed': bool(yesterday_sheet and yesterday_sheet.entries.exists()),
        'has_push_subscription': bool(device.push_subscription),
        'recent_uploads': recent_uploads,
    }


def supervisor_app(request):
    """Mobile-first PWA entry point for supervisors."""
    return render(request, 'inventory/supervisor_app.html', {
        'device_token_header': DEVICE_TOKEN_HEADER,
        'local_storage_key': LOCAL_STORAGE_KEY,
    })


def supervisor_service_worker(request):
    sw_path = Path(settings.BASE_DIR) / 'inventory' / 'static' / 'inventory' / 'supervisor' / 'sw.js'
    content = sw_path.read_text(encoding='utf-8')
    response = HttpResponse(content, content_type='application/javascript')
    response['Service-Worker-Allowed'] = '/inventory/supervisor/'
    response['Cache-Control'] = 'no-cache'
    return response


def supervisor_manifest(request):
    start_url = request.build_absolute_uri('/inventory/supervisor/')
    manifest = {
        'name': 'Lucro Supervisor',
        'short_name': 'Supervisor',
        'description': 'Upload daily stock sheets',
        'start_url': start_url,
        'scope': request.build_absolute_uri('/inventory/supervisor/'),
        'display': 'standalone',
        'background_color': '#0a0f18',
        'theme_color': '#FF8965',
        'icons': [
            {'src': '/favicon.png', 'sizes': '192x192', 'type': 'image/png'},
        ],
    }
    return JsonResponse(manifest)


@csrf_exempt
@require_POST
def api_pair(request):
    try:
        data = json.loads(request.body or '{}')
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON.'}, status=400)

    code = (data.get('code') or '').strip().upper().replace('-', '').replace(' ', '')
    if not code:
        return JsonResponse({'error': 'Enter the pairing code from your admin.'}, status=400)

    pairing = (
        CenterPairingCode.objects.select_related('center')
        .filter(code__iexact=code, used_at__isnull=True)
        .order_by('-created_at')
        .first()
    )
    if not pairing or not pairing.is_valid:
        return JsonResponse({'error': 'Invalid or expired pairing code.'}, status=400)

    center = pairing.center
    try:
        device = SupervisorDevice.create_for_center(
            center,
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
        )
        pairing.used_at = timezone.now()
        pairing.used_by_device = device
        pairing.save(update_fields=['used_at', 'used_by_device'])
    except Exception as exc:
        import logging
        logging.getLogger(__name__).exception('Supervisor pair failed: %s', exc)
        return JsonResponse({'error': 'Could not pair device. Ask admin to try a new code.'}, status=500)

    return JsonResponse({
        'ok': True,
        'device_token': device.device_token,
        'center_name': center.name,
        'session': _session_payload(device),
    })


@require_GET
@require_supervisor_device
def api_session(request):
    device = request.supervisor_device
    device.last_seen_at = timezone.now()
    device.save(update_fields=['last_seen_at'])
    return JsonResponse(_session_payload(device))


@csrf_exempt
@require_POST
@require_supervisor_device
def api_upload(request):
    device = request.supervisor_device
    center = device.center
    token_obj = _active_upload_token_for_center(center)
    if not token_obj:
        return JsonResponse({
            'error': 'Upload is not enabled for your center. Ask admin to generate an upload link first.',
        }, status=403)

    date_str = request.POST.get('date', '').strip()
    if not date_str:
        return JsonResponse({'error': 'Please pick a valid date.'}, status=400)
    try:
        upload_date = datetime.strptime(date_str, '%Y-%m-%d').date()
    except ValueError:
        return JsonResponse({'error': 'Please pick a valid date.'}, status=400)

    upload = request.FILES.get('sheet')
    err = validate_supervisor_upload_request(center, upload_date, upload)
    if err:
        return JsonResponse({'error': err}, status=400)

    device.last_seen_at = timezone.now()
    device.save(update_fields=['last_seen_at'])

    result = process_supervisor_upload(center, token_obj, upload_date, upload)
    return JsonResponse(result)


@require_GET
def api_push_config(request):
    from .supervisor_push import get_vapid_public_key
    public_key = get_vapid_public_key()
    if not public_key:
        return JsonResponse({'error': 'Push notifications are not configured.'}, status=503)
    return JsonResponse({'publicKey': public_key})


@csrf_exempt
@require_POST
@require_supervisor_device
def api_register_push(request):
    try:
        data = json.loads(request.body or '{}')
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON.'}, status=400)

    subscription = data.get('subscription')
    if not subscription or not subscription.get('endpoint'):
        return JsonResponse({'error': 'Invalid push subscription.'}, status=400)

    device = request.supervisor_device
    device.push_subscription = subscription
    device.last_seen_at = timezone.now()
    device.save(update_fields=['push_subscription', 'last_seen_at'])

    return JsonResponse({'ok': True, 'saved': True})


@require_app_access('inventory')
@require_POST
def api_save_reminder_settings(request):
    from .models import SupervisorReminderSettings

    try:
        data = json.loads(request.body or '{}')
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON.'}, status=400)

    def parse_time(key):
        raw = (data.get(key) or '').strip()
        if not raw:
            raise ValueError(f'Missing {key}')
        from datetime import datetime
        for fmt in ('%H:%M', '%H:%M:%S'):
            try:
                return datetime.strptime(raw, fmt).time()
            except ValueError:
                continue
        raise ValueError(f'Invalid time for {key}')

    try:
        interval = int(data.get('interval_hours', 2))
        lookback = int(data.get('lookback_days', 7))
        if interval < 1 or interval > 24:
            raise ValueError('interval_hours must be 1–24')
        if lookback < 1 or lookback > 30:
            raise ValueError('lookback_days must be 1–30')
    except (TypeError, ValueError) as exc:
        return JsonResponse({'error': str(exc)}, status=400)

    try:
        settings_obj = SupervisorReminderSettings.get()
        settings_obj.is_enabled = bool(data.get('is_enabled'))
        settings_obj.start_time = parse_time('start_time')
        settings_obj.deadline_time = parse_time('deadline_time')
        settings_obj.interval_hours = interval
        settings_obj.lookback_days = lookback
        settings_obj.save()
    except ValueError as exc:
        return JsonResponse({'error': str(exc)}, status=400)

    return JsonResponse({
        'ok': True,
        'is_enabled': settings_obj.is_enabled,
        'start_time': settings_obj.start_time.strftime('%H:%M'),
        'deadline_time': settings_obj.deadline_time.strftime('%H:%M'),
        'interval_hours': settings_obj.interval_hours,
        'lookback_days': settings_obj.lookback_days,
    })


@require_app_access('inventory')
@require_POST
def admin_generate_pairing_code(request, center_id):
    center = get_object_or_404(Center, id=center_id)
    CenterPairingCode.objects.filter(center=center, used_at__isnull=True).update(
        used_at=timezone.now()
    )
    pairing = CenterPairingCode.create_for(center)
    return JsonResponse({
        'ok': True,
        'code': pairing.code,
        'expires_at': pairing.expires_at.isoformat(),
        'pwa_url': request.build_absolute_uri('/inventory/supervisor/'),
    })


@require_app_access('inventory')
@require_POST
def admin_remove_supervisor_device(request, center_id, device_id):
    center = get_object_or_404(Center, id=center_id)
    device = get_object_or_404(SupervisorDevice, id=device_id, center=center)
    device.is_active = False
    device.push_subscription = None
    device.save(update_fields=['is_active', 'push_subscription'])
    return JsonResponse({'ok': True})
