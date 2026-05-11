from django.shortcuts import render, get_object_or_404, redirect
import datetime
import calendar
from django.utils import timezone
from .models import Asset, MaintenanceLog
from django.contrib import messages
from .forms import AddAssetForm
from django.contrib.auth.decorators import login_required

@login_required
def dashboard(request):
    today = timezone.now().date()
    # Exclude Labour Safety from main dashboard
    assets = Asset.objects.filter(is_active=True).exclude(category='LABOUR_SAFETY').order_by('next_due_date')
    
    query = request.GET.get('q')
    if query:
        assets = assets.filter(name__icontains=query)

    overdue, critical, upcoming, healthy = [], [], [], []
    expired_names = []
    notifications = []

    for asset in assets:
        days_left = (asset.next_due_date - today).days
        item = {
            'obj': asset, 
            'days': days_left, 
            'abs_days': abs(days_left),
            'due_date': asset.next_due_date
        }

        # --- Notification & Alert Logic ---
        if asset.enable_reminders:
            if days_left == 30:
                notifications.append({'level': 'warning', 'text': f"Warning: {asset.name} is due in 1 month."})
            elif days_left == 15:
                notifications.append({'level': 'warning', 'text': f"Urgent: {asset.name} is due in 15 days."})
            elif days_left == 7:
                notifications.append({'level': 'danger', 'text': f"Critical: {asset.name} is due in 7 days."})
            elif 1 <= days_left <= 6:
                notifications.append({'level': 'info', 'text': f"Reminder: {asset.name} is due in {days_left} days."})
            elif days_left == 0:
                notifications.append({'level': 'danger', 'text': f"Critical: {asset.name} is due TODAY."})
            elif days_left < 0:
                # Collect overdue assets to show a summary message instead of flooding
                expired_names.append(asset.name)
        # ----------------------------------
        
        if days_left < 0:
            overdue.append(item)
        elif 0 <= days_left <= 7:
            critical.append(item)
        elif 7 < days_left <= 30:
            upcoming.append(item)
        else:
            healthy.append(item)
            
    # Dispatch Expired Alerts (grouped or individual based on count)
    if expired_names:
        if len(expired_names) <= 3:
            for name in expired_names:
                notifications.append({'level': 'danger', 'text': f"Expired: {name} is overdue for maintenance."})
        else:
            notifications.append({'level': 'danger', 'text': f"Expired: {len(expired_names)} assets are overdue and require immediate attention."})

    # Metrics Calculation
    total_assets = len(assets)
    total_overdue = len(overdue)
    total_critical = len(critical)
    
    readiness_pct = 0
    if total_assets > 0:
        # Compliance logic: Assets not overdue
        readiness_pct = int(((total_assets - total_overdue) / total_assets) * 100)

    context = {
        'overdue': overdue, 'critical': critical,
        'upcoming': upcoming, 'healthy': healthy, 'today': today,
        'total_assets': total_assets,
        'total_needs_attention': total_overdue + total_critical,
        'readiness_pct': readiness_pct,
        'query': query,
        'notifications': notifications,
    }

    return render(request, 'maintenance/dashboard.html', context)

