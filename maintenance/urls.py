from django.urls import path
from django.contrib.auth import views as auth_views
from . import views

app_name = 'maintenance'

urlpatterns = [
    path('', views.dashboard, name='dashboard'),
    path('labour-safety/', views.labour_safety_dashboard, name='labour_safety_dashboard'),
    path('notifications/', views.notifications_list, name='notifications_list'),
    path('update/<int:asset_id>/', views.update_service, name='update_service'),
    path('add/', views.add_new_asset, name='add_new_asset'),
    path('logout/', auth_views.LogoutView.as_view(), name='logout'),
]