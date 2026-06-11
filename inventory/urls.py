from django.urls import path
from . import views

urlpatterns = [
    # --- 1. Core & Dashboard ---
    path('', views.dashboard, name='dashboard'),
    path('save_stock/', views.save_stock, name='save_stock'),

    # --- 2. Center Management ---
    path('centers/', views.centers_list, name='centers_list'),
    path('centers/manage/', views.manage_centers, name='manage_centers'),
    path('centers/api/update/', views.update_center_api, name='update_center_api'),
    path('center/<int:center_id>/', views.center_history, name='center_history'),

    # --- 3. Individual Report Management ---
    path('report/<int:sheet_id>/', views.report_detail, name='report_detail'),
    path('report/<int:sheet_id>/update/', views.update_report, name='update_report'),
    path('download-sheet/<int:sheet_id>/', views.download_sheet_csv, name='download_sheet_csv'),

    # --- 4. Daily Consolidated Reports ---
    path('daily-reports/', views.daily_reports_list, name='daily_reports_list'),
    path('daily-reports/<str:date_str>/', views.daily_report_detail, name='daily_report_detail'),
    path('daily-reports/<str:date_str>/download/', views.download_daily_report, name='download_daily_report'),

    # --- 5. Item Management ---
    path('master-items/', views.master_list, name='master_list'),

    # --- 6. APIs ---
    path('api/analyze-sheet/', views.api_analyze_sheet, name='api_analyze_sheet'),
    path('api/resolve-ledger-rows/', views.api_resolve_ledger_rows, name='api_resolve_ledger_rows'),
    path('api/check-uploads/', views.api_check_uploads, name='api_check_uploads'),
    path('api/attach-previous/', views.api_attach_previous_report, name='api_attach_previous_report'),
    path('api/get-previous-closing/', views.api_get_previous_closing, name='api_get_previous_closing'),
    path('api/notifications/', views.api_get_notifications, name='api_get_notifications'),
    path('api/notifications/<int:notif_id>/original/', views.api_get_notification_original, name='api_get_notification_original'),
    path('api/notifications/read/all/', views.api_mark_all_notifications_read, name='api_mark_all_notifications_read'),
    path('api/notifications/read/<int:notif_id>/', views.api_mark_notification_read, name='api_mark_notification_read'),
    path('api/notifications/<int:notif_id>/delete/', views.api_delete_notification, name='api_delete_notification'),
    path('api/raw-sheet/<int:sheet_id>/', views.api_get_raw_sheet, name='api_get_raw_sheet'),

    # --- 7. Reports & Sync ---
    path('daily-reports/<str:date_str>/download-html/', views.download_daily_html, name='download_daily_html'),
    
    # --- 8. Profile & Security ---
    path('profile/', views.user_profile, name='user_profile'),
    path('api/profile/update/', views.api_update_profile, name='api_update_profile'),
    path('api/profile/request-otp/', views.api_request_otp, name='api_request_otp'),
    path('api/profile/verify-otp/', views.api_verify_otp, name='api_verify_otp'),

    # --- 9. Sorting Reports ---
    path('sorting-report/', views.sorting_report_view, name='sorting_report'),
    path('api/sorting-data/', views.api_sorting_data, name='api_sorting_data'),
    path('api/sorting-excel/', views.download_sorting_excel, name='download_sorting_excel'),

    # --- 10. System Sync ---
    path('sync/export/', views.export_full_system, name='export_full_system'),
    path('sync/import/', views.import_full_system, name='import_full_system'),

    # --- 11. Templates & Aliases ---
    path('center/<int:center_id>/template/', views.center_template_builder, name='center_template_builder'),
    path('api/center/<int:center_id>/save-template/', views.api_save_center_template, name='api_save_center_template'),
    path('center/<int:center_id>/aliases/', views.center_aliases, name='center_aliases'),
    path('api/alias/<int:alias_id>/delete/', views.api_delete_alias, name='api_delete_alias'),
    path('api/center/<int:center_id>/add-alias/', views.api_add_center_alias, name='api_add_center_alias'),
    path('export/aliases/', views.export_center_aliases_excel, name='export_center_aliases'),
    
    path('templates/', views.template_builder_list, name='template_builder_list'),
    path('templates/create/', views.template_builder_create, name='template_builder_create'),
    path('templates/<int:template_id>/', views.template_builder_view, name='template_builder_view'),
    path('templates/<int:template_id>/download/', views.template_builder_download, name='template_builder_download'),
    path('templates/<int:template_id>/delete/', views.api_delete_template, name='api_delete_template'),
    path('templates/<int:template_id>/download-matrix/', views.template_item_vs_center_download, name='template_item_vs_center_download'),
    path('api/manage-classifications/', views.manage_classification_api, name='manage_classification_api'),
    path('api/navigate/<int:center_id>/', views.api_navigate_report, name='api_navigate_report'),
    
    # --- 12. Custom Reports Hub ---
    path('custom-reports/', views.custom_reports_landing, name='custom_reports_landing'),
    
    # 12a. Target vs Actuals Report
    path('custom-reports/target/', views.target_report_page, name='target_report'),
    path('api/target-report/save/', views.api_save_target_report, name='api_save_target_report'),
    path('api/target-report/run/', views.api_run_target_report, name='api_run_target_report'),
    path('api/target-report/delete/', views.api_delete_target_report, name='api_delete_target_report'),
    path('custom-reports/target/export/<int:report_id>/<str:date_str>/', views.export_target_report_excel, name='export_target_report_excel'),

    # 12b. Centers vs Items Pivot Report
    path('custom-reports/pivot/', views.custom_report_page, name='pivot_report'),
    path('api/custom-report/items/', views.api_get_report_items, name='api_get_custom_report_items'),
    path('api/custom-report/generate/', views.api_generate_custom_report, name='api_generate_custom_report'),
    path('api/custom-report/export/', views.export_custom_report_excel, name='api_export_custom_report'),
    # Supervisor self-service upload (PR #2)
    path('upload/<str:token>/', views.supervisor_upload_page, name='supervisor_upload_page'),
    path('upload/<str:token>/submit/', views.supervisor_upload_submit, name='supervisor_upload_submit'),
    path('api/manage-centers/<int:center_id>/upload-token/generate/', views.admin_generate_upload_token, name='admin_generate_upload_token'),
    path('api/manage-centers/<int:center_id>/upload-token/disable/', views.admin_disable_upload_token, name='admin_disable_upload_token'),
    # Dynamic Daily Report View (PR #6)
    path('daily-report-view/', views.daily_report_view, name='daily_report_view'),
]
