"""
URLs para las páginas del frontend
"""
from django.urls import path
from . import views

app_name = 'frontend'

urlpatterns = [
    path('', views.inicio_view, name='inicio'),
    path('inicio/', views.inicio_view, name='inicio'),
    path('main/', views.main_view, name='main'),
    path('manual/', views.manual_view, name='manual'),
    path('logout/', views.logout_view, name='logout'),
    path('health/', views.health_check_view, name='health'),
    # Proxy para API
    path('api/planillas/', views.api_proxy_planillas, name='api_proxy_planillas'),
    path('api/planillas/<int:planilla_id>/datos_extraidos/', views.api_proxy_datos_extraidos, name='api_proxy_datos_extraidos'),
]