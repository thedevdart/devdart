import json
from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse, HttpResponseForbidden
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.views.decorators.http import require_POST

from records.models import Site
from .models import NexusApp, AppFeature, CustomRole, UserProfile
from inventory.models import Center  # Required to assign sites to users

# ==========================================
# 1. THE NEXUS HUB LANDING PAGE
# ==========================================
@login_required
def nexus_hub(request):
    if request.user.is_superuser:
        allowed_app_names = ['inventory', 'manpower', 'records', 'maintenance']
        
    elif hasattr(request.user, 'nexus_profile'):
        # FIXED: Force all database names to lowercase so the template matches perfectly
        raw_names = request.user.nexus_profile.allowed_apps.values_list('name', flat=True)
        allowed_app_names = [name.lower() for name in raw_names]
        
        # Smart Redirect: Skip hub if they only have 1 app
        if len(allowed_app_names) == 1:
            single_app = allowed_app_names[0]
            app_routes = {
                'inventory': 'dashboard', 
                'manpower': '/manpower/', 
                'records': '/records/',
                'maintenance': '/maintenance/'
            }
            route = app_routes.get(single_app)
            if route:
                return redirect(route)
    else:
        allowed_app_names = []

    return render(request, 'hub/hub.html', {
        'allowed_app_names': allowed_app_names
    })
    
# ==========================================
# 2. RBAC DASHBOARD (SUPERUSER ONLY)
# ==========================================
@login_required
def manage_access_dashboard(request):
    if not request.user.is_superuser:
        return HttpResponseForbidden("Superuser access required.")
    
    roles = CustomRole.objects.prefetch_related('allowed_apps').all().order_by('name')
    
    # Pre-fetch the new primary_app to avoid N+1 database queries
    users = User.objects.select_related('nexus_profile__primary_app').prefetch_related('nexus_profile__roles').exclude(is_superuser=True).order_by('username')
    superusers = User.objects.filter(is_superuser=True).order_by('username')
    
    # Fetch apps to build the Tabs
    apps = NexusApp.objects.filter(is_active=True).order_by('id')
    
    return render(request, 'hub/manage_access.html', {
        'roles': roles,
        'users': users,
        'superusers': superusers,
        'apps': apps # NEW
    })
# ==========================================
# 3. DYNAMIC ROLE BUILDER (THE TABBED UI)
# ==========================================
@login_required
def role_builder(request, role_id=None):
    if not request.user.is_superuser:
        return HttpResponseForbidden("Superuser access required.")
        
    role = get_object_or_404(CustomRole, id=role_id) if role_id else None
    
    # Grab all active apps and their granular features to generate the tabs
    apps = NexusApp.objects.prefetch_related('features').filter(is_active=True).order_by('id')
    
    # If editing an existing role, pass its current checkmarks as JSON arrays
    assigned_apps = list(role.allowed_apps.values_list('id', flat=True)) if role else []
    assigned_features = list(role.allowed_features.values_list('id', flat=True)) if role else []
    
    return render(request, 'hub/role_builder.html', {
        'role': role,
        'apps': apps,
        'assigned_apps_json': json.dumps(assigned_apps),
        'assigned_features_json': json.dumps(assigned_features)
    })

@login_required
@require_POST
def api_save_role(request):
    if not request.user.is_superuser:
        return JsonResponse({'status': 'error', 'message': 'Unauthorized'}, status=403)
        
    try:
        data = json.loads(request.body)
        role_id = data.get('role_id')
        name = data.get('name', '').strip()
        description = data.get('description', '').strip()
        app_ids = data.get('apps', [])
        feature_ids = data.get('features', [])
        
        if not name:
            return JsonResponse({'status': 'error', 'message': 'Role name is required.'})
            
        if role_id:
            role = get_object_or_404(CustomRole, id=role_id)
            role.name = name
            role.description = description
            role.save()
        else:
            if CustomRole.objects.filter(name__iexact=name).exists():
                return JsonResponse({'status': 'error', 'message': 'Role name already exists.'})
            role = CustomRole.objects.create(name=name, description=description)
            
        # Update the ManyToMany relationships (the Checkboxes)
        role.allowed_apps.set(app_ids)
        role.allowed_features.set(feature_ids)
        
        return JsonResponse({'status': 'success'})
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)})

# ==========================================
# 4. USER & SITE ASSIGNMENT
# ==========================================
@login_required
def user_manager(request, user_id):
    if not request.user.is_superuser:
        return HttpResponseForbidden("Superuser access required.")
        
    target_user = get_object_or_404(User, id=user_id)
    profile, created = UserProfile.objects.get_or_create(user=target_user)
    
    roles = CustomRole.objects.all().order_by('name')
    apps = NexusApp.objects.filter(is_active=True).order_by('id')
    sites = Site.objects.all().order_by('name')
    
    assigned_apps = list(profile.allowed_apps.values_list('id', flat=True))
    assigned_sites = list(profile.allowed_sites.values_list('id', flat=True))
    
    # We need the ID of the 'records' app to trigger the frontend logic
    records_app = apps.filter(name='records').first()
    records_app_id = records_app.id if records_app else 0
    
    return render(request, 'hub/user_manager.html', {
        'target_user': target_user,
        'profile': profile,
        'roles': roles,
        'apps': apps,
        'sites': sites,
        'records_app_id': records_app_id,
        'assigned_apps_json': json.dumps(assigned_apps),
        'assigned_sites_json': json.dumps(assigned_sites)
    })

@login_required
@require_POST
def api_save_user_access(request, user_id):
    if not request.user.is_superuser:
        return JsonResponse({'status': 'error', 'message': 'Unauthorized'}, status=403)
        
    try:
        data = json.loads(request.body)
        role_ids = data.get('roles', []) 
        app_ids = data.get('apps', [])
        site_ids = data.get('sites', [])
        department_ids = data.get('departments', [])
        primary_app_id = data.get('primary_app') # NEW
        
        target_user = get_object_or_404(User, id=user_id)
        profile, _ = UserProfile.objects.get_or_create(user=target_user)
        
        # Save the single ForeignKey
        if primary_app_id and primary_app_id != 'all':
            profile.primary_app_id = int(primary_app_id)
        else:
            profile.primary_app = None
            
        profile.roles.set(role_ids)
        profile.allowed_apps.set(app_ids)
        profile.allowed_sites.set(site_ids)
        profile.allowed_departments.set(department_ids)
        
        profile.save()
        
        return JsonResponse({'status': 'success'})
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)})