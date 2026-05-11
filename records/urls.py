from django.urls import path
from . import views

app_name = 'records'

urlpatterns = [
# The Builder & Scanning
    path('builder/', views.template_builder, name='template_builder'),
    path('scan/<int:template_id>/', views.scan_record, name='scan_record'),
    
    # The New Drill-Down Flow
    path('', views.dashboard, name='dashboard'), # Step 1: Depts
    path('department/<int:dept_id>/', views.dept_templates, name='dept_templates'), # Step 2: Templates
    path('template/<int:template_id>/', views.template_records, name='template_records'), # Step 3: Record List & Toggles
    path('record/<int:report_id>/', views.record_view, name='record_view'), # Step 4: Version History Sidebar
    path('api/excel-to-html/', views.api_excel_to_html, name='api_excel_to_html'),
    path('format-converter/', views.excel_to_html, name='excel_to_html'),

    path('architect/sync/', views.template_sync_view, name='template_sync'),
    path('architect/sync/export/', views.export_templates, name='export_templates'),
    path('architect/sync/import/', views.import_templates, name='import_templates'),
    ]