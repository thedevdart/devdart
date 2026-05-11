from django.urls import path
from . import views

urlpatterns = [
    # The Main OS Landing Screen
    path('', views.nexus_hub, name='nexus_hub'),
    
    # Superuser Access Control Dashboard
    path('access/', views.manage_access_dashboard, name='manage_access_dashboard'),
    
    # Custom Role Builder
    path('access/role/create/', views.role_builder, name='role_create'),
    path('access/role/<int:role_id>/edit/', views.role_builder, name='role_edit'),
    path('access/api/role/save/', views.api_save_role, name='api_save_role'),
    
    # User Assignment (Roles & Sites)
    path('access/user/<int:user_id>/', views.user_manager, name='user_manager'),
    path('access/api/user/<int:user_id>/save/', views.api_save_user_access, name='api_save_user_access'),
]