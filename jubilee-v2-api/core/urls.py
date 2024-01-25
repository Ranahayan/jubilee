from django.contrib import admin
from django.conf import settings
from django.conf.urls.static import static
from django.urls import path, re_path, include
from rest_framework import routers
from .health_check import health_check
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from .admin import secure_admin_site

router = routers.SimpleRouter()

schema_view = get_schema_view(
    openapi.Info(
        title="backend-boilerplate",
        default_version="v1",
        description="Apis for backend-boilerplate",
        terms_of_service="https://www.yourapp.com/terms/",
        contact=openapi.Contact(email="contact@yourapp.com"),
        license=openapi.License(name="Your License"),
    ),
    public=True,
    permission_classes=(permissions.AllowAny,),
)

urlpatterns = [
    path('', include(router.urls)),
    path('', include('authentication.urls')),
    path('shopify/', include('shopify_integration.urls')),
    path('file/', include('file.urls', "file")),
    path('billing/', include('billing.urls')),
    path('health_check/', health_check),
    path('webhooks/', include('webhooks.urls')),
    path('admin/', secure_admin_site.urls),
    path('dropshipping/', include('dropshipping.urls')),
    path('notifications/', include('notifications.urls')),
]

# Conditionally include Swagger and Redoc paths based on environment (settings.DEBUG)
if settings.DEBUG:
    urlpatterns += [
        re_path(r'^swagger(?P<format>\.json|\.yaml)$', schema_view.without_ui(cache_timeout=0), name='schema-json'),
        path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
        path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
    ]

urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
