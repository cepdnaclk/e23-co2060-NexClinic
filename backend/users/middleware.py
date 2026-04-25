import json
import re
import uuid

from django.contrib.auth import get_user_model
from django.utils.deprecation import MiddlewareMixin
from rest_framework_simplejwt.authentication import JWTAuthentication

from .activity_log_settings import (
    ACTIVITY_LOG_ENABLED,
    ACTIVITY_LOG_EXCLUDED_PATH_PREFIXES,
    ACTIVITY_LOG_EVENT_CATEGORY_PREFIXES,
    ACTIVITY_LOG_LOG_ALL_VIEWS,
    ACTIVITY_LOG_MAX_DICT_ITEMS,
    ACTIVITY_LOG_MAX_LIST_ITEMS,
    ACTIVITY_LOG_MAX_PAYLOAD_CHARS,
    ACTIVITY_LOG_MAX_STRING_LENGTH,
    ACTIVITY_LOG_SENSITIVE_KEYS,
    ACTIVITY_LOG_SENSITIVE_VIEW_PREFIXES,
)
from .models import UserActivityLog


class UserActivityLoggingMiddleware(MiddlewareMixin):
    """Persist an audit row for each request/response cycle."""

    NON_ENTITY_SEGMENTS = {
        'action',
        'reschedule',
        'login',
        'logout',
        'verify-otp',
        'resend-otp',
        'token',
        'refresh',
        'change',
        'add',
        'list',
    }

    SLUG_PATTERN = re.compile(r'^[A-Za-z0-9][A-Za-z0-9_-]{5,63}$')

    def __init__(self, get_response=None):
        super().__init__(get_response)
        self.logging_enabled = ACTIVITY_LOG_ENABLED
        self.log_all_views = ACTIVITY_LOG_LOG_ALL_VIEWS
        self.sensitive_keys = {str(key).lower() for key in ACTIVITY_LOG_SENSITIVE_KEYS}
        self.excluded_path_prefixes = tuple(ACTIVITY_LOG_EXCLUDED_PATH_PREFIXES)
        self.sensitive_view_prefixes = tuple(ACTIVITY_LOG_SENSITIVE_VIEW_PREFIXES)
        self.event_category_prefixes = tuple(ACTIVITY_LOG_EVENT_CATEGORY_PREFIXES)
        self.max_string_length = ACTIVITY_LOG_MAX_STRING_LENGTH
        self.max_list_items = ACTIVITY_LOG_MAX_LIST_ITEMS
        self.max_dict_items = ACTIVITY_LOG_MAX_DICT_ITEMS
        self.max_payload_chars = ACTIVITY_LOG_MAX_PAYLOAD_CHARS

    def process_request(self, request):
        request._audit_request_id = request.headers.get('X-Request-ID', str(uuid.uuid4()))
        request._audit_payload = self._extract_request_payload(request)

    def process_response(self, request, response):
        request_id = getattr(request, '_audit_request_id', '')
        if request_id and hasattr(response, '__setitem__') and not response.get('X-Request-ID'):
            response['X-Request-ID'] = request_id

        try:
            self._create_activity_log(request, response)
        except Exception:
            # Logging should not break API responses.
            pass
        return response

    def _create_activity_log(self, request, response):
        if not self.logging_enabled:
            return

        path = getattr(request, 'path', '') or ''
        if self._should_skip_logging(path):
            return

        action_type = self._get_action_type(request)
        if action_type == UserActivityLog.ActionType.VIEW and not self._should_log_view(path):
            return

        entity_type, entity_id = self._get_entity_target(path)
        event_category = self._get_event_category(path, action_type)

        actor_user = self._resolve_actor_user(request)
        actor_email = ''
        actor_role = ''

        if actor_user is not None:
            actor_email = getattr(actor_user, 'email', '') or ''
            actor_role = getattr(actor_user, 'role', '') or ''

        login_email = ''
        request_payload = self._finalize_payload(getattr(request, '_audit_payload', None))
        if self._is_login_endpoint(path) and isinstance(request_payload, dict):
            login_email = request_payload.get('email', '')
            if not actor_email and login_email:
                actor_email = login_email
                matched_user = get_user_model().objects.filter(email=login_email).first()
                if matched_user is not None:
                    actor_role = getattr(matched_user, 'role', '') or ''

        response_data = self._finalize_payload(self._extract_response_data(response))

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
                'event_category': event_category,
                'path_segments': [segment for segment in path.strip('/').split('/') if segment],
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
        return data

    def _should_skip_logging(self, path):
        return path.startswith(self.excluded_path_prefixes)

    def _should_log_view(self, path):
        if self.log_all_views:
            return True
        return path.startswith(self.sensitive_view_prefixes)

    def _finalize_payload(self, value):
        sanitized = self._sanitize_payload(value)
        truncated = self._truncate_payload(sanitized)

        try:
            serialized = json.dumps(truncated, default=str)
        except Exception:
            return truncated

        if len(serialized) <= self.max_payload_chars:
            return truncated

        return {
            '_truncated': True,
            'reason': 'payload_too_large',
            'preview': serialized[: self.max_payload_chars],
            'original_length': len(serialized),
        }

    def _sanitize_payload(self, value):
        if isinstance(value, dict):
            sanitized = {}
            for key, val in value.items():
                if str(key).lower() in self.sensitive_keys:
                    sanitized[key] = '***'
                else:
                    sanitized[key] = self._sanitize_payload(val)
            return sanitized

        if isinstance(value, list):
            return [self._sanitize_payload(item) for item in value]

        return value

    def _truncate_payload(self, value):
        if isinstance(value, str):
            if len(value) > self.max_string_length:
                return value[: self.max_string_length] + '...[truncated]'
            return value

        if isinstance(value, list):
            truncated_items = [self._truncate_payload(item) for item in value[: self.max_list_items]]
            if len(value) > self.max_list_items:
                truncated_items.append({'_truncated_items': len(value) - self.max_list_items})
            return truncated_items

        if isinstance(value, dict):
            truncated_dict = {}
            for idx, (key, val) in enumerate(value.items()):
                if idx >= self.max_dict_items:
                    truncated_dict['_truncated_keys'] = len(value) - self.max_dict_items
                    break
                truncated_dict[key] = self._truncate_payload(val)
            return truncated_dict

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
            entity_id = self._extract_entity_id(segments[3:])
        else:
            entity_type = segments[0]
            entity_id = self._extract_entity_id(segments[1:])

        return entity_type, entity_id

    def _extract_entity_id(self, candidate_segments):
        for segment in candidate_segments:
            normalized = (segment or '').strip().lower()
            if not normalized or normalized in self.NON_ENTITY_SEGMENTS:
                continue

            if normalized.isdigit() or self._is_uuid(normalized) or self.SLUG_PATTERN.match(normalized):
                return segment

        return ''

    def _is_uuid(self, value):
        try:
            uuid.UUID(value)
        except (TypeError, ValueError, AttributeError):
            return False
        return True

    def _get_event_category(self, path, action_type):
        normalized_path = (path or '').lower()

        for prefix, category in self.event_category_prefixes:
            if normalized_path.startswith(prefix.lower()):
                return category

        if action_type in {UserActivityLog.ActionType.LOGIN, UserActivityLog.ActionType.LOGOUT}:
            return 'auth'
        if normalized_path.startswith('/api/doctor/'):
            return 'doctor'
        if normalized_path.startswith('/api/patient/'):
            return 'patient'
        if normalized_path.startswith('/api/users/'):
            return 'users'
        if normalized_path.startswith('/admin/'):
            return 'admin'
        if action_type == UserActivityLog.ActionType.VIEW:
            return 'read'
        if action_type in {
            UserActivityLog.ActionType.CREATE,
            UserActivityLog.ActionType.UPDATE,
            UserActivityLog.ActionType.DELETE,
        }:
            return 'write'
        return 'other'

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
