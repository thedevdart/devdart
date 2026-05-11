from django.contrib import admin
from .models import Asset, MaintenanceLog

class MaintenanceLogInline(admin.TabularInline):
    model = MaintenanceLog
    extra = 1

@admin.register(Asset)
class AssetAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'next_due_date', 'is_active')
    list_filter = ('category', 'is_active')
    inlines = [MaintenanceLogInline]