from django.db import models
from django.utils import timezone
from django.contrib.auth.models import User 

class VisitLog(models.Model):
    # ... your existing fields ...
    person_name = models.CharField(max_length=150)
    phone_number = models.CharField(max_length=20, db_index=True)
    vehicle_number = models.CharField(max_length=20, blank=True, null=True)
    purpose = models.CharField(max_length=100)
    photo = models.ImageField(upload_to='visitor_photos/', blank=True, null=True) 
    host = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='visitors') 
    
    # ---> ADD THESE NEW LINES <---
    STATUS_CHOICES = [
        ('Pending', 'Pending Approval'),
        ('Approved', 'Approved'),
        ('Rejected', 'Rejected'),
        ('Direct', 'Direct Entry'), # For normal visitors who don't need approval
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Direct')
    
    entry_time = models.DateTimeField(default=timezone.now)
    exit_time = models.DateTimeField(blank=True, null=True)

    def save(self, *args, **kwargs):
        if self.photo:
            from core.utils import compress_file_if_needed
            compress_file_if_needed(self.photo)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.person_name} - {self.status}"