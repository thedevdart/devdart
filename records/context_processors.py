from records.utils import get_active_site, get_allowed_sites

def records_active_site(request):
    return {
        'active_site': get_active_site(request),
        'allowed_sites': get_allowed_sites(request)
    }