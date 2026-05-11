from django.db import models
from django.contrib.auth.models import User

class NexusApp(models.Model):
    """
    Defines the overarching modules of the ERP.
    e.g., 'inventory', 'records', 'manpower', 'hub'
    """
    name = models.CharField(max_length=50, unique=True)
    display_name = models.CharField(max_length=100)
    icon_class = models.CharField(max_length=100, blank=True, null=True, help_text="FontAwesome class e.g., fa-solid fa-box")
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.display_name

class AppFeature(models.Model):
    """
    The granular list of toggleable actions per app.
    e.g., app: 'inventory', code: 'can_export_excel', display: 'Can Export Excel Reports'
    """
    app = models.ForeignKey(NexusApp, on_delete=models.CASCADE, related_name='features')
    code_name = models.CharField(max_length=100, help_text="e.g., can_merge_masters")
    display_name = models.CharField(max_length=100)

    class Meta:
        unique_together = ('app', 'code_name')

    def __str__(self):
        return f"{self.app.display_name} - {self.display_name}"

class CustomRole(models.Model):
    """
    The UI-created roles that superusers configure.
    e.g., 'Store Manager', 'Regional Auditor'
    """
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
    
    # The Apps this role is allowed to access
    allowed_apps = models.ManyToManyField(NexusApp, related_name='roles')
    
    # The specific granular features turned ON for this role
    allowed_features = models.ManyToManyField(AppFeature, related_name='roles', blank=True)

    def __str__(self):
        return self.name

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='nexus_profile')
    roles = models.ManyToManyField(CustomRole, blank=True, related_name='users')
    
    # NEW: Categorization for the UI Dashboard
    primary_app = models.ForeignKey(NexusApp, on_delete=models.SET_NULL, null=True, blank=True, related_name='primary_users', help_text="Null means 'All / System Wide'")
    
    allowed_apps = models.ManyToManyField(NexusApp, blank=True)
    allowed_sites = models.ManyToManyField('records.Site', related_name='authorized_users', blank=True)
    allowed_departments = models.ManyToManyField('records.Department', related_name='authorized_signers', blank=True)

    def __str__(self):
        return f"Profile: {self.user.username}"