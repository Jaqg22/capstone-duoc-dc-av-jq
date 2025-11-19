from django.urls import path
from . import views

app_name = 'planillas'

urlpatterns = [
    path('empleado/<int:empleado_id>/', views.buscar_empleado, name='buscar_empleado'),
    path('empleados/', views.listar_empleados, name='listar_empleados'),
    path('bus/<int:bus_id>/', views.validar_bus, name='validar_bus'),
    path('buses/', views.listar_buses, name='listar_buses'),
    path('ciudad/', views.validar_ciudad, name='validar_ciudad'),
    path('ciudades/', views.listar_ciudades, name='listar_ciudades'),
    path('', views.PlanillaView.as_view(), name='planillas'),
]