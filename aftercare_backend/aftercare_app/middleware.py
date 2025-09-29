# middleware.py
import json
import logging
from django.http import JsonResponse
from django.utils.deprecation import MiddlewareMixin
from .models import ActivityLog, User
import jwt
from django.conf import settings

logger = logging.getLogger(__name__)

class UserTypeMiddleware(MiddlewareMixin):
    def process_view(self, request, view_func, view_args, view_kwargs):
        # Skip middleware for auth endpoints
        if request.path.startswith('/api/auth/') or request.path == '/api/docs/':
            return None

        # Get token from header
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return JsonResponse({'error': 'Authentication required'}, status=401)

        token = auth_header.split(' ')[1]

        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
            user_id = payload.get('user_id')

            if not user_id:
                return JsonResponse({'error': 'Invalid token'}, status=401)

            try:
                user = User.objects.get(id=user_id)
                request.user = user
            except User.DoesNotExist:
                return JsonResponse({'error': 'User not found'}, status=401)

        except jwt.ExpiredSignatureError:
            return JsonResponse({'error': 'Token expired'}, status=401)
        except jwt.InvalidTokenError:
            return JsonResponse({'error': 'Invalid token'}, status=401)

        # Check user type for protected endpoints
        if hasattr(view_func, 'required_user_types'):
            required_types = view_func.required_user_types
            if user.user_type not in required_types:
                return JsonResponse({'error': f"Access denied. One of {', '.join(required_types)} role(s) required"}, status=403)

        return None

class LoggingMiddleware(MiddlewareMixin):
    def process_request(self, request):
        request.log_data = {
            'ip_address': self.get_client_ip(request),
            'user_agent': request.META.get('HTTP_USER_AGENT', ''),
        }

    def process_response(self, request, response):
        if hasattr(request, 'user') and request.user.is_authenticated:
            user = request.user
        else:
            user = None

        # Log major activities (excluding health checks, static files, etc.)
        if not request.path.startswith(('/health', '/static/', '/media/')):
            ActivityLog.objects.create(
                user=user,
                action=f"{request.method} {request.path}",
                details=f"Response: {response.status_code}",
                ip_address=request.log_data['ip_address'],
                log_level='INFO' if response.status_code < 400 else 'ERROR'
            )

            # Also log to file
            logger.info(f"User: {user.id if user else 'Anonymous'}, "
                       f"Action: {request.method} {request.path}, "
                       f"Status: {response.status_code}, "
                       f"IP: {request.log_data['ip_address']}")

        return response

    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip

def user_type_required(user_type):
    def decorator(view_func):
        view_func.required_user_type = user_type
        return view_func
    return decorator
