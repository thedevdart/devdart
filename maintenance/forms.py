from django import forms
from .models import Asset, MaintenanceLog

class AddAssetForm(forms.ModelForm):
    # We define these as separate input fields for clean calendar pickers
    purchase_or_start_date = forms.DateField(
        widget=forms.DateInput(attrs={'class': 'saas-input', 'type': 'date'}),
        label="Purchase / Start Date"
    )
    initial_next_due_date = forms.DateField(
        widget=forms.DateInput(attrs={'class': 'saas-input', 'type': 'date'}),
        label="First Maintenance Due Date (Optional)",
        required=False
    )

    class Meta:
        model = Asset
        fields = ['name', 'category', 'location', 'purchase_or_start_date', 'maintenance_frequency', 'enable_reminders']
        
        # Applying modern, clean, large inputs for mobile use
        widgets = {
            'name': forms.TextInput(attrs={'class': 'saas-input', 'placeholder': 'Lathe #5, RO Plant...'}),
            'category': forms.Select(attrs={'class': 'saas-select'}),
            'maintenance_frequency': forms.Select(attrs={'class': 'saas-select'}),
            'location': forms.TextInput(attrs={'class': 'saas-input', 'placeholder': 'Zone A, Block B...'}),
            'enable_reminders': forms.CheckboxInput(attrs={'class': 'form-check-input'}),
        }