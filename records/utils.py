from records.models import Site

def get_allowed_sites(request):
    """Returns the queryset of sites the user is allowed to see."""
    if not request.user.is_authenticated:
        return Site.objects.none()
        
    if request.user.is_superuser:
        return Site.objects.all()
    elif hasattr(request.user, 'nexus_profile'):
        return request.user.nexus_profile.allowed_sites.all()
    
    return Site.objects.none()

def get_active_site(request):
    """Handles site switching and retrieves the active site from the session."""
    allowed_sites = get_allowed_sites(request)
    
    if not allowed_sites.exists():
        return None

    # 1. Did the user click a new site in the dropdown?
    requested_site_id = request.GET.get('site_id')
    if requested_site_id:
        try:
            site = allowed_sites.get(id=requested_site_id)
            request.session['active_records_site_id'] = site.id
            return site
        except (Site.DoesNotExist, ValueError):
            pass # Ignore invalid IDs

    # 2. Grab the current site from the session
    active_site_id = request.session.get('active_records_site_id')
    if active_site_id:
        try:
            return allowed_sites.get(id=active_site_id)
        except Site.DoesNotExist:
            pass

    # 3. Default fallback to the first available site
    active_site = allowed_sites.first()
    request.session['active_records_site_id'] = active_site.id
    return active_site