import urllib.parse
from django.contrib.auth.models import AnonymousUser
from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken
from django.contrib.auth import get_user_model

User = get_user_model()

@database_sync_to_async
def get_user_from_token(token_key):
    try:
        access_token = AccessToken(token_key)
        user_id = access_token["user_id"]
        return User.objects.get(id=user_id)
    except (TokenError, InvalidToken, User.DoesNotExist):
        return AnonymousUser()

class JWTAuthMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send):
        headers = dict(scope.get("headers", []))
        token = None

        # Try to get token from cookies
        if b"cookie" in headers:
            cookies = headers[b"cookie"].decode("utf-8").split(";")
            for cookie in cookies:
                if "=" in cookie:
                    key, value = cookie.strip().split("=", 1)
                    if key == "authToken":
                        token = value
                        break
        
        # Try to get token from query string as fallback
        if not token and b"token" in scope.get("query_string", b""):
            query = urllib.parse.parse_qs(scope["query_string"].decode())
            if "token" in query:
                token = query["token"][0]

        if token:
            scope["user"] = await get_user_from_token(token)
        else:
            scope["user"] = AnonymousUser()

        return await super().__call__(scope, receive, send)

def JWTAuthMiddlewareStack(inner):
    return JWTAuthMiddleware(inner)
