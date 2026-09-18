"""
ChronosAI ASGI Configuration.
Exposes ProtocolTypeRouter with HTTP and WebSocket support using Daphne.
"""
import os
from django.core.asgi import get_asgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

# Initialize Django ASGI application early to ensure the AppRegistry is populated
django_asgi_app = get_asgi_application()

from channels.routing import ProtocolTypeRouter, URLRouter
from config.ws_auth import JWTAuthMiddlewareStack
import config.routing

application = ProtocolTypeRouter(
    {
        "http": django_asgi_app,
        "websocket": JWTAuthMiddlewareStack(
            URLRouter(config.routing.websocket_urlpatterns)
        ),
    }
)
