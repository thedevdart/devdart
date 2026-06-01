from django.db import models

class Asset(models.Model):
    CATEGORY_CHOICES = [
        ('AC', 'AC'),
        ('MACHINERY', 'Machinery'),
        ('RENTALS', 'Factory Rentals'),
        ('FIRE_SAFETY', 'Fire Extinguisher'),
    ]

    FREQUENCY_CHOICES = [
        ('MONTHLY', 'Monthly'),
        ('QUARTERLY', 'Quarterly'),
        ('YEARLY', 'Yearly'),
    ]

    name = models.CharField(max_length=255)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    maintenance_frequency = models.CharField(max_length=20, choices=FREQUENCY_CHOICES, default='MONTHLY')
    purchase_or_start_date = models.DateField()
    next_due_date = models.DateField()
    
    # Flexible field to store category-specific data (e.g., {"landlord_name": "John", "lease_end": "2027"})
    specific_details = models.JSONField(default=dict, blank=True)
    
    enable_reminders = models.BooleanField(default=True)
    is_active = models.BooleanField(default=True)

    location = models.CharField(max_length=100, blank=True, null=True)

    def __str__(self):
        return f"{self.name} ({self.get_category_display()})"

class MaintenanceLog(models.Model):
    asset = models.ForeignKey(Asset, on_delete=models.CASCADE, related_name='maintenance_logs')
    completed_date = models.DateField()
    new_due_date = models.DateField()
    
    # For uploading the bill or challan photo
    document_image = models.ImageField(upload_to='maintenance_docs/', blank=True, null=True)
    remarks = models.TextField(blank=True)
    
    def save(self, *args, **kwargs):
        if self.document_image:
            from core.utils import compress_file_if_needed
            compress_file_if_needed(self.document_image)
        # Automatically update the parent Asset's next_due_date when a log is saved
        if self.new_due_date:
            self.asset.next_due_date = self.new_due_date
            self.asset.save()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Log for {self.asset.name} on {self.completed_date}"