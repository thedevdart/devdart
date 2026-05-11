from django.contrib import admin
from .models import VisitLog

@admin.register(VisitLog)
class VisitLogAdmin(admin.ModelAdmin):
    list_display = ('person_name', 'phone_number', 'vehicle_number', 'purpose', 'entry_time', 'exit_time')
    search_fields = ('person_name', 'phone_number', 'vehicle_number')
    list_filter = ('purpose', 'entry_time')