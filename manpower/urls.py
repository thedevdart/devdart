from django.urls import path
from . import views

urlpatterns = [
    # Dashboard & Directory
    path('', views.manpower_dashboard, name='manpower_dashboard'),
    path('directory/', views.workers_directory, name='manpower_directory'),
    
    # Core APIs
    path('api/workers/<int:center_id>/', views.api_get_workers, name='api_get_workers'),
    path('api/workers/save/', views.api_save_workers, name='api_save_workers'),
    path('api/attendance/save/', views.api_save_attendance, name='api_save_attendance'),
    
    # Analytics Hub
    path('contractors/', views.contractors_hub, name='contractors_hub'),
    path('api/contractors/<int:contractor_id>/analytics/', views.api_contractor_analytics, name='api_contractor_analytics'),

    # DEV TOOLS (These were missing!)
    path('dev-tools/', views.dev_tools, name='dev_tools'),
    path('dev-tools/seed/', views.seed_dummy_data, name='seed_dummy_data'),
    path('dev-tools/nuke/', views.nuke_dummy_data, name='nuke_dummy_data'),

    path('contractors/', views.contractors_hub, name='contractors_hub'),
    path('api/contractors/<int:contractor_id>/analytics/', views.api_contractor_analytics, name='api_contractor_analytics'),

    # NEW: Center Analytics Hub
    path('centers/', views.centers_hub, name='centers_hub'),
    path('api/centers/<int:center_id>/analytics/', views.api_center_analytics, name='api_center_analytics'),
]