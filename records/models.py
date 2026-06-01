from django.db import models
from django.contrib.auth.models import User

# --- CONSTANTS FOR SIGNATURES & COMPLIANCE ---
L1_ROLES = [
    ('PREPARED', 'Prepared By'),
    ('TESTED', 'Tested By'),
    ('CHECKED', 'Checked By'),
    ('CALIBRATED', 'Calibrated By'),
]

L2_ROLES = [
    ('APPROVED', 'Approved By'),
    ('VERIFIED', 'Verified By'),
]

RECORD_STATUS = [
    ('DRAFT', 'Draft / In Progress'),
    ('PENDING_L2', 'Pending L2 Approval'),
    ('LOCKED', 'Approved & Locked'),
]


# --- 1. INFRASTRUCTURE (Managed in Django Admin) ---

class Site(models.Model):
    name = models.CharField(max_length=100, unique=True) # e.g., "Umargaon Plant"
    location = models.CharField(max_length=200, blank=True, null=True)

    def __str__(self):
        return self.name

class Department(models.Model):
    name = models.CharField(max_length=100) # e.g., "Quality", "EHS", "HR"
    site = models.ForeignKey(Site, on_delete=models.CASCADE, related_name='departments')

    class Meta:
        unique_together = ('name', 'site')

    def __str__(self):
        return f"{self.name} ({self.site.name})"


# --- 2. TEMPLATES (The Form Blueprints) ---

class DocumentTemplate(models.Model):
    TYPE_CHOICES = (
        ('PRINT_ONLY', 'View & Print Only (Static SOPs)'),
        ('DIGITAL_ENTRY', 'Digital Entry (Filled on Website)'),
        ('PHYSICAL_OCR', 'Physical OCR (Scanned & Extracted)'),
    )
    FREQUENCY_CHOICES = (
        ('DAILY', 'Daily'),
        ('WEEKLY', 'Weekly'),
        ('MONTHLY', 'Monthly'),
        ('QUARTERLY', 'Quarterly'),
        ('HALF_YEARLY', 'Half-Yearly'),
        ('YEARLY', 'Yearly (Financial Year)'),
    )
    TRACKING_CHOICES = (
        ('TIME_ONLY', 'Time-Based Only'),
        ('TIME_AND_CUSTOM', 'Time + Custom Category (e.g., Machines, Shifts)'),
    )

    title = models.CharField(max_length=200)
    format_id = models.CharField(max_length=100, blank=True, null=True)
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='templates')
    
    document_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='PHYSICAL_OCR')
    
    frequency = models.CharField(max_length=20, choices=FREQUENCY_CHOICES, default='DAILY')
    tracking_type = models.CharField(max_length=20, choices=TRACKING_CHOICES, default='TIME_ONLY')
    
    custom_categories = models.JSONField(blank=True, null=True, help_text="Array of custom parameters")
    
    html_layout = models.TextField(help_text="HTML table structure")
    ai_prompt_schema = models.JSONField(blank=True, null=True)
    custom_extraction_prompt = models.TextField(blank=True, null=True, help_text="AI instructions for OCR")

    # --- NEW: Signature Compliance Roles ---
    l1_signature_role = models.CharField(max_length=20, choices=L1_ROLES, null=True, blank=True, help_text="The Maker role")
    l2_signature_role = models.CharField(max_length=20, choices=L2_ROLES, null=True, blank=True, help_text="The Checker role")
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"[{self.get_document_type_display()}] {self.title}"
        

# --- 3. LIVE DATA (Parent & Child Versioning) ---

class DailyReport(models.Model):
    """ The master logical record for a specific day/shift/machine """
    template = models.ForeignKey(DocumentTemplate, on_delete=models.RESTRICT, related_name='daily_reports')
    report_date = models.DateField()
    shift = models.CharField(max_length=50, blank=True, null=True) # "Day", "Night", "General"
    machine_id = models.CharField(max_length=100, blank=True, null=True) 
    
    # Always holds the absolute newest numbers for fast reporting dashboards
    latest_data = models.JSONField(default=dict)
    
    # --- NEW: Digital Signature & Status Tracking ---
    status = models.CharField(max_length=20, choices=RECORD_STATUS, default='DRAFT')
    
    l1_signed_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name='l1_signed_records', null=True, blank=True)
    l1_signed_at = models.DateTimeField(null=True, blank=True)
    
    l2_signed_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name='l2_signed_records', null=True, blank=True)
    l2_signed_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('template', 'report_date', 'shift', 'machine_id')

    def __str__(self):
        base_name = f"{self.template.title} - {self.report_date}"
        if self.machine_id:
            base_name += f" (M/C: {self.machine_id})"
        if self.shift:
            base_name += f" ({self.shift})"
        return f"{base_name} [{self.get_status_display()}]"


class ReportVersion(models.Model):
    """ The immutable audit trail of every scan, edit, and signature """
    ACTION_CHOICES = (
        ('NEW_UPLOAD', 'New Scan Upload'),
        ('MANUAL_EDIT', 'Manual Correction'),
        ('L1_SIGNATURE', 'L1 (Maker) Signature Applied'),
        ('L2_SIGNATURE', 'L2 (Checker) Signature Applied'),
        ('REJECTED', 'Rejected / Returned to Draft'),
    )

    daily_report = models.ForeignKey(DailyReport, on_delete=models.CASCADE, related_name='versions')
    version_number = models.PositiveIntegerField() # 1, 2, 3...
    action_type = models.CharField(max_length=20, choices=ACTION_CHOICES)
    
    update_reason = models.CharField(max_length=255, blank=True, null=True, help_text="Reason for update (e.g., Added rows, Fixed typo)")
    
    data_snapshot = models.JSONField()
    scanned_file = models.FileField(upload_to='scans/%Y/%m/%d/', blank=True, null=True)
    
    modified_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    modified_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-version_number'] # Newest versions first

    def save(self, *args, **kwargs):
        if self.scanned_file:
            from core.utils import compress_file_if_needed
            compress_file_if_needed(self.scanned_file)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.daily_report} - v{self.version_number}"