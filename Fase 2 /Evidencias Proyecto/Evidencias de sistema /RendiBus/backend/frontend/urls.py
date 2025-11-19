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
    path('cargar_imagen/', views.cargar_imagen_view, name='cargar_imagen'),
    path('preview/', views.preview_view, name='preview'),
    path('manual/', views.manual_view, name='manual'),
    path('consultas/', views.consultas_view, name='consultas'),
    path('logout/', views.logout_view, name='logout'),
    path('health/', views.health_check_view, name='health'),
    # Procesamiento de imágenes
    path('api/upload_imagen/', views.upload_imagen_azure, name='upload_imagen_azure'),
    path('api/get_datos_extraidos/<str:planilla_id>/', views.get_datos_extraidos_azure, name='get_datos_extraidos_azure'),
    path('api/save_planilla/', views.save_planilla_postgres, name='save_planilla_postgres'),
    # Proxy para API (legacy)
    path('api/planillas/', views.api_proxy_planillas, name='api_proxy_planillas'),
    path('api/planillas/<int:planilla_id>/datos_extraidos/', views.api_proxy_datos_extraidos, name='api_proxy_datos_extraidos'),
    # Endpoints para consultas
    path('api/consultas/planillas/', views.api_consultas_planillas, name='api_consultas_planillas'),
    path('api/consultas/empleados/', views.api_consultas_empleados, name='api_consultas_empleados'),
    path('api/consultas/buses/', views.api_consultas_buses, name='api_consultas_buses'),
    path('api/consultas/ciudades/', views.api_consultas_ciudades, name='api_consultas_ciudades'),
]