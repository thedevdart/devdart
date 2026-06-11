"""Web Push notifications for supervisor PWA devices."""

import base64
import json
import logging

from django.conf import settings

logger = logging.getLogger(__name__)

_vapid_signer = None


def _vapid_claims():
    return {'sub': getattr(settings, 'VAPID_CLAIMS_EMAIL', 'mailto:admin@example.com')}


def _load_vapid_signer():
    global _vapid_signer
    if _vapid_signer is not None:
        return _vapid_signer

    raw = getattr(settings, 'VAPID_PRIVATE_KEY', '') or ''
    if not raw:
        return None

    pem = raw.strip().strip("'\"").replace('\\n', '\n').encode('utf-8')
    try:
        from py_vapid import Vapid01
        _vapid_signer = Vapid01.from_pem(pem)
        return _vapid_signer
    except Exception as exc:
        logger.error('Invalid VAPID_PRIVATE_KEY: %s', exc)
        return None


def get_vapid_public_key():
    configured = getattr(settings, 'VAPID_PUBLIC_KEY', '') or ''
    if configured:
        return configured

    signer = _load_vapid_signer()
    if not signer:
        return ''

    from cryptography.hazmat.primitives.serialization import Encoding, PublicFormat
    raw = signer.public_key.public_bytes(
        encoding=Encoding.X962,
        format=PublicFormat.UncompressedPoint,
    )
    return base64.urlsafe_b64encode(raw).decode('utf-8').rstrip('=')


def _push_payload(title, body, url='/inventory/supervisor/'):
    return json.dumps({'title': title, 'body': body, 'url': url})


def send_web_push_to_device(device, title, body, url='/inventory/supervisor/'):
    subscription = device.push_subscription
    if not subscription or not subscription.get('endpoint'):
        return False

    vapid = _load_vapid_signer()
    if not vapid:
        logger.warning('VAPID keys not configured; skipping push')
        return False

    try:
        from pywebpush import webpush, WebPushException
    except ImportError:
        logger.error('pywebpush is not installed')
        return False

    try:
        webpush(
            subscription_info=subscription,
            data=_push_payload(title, body, url),
            vapid_private_key=vapid,
            vapid_claims=_vapid_claims(),
        )
        return True
    except WebPushException as exc:
        logger.warning('Web push failed for device %s: %s', device.id, exc)
        if getattr(exc, 'response', None) and exc.response.status_code in (404, 410):
            device.push_subscription = None
            device.save(update_fields=['push_subscription'])
        return False
    except Exception as exc:
        logger.warning('Web push error for device %s: %s', device.id, exc)
        return False
