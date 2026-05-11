from django.db import models
from inventory.models import Center  

class Contractor(models.Model):
    name = models.CharField(max_length=150, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class Person(models.Model):
    TYPE_CHOICES = [
        ('Worker', 'Worker'),
        ('Female', 'Female'),
        ('Operator', 'Operator'),
        ('Supervisor', 'Supervisor'),
    ]
    
    name = models.CharField(max_length=150)
    role = models.CharField(max_length=50, choices=TYPE_CHOICES)
    shift_preference = models.CharField(max_length=10, choices=[('Day', 'Day'), ('Night', 'Night'), ('Both', 'Both')], default='Both')
    
    is_company_staff = models.BooleanField(default=False)
    contractor = models.ForeignKey(Contractor, on_delete=models.SET_NULL, null=True, blank=True)
    center = models.ForeignKey(Center, on_delete=models.CASCADE, related_name='manpower_people', null=True)

    class Meta:
        unique_together = ('name', 'contractor', 'center')

    def __str__(self):
        emp_type = "Company" if self.is_company_staff else (self.contractor.name if self.contractor else "Unknown")
        return f"{self.name} ({self.role} - {emp_type})"

class DailyRecord(models.Model):
    """One single record per Center per Day. Holds the massive PDF and Production numbers."""
    center = models.ForeignKey(Center, on_delete=models.CASCADE)
    date = models.DateField()
    file = models.FileField(upload_to='daily_rosters/%Y/%m/', blank=True, null=True)
    
    # New Production Metrics
    day_production_kgs = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    night_production_kgs = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('center', 'date')

    def __str__(self):
        return f"{self.center.name} - {self.date}"

class AttendanceEntry(models.Model):
    """Specific record of a person working on a specific shift on that day."""
    record = models.ForeignKey(DailyRecord, on_delete=models.CASCADE, related_name='entries')
    person = models.ForeignKey(Person, on_delete=models.CASCADE)
    shift = models.CharField(max_length=10, choices=[('Day', 'Day'), ('Night', 'Night')])
    raw_scanned_name = models.CharField(max_length=150, blank=True)

    def __str__(self):
        return f"{self.person.name} - {self.shift} ({self.record.date})"