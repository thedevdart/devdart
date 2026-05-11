from django.utils import timezone
from .models import Asset

def global_notifications(request):
    if not request.user.is_authenticated:
        return {'global_notifications': []}

    today = timezone.now().date()
    # Fetch all active assets with reminders, regardless of category
    assets = Asset.objects.filter(is_active=True, enable_reminders=True)
    
    notifs = []
    expired_names = []

    for asset in assets:
        days_left = (asset.next_due_date - today).days
        
        if days_left == 30:
            notifs.append({'level': 'warning', 'text': f"Warning: {asset.name} is due in 1 month."})
        elif days_left == 15:
            notifs.append({'level': 'warning', 'text': f"Urgent: {asset.name} is due in 15 days."})
        elif days_left == 7:
            notifs.append({'level': 'danger', 'text': f"Critical: {asset.name} is due in 7 days."})
        elif 1 <= days_left <= 6:
            notifs.append({'level': 'info', 'text': f"Reminder: {asset.name} is due in {days_left} days."})
        elif days_left == 0:
            notifs.append({'level': 'danger', 'text': f"Critical: {asset.name} is due TODAY."})
        elif days_left < 0:
            expired_names.append(asset.name)
            
    if expired_names:
        if len(expired_names) <= 3:
            for name in expired_names:
                notifs.append({'level': 'danger', 'text': f"Expired: {name} is overdue."})
        else:
            notifs.append({'level': 'danger', 'text': f"Expired: {len(expired_names)} assets are overdue."})
            
    return {'global_notifications': notifs}