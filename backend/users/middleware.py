import json
import uuid

from django.contrib.auth import get_user_model
from django.utils.deprecation import MiddlewareMixin
from rest_framework_simplejwt.authentication import JWTAuthentication

from .models import UserActivityLog


class UserActivityLoggingMiddleware(MiddlewareMixin):
    """Persist an audit row for each request/response cycle."""

    SENSITIVE_KEYS = {
        'password',
        'current_password',
        'new_password',
        'token',
        'access',
        'refresh',
        'otp',
        'otp_code',
    }

    def process_request(self, request):
        request._audit_request_id = request.headers.get('X-Request-ID', str(uuid.uuid4()))
        request._audit_payload = self._extract_request_payload(request)

    def process_response(self, request, response):
        try:
            self._create_activity_log(request, response)
        except Exception:
            # Logging should not break API responses.
            pass
        return response

    def _create_activity_log(self, request, response):
        path = getattr(request, 'path', '') or ''
        if path.startswith('/static/') or path.startswith('/media/'):
            return

        action_type = self._get_action_type(request)
        entity_type, entity_id = self._get_entity_target(path)

        actor_user = self._resolve_actor_user(request)
        actor_email = ''
        actor_role = ''

        if actor_user is not None:
            actor_email = getattr(actor_user, 'email', '') or ''
            actor_role = getattr(actor_user, 'role', '') or ''

        login_email = ''
        request_payload = self._sanitize_payload(getattr(request, '_audit_payload', None))
        if self._is_login_endpoint(path) and isinstance(request_payload, dict):
            login_email = request_payload.get('email', '')
            if not actor_email and login_email:
                actor_email = login_email
                matched_user = get_user_model().objects.filter(email=login_email).first()
                if matched_user is not None:
                    actor_role = getattr(matched_user, 'role', '') or ''

        response_data = self._extract_response_data(response)

        UserActivityLog.objects.create(
            actor_user=actor_user,
            actor_email=actor_email,
            actor_role=actor_role,
            action_type=action_type,
            entity_type=entity_type,
            entity_id=entity_id,
            endpoint=path,
            request_method=getattr(request, 'method', ''),
            request_id=getattr(request, '_audit_request_id', ''),
            ip_address=self._get_client_ip(request),
            user_agent=(request.META.get('HTTP_USER_AGENT', '') or '')[:1000],
            status_code=getattr(response, 'status_code', None),
            success=(200 <= getattr(response, 'status_code', 500) < 400),
            change_summary=self._build_summary(action_type, entity_type, entity_id, path),
            old_values=None,
            new_values=request_payload,
            metadata={
                'response': response_data,
                'login_email': login_email,
            },
        )

    def _extract_request_payload(self, request):
        if request.method not in {'POST', 'PUT', 'PATCH', 'DELETE'}:
            return None

        content_type = request.META.get('CONTENT_TYPE', '')
        if 'application/json' in content_type:
            try:
                raw = request.body.decode('utf-8') if request.body else ''
                if not raw:
                    return None
                return json.loads(raw)
            except Exception:
                return None

        if 'multipart/form-data' in content_type or 'application/x-www-form-urlencoded' in content_type:
            try:
                return dict(request.POST)
            except Exception:
                return None

        return None

    def _extract_response_data(self, response):
        data = getattr(response, 'data', None)
        if data is None:
            return None
        return self._sanitize_payload(data)

    def _sanitize_payload(self, value):
        if isinstance(value, dict):
            sanitized = {}
            for key, val in value.items():
                if str(key).lower() in self.SENSITIVE_KEYS:
                    sanitized[key] = '***'
                else:
                    sanitized[key] = self._sanitize_payload(val)
            return sanitized

        if isinstance(value, list):
            return [self._sanitize_payload(item) for item in value]

        return value

    def _resolve_actor_user(self, request):
        user = getattr(request, 'user', None)
        if user is not None and getattr(user, 'is_authenticated', False):
            return user

        header = request.META.get('HTTP_AUTHORIZATION', '')
        if not header.startswith('Bearer '):
            return None

        try:
            auth_result = JWTAuthentication().authenticate(request)
        except Exception:
            return None

        if not auth_result:
            return None

        return auth_result[0]

    def _get_action_type(self, request):
        path = (getattr(request, 'path', '') or '').lower()
        method = getattr(request, 'method', '').upper()

        if self._is_login_endpoint(path) and method == 'POST':
            return UserActivityLog.ActionType.LOGIN

        if '/logout/' in path and method == 'POST':
            return UserActivityLog.ActionType.LOGOUT

        if method == 'POST':
            return UserActivityLog.ActionType.CREATE
        if method in {'PUT', 'PATCH'}:
            return UserActivityLog.ActionType.UPDATE
        if method == 'DELETE':
            return UserActivityLog.ActionType.DELETE
        if method in {'GET', 'HEAD', 'OPTIONS'}:
            return UserActivityLog.ActionType.VIEW

        return UserActivityLog.ActionType.OTHER

    def _is_login_endpoint(self, path):
        return '/login/' in path

    def _get_entity_target(self, path):
        segments = [segment for segment in path.strip('/').split('/') if segment]
        if not segments:
            return '', ''

        entity_type = ''
        entity_id = ''

        if segments[0] == 'api' and len(segments) >= 3:
            app_label = segments[1]
            resource = segments[2]
            entity_type = f"{app_label}.{resource.replace('-', '_')}"
            if len(segments) >= 4 and segments[3].isdigit():
                entity_id = segments[3]
        else:
            entity_type = segments[0]
            if len(segments) >= 2 and segments[1].isdigit():
                entity_id = segments[1]

        return entity_type, entity_id

    def _get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR')

    def _build_summary(self, action_type, entity_type, entity_id, path):
        entity_label = entity_type or path or 'unknown_entity'
        if entity_id:
            return f"{action_type} {entity_label} ({entity_id})"
        return f"{action_type} {entity_label}"
