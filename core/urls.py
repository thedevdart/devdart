from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import RedirectView

# THIS IS THE IMPORT THAT WAS MISSING!
from django.contrib.auth import views as auth_views 

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # 1. Our Custom Login & Logout Views
    path('accounts/login/', auth_views.LoginView.as_view(template_name='inventory/login.html'), name='login'),
    path('accounts/logout/', auth_views.LogoutView.as_view(next_page='/accounts/login/'), name='logout'),
    
    # 2. The New Nexus OS Landing Page (Routed to the hub app)
    path('nexus/', include('hub.urls')), 
    
    # 3. Your existing inventory app
    path('inventory/', include('inventory.urls')),
    path('', RedirectView.as_view(url='/inventory/', permanent=True)),

    # 4. Future apps
    path('manpower/', include('manpower.urls')),
    path('records/', include('records.urls')),
     path('maintenance/', include('maintenance.urls')),
     path('vms/', include('vms.urls')),
     
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)