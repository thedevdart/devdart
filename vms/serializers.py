from rest_framework import serializers
from .models import VisitLog

class VisitLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = VisitLog
        fields = '__all__'
        read_only_fields = ('entry_time',)