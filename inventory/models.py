from django.db import models
from django.contrib.auth.models import User

# --- NEW CLASSIFICATION MODEL ---
class CenterClassification(models.Model):
    name = models.CharField(max_length=100, unique=True)
    
    def __str__(self):
        return self.name

class Center(models.Model):
    name = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    category = models.CharField(max_length=2, choices=[('HD', 'HD'), ('LD', 'LD')], null=True, blank=True)
    
    # --- NEW CLASSIFICATION LINK ---
    classification = models.ForeignKey(CenterClassification, on_delete=models.SET_NULL, null=True, blank=True, related_name='centers')

    def __str__(self):
        return self.name
    
class MasterItem(models.Model):
    """
    The Global Dictionary (Golden Record).
    Stores the standardized name and official category.
    """
    name = models.CharField(max_length=200, unique=True, help_text="Standardized lowercase name")
    category = models.CharField(max_length=100, help_text="Official reporting category")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.category})"

class ItemAlias(models.Model):
    """
    Lookup table for alternative spellings/names.
    Example: 'blue drom' -> 'blue drum'
    """
    alias_name = models.CharField(max_length=200, unique=True)
    master_item = models.ForeignKey(MasterItem, on_delete=models.CASCADE, related_name='aliases')

    class Meta:
        verbose_name_plural = "Item Aliases"

    def __str__(self):
        return f"{self.alias_name} -> {self.master_item.name}"

class StockSheet(models.Model):
    """
    Represents a single upload event (Physical paper/file).
    Unique per Center per Date.
    """
    center = models.ForeignKey(Center, on_delete=models.CASCADE)
    date = models.DateField(db_index=True) # Indexed for faster daily report generation
    image = models.FileField(upload_to='stock_sheets/%Y/%m/')
    uploaded_at = models.DateTimeField(auto_now_add=True)
    is_carried_over = models.BooleanField(default=False)
    copied_from_date = models.DateField(null=True, blank=True)

    UPLOAD_SOURCE_CHOICES = [('admin', 'Admin'), ('supervisor', 'Supervisor')]
    uploaded_by_source = models.CharField(max_length=20, choices=UPLOAD_SOURCE_CHOICES, default='admin', db_index=True)
    uploaded_by_token = models.ForeignKey('CenterUploadToken', on_delete=models.SET_NULL, null=True, blank=True, related_name='uploaded_sheets')
    review_image = models.FileField(upload_to='stock_sheets/reviews/%Y/%m/', null=True, blank=True)
    raw_extracted_data = models.JSONField(null=True, blank=True)

    class Meta:
        unique_together = ('center', 'date')
        ordering = ['-date']

    def save(self, *args, **kwargs):
        from core.utils import compress_file_if_needed
        compress_file_if_needed(self.image)
        if self.review_image:
            compress_file_if_needed(self.review_image)
        super().save(*args, **kwargs)

class StockEntry(models.Model):
    """
    The individual rows extracted from the sheet.
    Now acting as a full daily ledger.
    """
    sheet = models.ForeignKey(StockSheet, on_delete=models.CASCADE, related_name='entries')
    master_item = models.ForeignKey(MasterItem, on_delete=models.PROTECT)
    sheet_category = models.CharField(max_length=100)
    
    # --- FULL LEDGER FIELDS ---
    opening_balance = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    inward = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    production = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    dispatch = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    closing_balance = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    raw_name_scanned = models.CharField(max_length=200, blank=True)

    class Meta:
        verbose_name_plural = "Stock Entries"

    def __str__(self):
        return f"{self.master_item.name}: {self.closing_balance}"
    
class Notification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='inventory_notifications')
    title = models.CharField(max_length=200)
    message = models.TextField()
    notif_type = models.CharField(max_length=20, choices=[
        ('case1', 'Success'), 
        ('case2', 'Untallied'), 
        ('case3', 'Review')
    ])
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    target_id = models.IntegerField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.notif_type}] {self.title}"

class CenterMasterItem(models.Model):
    center = models.ForeignKey(Center, on_delete=models.CASCADE, related_name='master_items')
    name = models.CharField(max_length=255)
    category = models.CharField(max_length=50) # 'Raw Material' or 'Finished Goods'
    display_order = models.IntegerField(default=0)

    def __str__(self):
        return f"{self.center.name} - {self.name}"

class CenterItemAlias(models.Model):
    center = models.ForeignKey(Center, on_delete=models.CASCADE)
    scanned_name = models.CharField(max_length=255)
    mapped_to = models.ForeignKey(CenterMasterItem, on_delete=models.CASCADE)

class PrintTemplate(models.Model):
    name = models.CharField(max_length=200, unique=True)
    source_centers = models.ManyToManyField(Center, blank=True) 
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class PrintTemplateItem(models.Model):
    template = models.ForeignKey(PrintTemplate, on_delete=models.CASCADE, related_name='items')
    name = models.CharField(max_length=200)
    category = models.CharField(max_length=50, choices=[('Raw Material', 'Raw Material'), ('Finished Goods', 'Finished Goods')])
    display_order = models.IntegerField(default=0)

    class Meta:
        ordering = ['category', 'display_order', 'name']

    def __str__(self):
        return f"{self.name} ({self.category})"



class TargetReportConfig(models.Model):
    """Stores the saved instance of a custom Target Report."""
    name = models.CharField(max_length=200, unique=True, help_text="e.g., Monthly Purchase Main")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class TargetReportColumn(models.Model):
    """Stores the individual custom columns within a saved report."""
    report = models.ForeignKey(TargetReportConfig, on_delete=models.CASCADE, related_name='columns')
    
    # CHANGED: Now a single column can pull data from multiple centers!
    centers = models.ManyToManyField(Center, related_name='target_columns')
    
    column_name = models.CharField(max_length=200) # e.g., "Gandhinagar (Combined)"
    monthly_target = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    selected_items = models.JSONField(default=list) 
    display_order = models.IntegerField(default=0)

    class Meta:
        ordering = ['display_order']

    def __str__(self):
        return f"{self.report.name} - {self.column_name}"

class CenterUploadToken(models.Model):
    """Per-center secret token enabling supervisors to upload stock sheets via a public URL.

    One active token per center. Admins can rotate or disable without deleting history.
    """
    center = models.OneToOneField(Center, on_delete=models.CASCADE, related_name='upload_token')
    token = models.CharField(max_length=64, unique=True, db_index=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    rotated_at = models.DateTimeField(null=True, blank=True)
    last_used_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        status = 'active' if self.is_active else 'disabled'
        return f"Upload token for {self.center.name} ({status})"

    @classmethod
    def generate_for(cls, center):
        """Create or rotate the token for `center`. Returns the saved token instance.

        Idempotent: if a token already exists, it is replaced (rotated) and
        `rotated_at` is set; on first creation, `rotated_at` stays NULL.
        """
        import secrets
        from django.utils import timezone
        new_token = secrets.token_urlsafe(32)
        obj, _created = cls.objects.update_or_create(
            center=center,
            defaults={
                'token': new_token,
                'is_active': True,
                'rotated_at': timezone.now(),
            },
        )
        return obj
