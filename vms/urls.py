from django.urls import path, include
from rest_framework.routers import DefaultRouter

# 1. Import your frontend views and API views here
from .views import VisitLogViewSet, gate_checkin_view, inside_dashboard_view

router = DefaultRouter()
router.register(r'logs', VisitLogViewSet)

urlpatterns = [
    # Frontend Pages
    path('gate/', gate_checkin_view, name='gate_checkin'),
    path('office/', inside_dashboard_view, name='inside_dashboard'),
    
    # API Routes (Kept exactly as is so your Vue code doesn't break)
    path('api/vms/', include(router.urls)),
]