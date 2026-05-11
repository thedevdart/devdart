from functools import wraps
from django.http import HttpResponseForbidden

def require_app_access(app_name):
    """
    Checks if the user has been explicitly granted access to this app 
    in their UserProfile (or if they are a superuser).
    """
    def decorator(view_func):
        @wraps(view_func)
        def _wrapped_view(request, *args, **kwargs):
            # Superusers bypass all app restrictions
            if request.user.is_superuser:
                return view_func(request, *args, **kwargs)
            
            if hasattr(request.user, 'nexus_profile'):
                # App access is now directly on the profile!
                if request.user.nexus_profile.allowed_apps.filter(name=app_name).exists():
                    return view_func(request, *args, **kwargs)
            
            return HttpResponseForbidden(f"You do not have access to the {app_name.capitalize()} application.")
        return _wrapped_view
    return decorator


def require_feature_access(feature_code):
    """
    Checks if any of the user's stacked Roles contain the specific granular feature.
    """
    def decorator(view_func):
        @wraps(view_func)
        def _wrapped_view(request, *args, **kwargs):
            # Superusers bypass all feature restrictions
            if request.user.is_superuser:
                return view_func(request, *args, **kwargs)
            
            if hasattr(request.user, 'nexus_profile'):
                # We filter across all roles assigned to the user to see if ANY of them grant this feature
                if request.user.nexus_profile.roles.filter(allowed_features__code_name=feature_code).exists():
                    return view_func(request, *args, **kwargs)
                    
            return HttpResponseForbidden("You do not have the required permissions for this action.")
        return _wrapped_view
    return decorator