"""Generate VAPID key pair for supervisor Web Push. Add output to .env."""

import base64

from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = 'Generate VAPID public/private keys for supervisor Web Push notifications.'

    def handle(self, *args, **options):
        from cryptography.hazmat.primitives.serialization import Encoding, PublicFormat
        from py_vapid import Vapid01

        vapid = Vapid01()
        vapid.generate_keys()

        raw_public = vapid.public_key.public_bytes(
            encoding=Encoding.X962,
            format=PublicFormat.UncompressedPoint,
        )
        public_key = base64.urlsafe_b64encode(raw_public).decode('utf-8').rstrip('=')

        private_pem = vapid.private_pem()
        if isinstance(private_pem, bytes):
            private_pem = private_pem.decode('utf-8')

        self.stdout.write('Add these to your .env file:\n')
        self.stdout.write(f'VAPID_PUBLIC_KEY={public_key}')
        escaped = private_pem.replace('\n', '\\n')
        self.stdout.write(f'VAPID_PRIVATE_KEY={escaped}')
        self.stdout.write('VAPID_CLAIMS_EMAIL=mailto:admin@lucro.co.in')
