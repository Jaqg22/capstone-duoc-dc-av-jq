"""
URL configuration for rindebus_backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse

def health_check(request):
    """Health check endpoint"""
    return JsonResponse({
        'status': 'healthy',
        'service': 'RindeBus Django Backend',
        'version': '1.0.0',
        'message': 'Backend funcionando correctamente'
    })

def test_camera_quick(request):
    """Test rápido de cámara"""
    from django.shortcuts import render
    return render(request, 'test_camera_quick.html')

def test_proxy(request):
    """Test del proxy API"""
    from django.shortcuts import render
    return render(request, 'test_proxy.html')

urlpatterns = [
    path('admin/', admin.site.urls),
    # Frontend URLs - páginas HTML y proxy (DEBE ir antes que 'api/')
    path('', include('frontend.urls')),
    # API local (después del proxy para evitar conflictos)
    path('api-local/', include('document_detection.urls')),
    path('health/', health_check, name='health'),
    path('test-camera/', test_camera_quick, name='test_camera_quick'),
    path('test-proxy/', test_proxy, name='test_proxy'),
]

# Servir archivos media en desarrollo
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
