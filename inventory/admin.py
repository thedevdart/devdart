from django.contrib import admin
from .models import Center, MasterItem, ItemAlias, StockSheet, StockEntry

# This configures how the lists look in the Admin UI
@admin.register(Center)
class CenterAdmin(admin.ModelAdmin):
    list_display = ('name', 'state', 'category')
    search_fields = ('name',)

@admin.register(MasterItem)
class MasterItemAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'created_at')
    search_fields = ('name', 'category')
    list_filter = ('category',)

@admin.register(ItemAlias)
class ItemAliasAdmin(admin.ModelAdmin):
    list_display = ('alias_name', 'master_item')
    search_fields = ('alias_name',)

@admin.register(StockSheet)
class StockSheetAdmin(admin.ModelAdmin):
    list_display = ('center', 'date', 'uploaded_at')
    list_filter = ('center', 'date')

@admin.register(StockEntry)
class StockEntryAdmin(admin.ModelAdmin):
    list_display = ('sheet', 'master_item', 'closing_balance', 'sheet_category')
    list_filter = ('sheet__center',) # Filter by Center via the Sheet relation