@login_required
def labour_safety_dashboard(request):
    today = timezone.now().date()
    # Only show Labour Safety items
    assets = Asset.objects.filter(is_active=True, category='LABOUR_SAFETY').order_by('next_due_date')
    
    query = request.GET.get('q')
    if query:
        assets = assets.filter(name__icontains=query)

    overdue, critical, upcoming, healthy = [], [], [], []
    expired_names = []
    notifications = []

    for asset in assets:
        days_left = (asset.next_due_date - today).days
        item = {
            'obj': asset, 
            'days': days_left, 
            'abs_days': abs(days_left),
            'due_date': asset.next_due_date
        }

        # --- Notification & Alert Logic ---
        if asset.enable_reminders:
            if days_left == 30:
                notifications.append({'level': 'warning', 'text': f"Warning: {asset.name} is due in 1 month."})
            elif days_left == 15:
                notifications.append({'level': 'warning', 'text': f"Urgent: {asset.name} is due in 15 days."})
            elif days_left == 7:
                notifications.append({'level': 'danger', 'text': f"Critical: {asset.name} is due in 7 days."})
            elif 1 <= days_left <= 6:
                notifications.append({'level': 'info', 'text': f"Reminder: {asset.name} is due in {days_left} days."})
            elif days_left == 0:
                notifications.append({'level': 'danger', 'text': f"Critical: {asset.name} is due TODAY."})
            elif days_left < 0:
                expired_names.append(asset.name)
        # ----------------------------------
        
        if days_left < 0:
            overdue.append(item)
        elif 0 <= days_left <= 7:
            critical.append(item)
        elif 7 < days_left <= 30:
            upcoming.append(item)
        else:
            healthy.append(item)
            
    if expired_names:
        if len(expired_names) <= 3:
            for name in expired_names:
                notifications.append({'level': 'danger', 'text': f"Expired: {name} is overdue for maintenance."})
        else:
            notifications.append({'level': 'danger', 'text': f"Expired: {len(expired_names)} assets are overdue."})

    # Metrics Calculation
    total_assets = len(assets)
    total_overdue = len(overdue)
    total_critical = len(critical)
    
    readiness_pct = 0
    if total_assets > 0:
        readiness_pct = int(((total_assets - total_overdue) / total_assets) * 100)

    context = {
        'overdue': overdue, 'critical': critical,
        'upcoming': upcoming, 'healthy': healthy, 'today': today,
        'total_assets': total_assets, 'total_needs_attention': total_overdue + total_critical,
        'readiness_pct': readiness_pct, 'query': query, 'notifications': notifications,
        'page_title': 'Labour Safety Dashboard'
    }
    return render(request, 'maintenance/dashboard.html', context)

def update_service(request, asset_id):
    asset = get_object_or_404(Asset, id=asset_id)
    if request.method == "POST":
        MaintenanceLog.objects.create(
            asset=asset,
            completed_date=request.POST.get('completed_date'),
            new_due_date=request.POST.get('new_due_date'),
            document_image=request.FILES.get('document_image'),
            remarks=request.POST.get('remarks')
        )
        return redirect('maintenance:dashboard')
    return render(request, 'maintenance/update_service.html', {'asset': asset})

def add_new_asset(request):
    if request.method == 'POST':
        form = AddAssetForm(request.POST)
        if form.is_valid():
            asset = form.save(commit=False)
            
            # Check if user manually set a due date; if not, auto-calculate based on frequency
            initial_date = form.cleaned_data.get('initial_next_due_date')
            
            if initial_date:
                asset.next_due_date = initial_date
            else:
                # Calculate: Start Date + Frequency
                start = asset.purchase_or_start_date
                freq = asset.maintenance_frequency
                
                if freq == 'YEARLY':
                    try:
                        # Try same day next year (handles most cases)
                        asset.next_due_date = start.replace(year=start.year + 1)
                    except ValueError:
                        # Handle Leap Year (Feb 29 -> Feb 28 or Mar 1 logic via timedelta)
                        asset.next_due_date = start + datetime.timedelta(days=365)
                else:
                    # Monthly (+1) or Quarterly (+3)
                    months_to_add = 3 if freq == 'QUARTERLY' else 1
                    
                    month = start.month - 1 + months_to_add
                    year = start.year + month // 12
                    month = month % 12 + 1
                    day = min(start.day, calendar.monthrange(year, month)[1])
                    
                    asset.next_due_date = start.replace(year=year, month=month, day=day)
            
            asset.save()
            messages.success(request, f"New Asset '{asset.name}' added successfully!")
            return redirect('maintenance:dashboard')
    else:
        form = AddAssetForm()

    # Reuse dashboard context to show healthy status circles
    return render(request, 'maintenance/add_asset.html', {'form': form, 'today': timezone.now().date()})

@login_required
def notifications_list(request):
    return render(request, 'maintenance/notifications.html')