from rest_framework import viewsets
from .models import VisitLog
from .serializers import VisitLogSerializer
from django.shortcuts import render

def gate_checkin_view(request):
    return render(request, 'vms/gate_checkin.html')
    

class VisitLogViewSet(viewsets.ModelViewSet):
    queryset = VisitLog.objects.all().order_by('-entry_time')
    serializer_class = VisitLogSerializer
    
    # Optional: Filter by today's logs only to keep the tablet fast
    # def get_queryset(self):
    #     from django.utils import timezone
    #     today = timezone.now().date()
    #     return VisitLog.objects.filter(entry_time__date=today).order_by('-entry_time')

def inside_dashboard_view(request):
    return render(request, 'vms/inside_dashboard.html')