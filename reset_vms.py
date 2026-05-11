import os
import django

# Tell the script to use your Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.db import connection

print("Starting VMS database reset...")

try:
    with connection.cursor() as cursor:
        # 1. Forcefully drop the stubborn PostgreSQL table
        cursor.execute("DROP TABLE IF EXISTS vms_visitlog CASCADE;")
        
        # 2. Tell Django's internal memory to forget the VMS app ever existed
        cursor.execute("DELETE FROM django_migrations WHERE app='vms';")
        
    print("✅ SUCCESS: Old table deleted and migrations wiped perfectly!")
except Exception as e:
    print(f"❌ ERROR: {e}")