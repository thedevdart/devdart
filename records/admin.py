from django.contrib import admin
from .models import Site, Department, DocumentTemplate, DailyReport, ReportVersion

@admin.register(Site)
class SiteAdmin(admin.ModelAdmin):
    list_display = ('name', 'location')

@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ('name', 'site')
    list_filter = ('site',)

@admin.register(DocumentTemplate)
class DocumentTemplateAdmin(admin.ModelAdmin):
    list_display = ('title', 'department', 'format_id', 'is_active')
    list_filter = ('department', 'is_active')
    search_fields = ('title', 'format_id')

@admin.register(DailyReport)
class DailyReportAdmin(admin.ModelAdmin):
    list_display = ('template', 'report_date', 'shift', 'updated_at')
    list_filter = ('report_date', 'template__department')
    search_fields = ('template__title',)

@admin.register(ReportVersion)
class ReportVersionAdmin(admin.ModelAdmin):
    list_display = ('daily_report', 'version_number', 'action_type', 'modified_by', 'modified_at')
    list_filter = ('action_type',)
    readonly_fields = ('modified_at',)