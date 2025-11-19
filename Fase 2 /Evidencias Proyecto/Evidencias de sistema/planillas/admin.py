from django.contrib import admin
from django.utils.html import format_html
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import User
from .models import Cargo, Empleado, Bus, Ciudad, Planilla


# Personalizar administración de usuarios
class CustomUserAdmin(BaseUserAdmin):
    """Administración personalizada de usuarios"""
    
    list_display = BaseUserAdmin.list_display + ('get_groups', 'date_joined')
    list_filter = BaseUserAdmin.list_filter + ('groups', 'date_joined')
    search_fields = BaseUserAdmin.search_fields + ('groups__name',)
    
    def get_groups(self, obj):
        """Mostrar grupos del usuario"""
        return ", ".join([g.name for g in obj.groups.all()]) if obj.groups.exists() else "Sin grupo"
    get_groups.short_description = '👥 Roles'
    get_groups.admin_order_field = 'groups__name'


# Re-registrar el modelo User con nuestra configuración personalizada
admin.site.unregister(User)
admin.site.register(User, CustomUserAdmin)


@admin.register(Cargo)
class CargoAdmin(admin.ModelAdmin):
    list_display = ['cargo_id', 'nombre_cargo']
    search_fields = ['nombre_cargo']
    ordering = ['nombre_cargo']


@admin.register(Empleado)
class EmpleadoAdmin(admin.ModelAdmin):
    list_display = ['empleado_id', 'nombre_completo', 'cargo', 'email', 'telefono', 'activo_status']
    list_filter = ['cargo', 'activo', 'fecha_ingreso']
    search_fields = ['primer_nombre', 'primer_apellido', 'email']
    ordering = ['primer_apellido', 'primer_nombre']
    readonly_fields = ['fecha_ingreso']
    
    fieldsets = (
        ('Información Personal', {
            'fields': ('primer_nombre', 'segundo_nombre', 'primer_apellido', 'segundo_apellido')
        }),
        ('Contacto', {
            'fields': ('telefono', 'email')
        }),
        ('Información Laboral', {
            'fields': ('cargo', 'activo', 'fecha_ingreso')
        }),
    )
    
    def activo_status(self, obj):
        if obj.activo:
            return format_html('<span style="color: green;">✓ Activo</span>')
        return format_html('<span style="color: red;">✗ Inactivo</span>')
    activo_status.short_description = 'Estado'


@admin.register(Bus)
class BusAdmin(admin.ModelAdmin):
    list_display = ['bus_id', 'patente', 'modelo', 'año', 'activo_status']
    list_filter = ['activo', 'año']
    search_fields = ['bus_id', 'patente', 'modelo']
    ordering = ['bus_id']
    
    def activo_status(self, obj):
        if obj.activo:
            return format_html('<span style="color: green;">✓ Activo</span>')
        return format_html('<span style="color: red;">✗ Inactivo</span>')
    activo_status.short_description = 'Estado'


@admin.register(Ciudad)
class CiudadAdmin(admin.ModelAdmin):
    list_display = ['ciudad_id', 'nombre_ciudad', 'region', 'activo_status']
    list_filter = ['activo', 'region']
    search_fields = ['ciudad_id', 'nombre_ciudad', 'region']
    ordering = ['nombre_ciudad']
    
    def activo_status(self, obj):
        if obj.activo:
            return format_html('<span style="color: green;">✓ Activo</span>')
        return format_html('<span style="color: red;">✗ Inactivo</span>')
    activo_status.short_description = 'Estado'


@admin.register(Planilla)
class PlanillaAdmin(admin.ModelAdmin):
    list_display = [
        'id_planilla', 'fecha', 'bus', 'conductor_nombre', 
        'ciudad_origen', 'ganancia_display', 'fecha_creacion'
    ]
    list_filter = [
        'fecha', 'bus', 'cod_origen', 'cod_conductor__cargo', 
        'fecha_creacion'
    ]
    search_fields = [
        'id_planilla', 'bus__patente', 'cod_conductor__primer_nombre', 
        'cod_conductor__primer_apellido'
    ]
    ordering = ['-fecha', '-id_planilla']
    readonly_fields = [
        'total_produccion', 'total_egresos', 'ganancia_neta', 
        'fecha_creacion', 'fecha_modificacion', 'duracion_viaje'
    ]
    
    fieldsets = (
        ('Información General', {
            'fields': ('id_planilla', 'fecha', 'bus')
        }),
        ('Personal', {
            'fields': ('cod_conductor', 'cod_asistente')
        }),
        ('Horarios y Destinos', {
            'fields': ('horario_origen', 'horario_retorno', 'cod_origen', 'cod_retorno')
        }),
        ('Ingresos', {
            'fields': ('ingreso_oficina', 'ingreso_ruta', 'total_produccion'),
            'classes': ('wide',)
        }),
        ('Egresos', {
            'fields': ('pension', 'viaticos', 'losa', 'cena', 'otros_gastos', 'total_egresos'),
            'classes': ('wide',)
        }),
        ('Resultados', {
            'fields': ('ganancia_neta', 'duracion_viaje'),
            'classes': ('wide',)
        }),
        ('Auditoría', {
            'fields': ('fecha_creacion', 'fecha_modificacion'),
            'classes': ('collapse',)
        }),
    )
    
    def conductor_nombre(self, obj):
        return obj.cod_conductor.nombre_completo
    conductor_nombre.short_description = 'Conductor'
    
    def ciudad_origen(self, obj):
        return obj.cod_origen.nombre_ciudad
    ciudad_origen.short_description = 'Origen'
    
    def ganancia_display(self, obj):
        ganancia = obj.ganancia_neta
        color = 'green' if ganancia >= 0 else 'red'
        return format_html(
            '<span style="color: {}; font-weight: bold;">${:,.0f}</span>',
            color, ganancia
        )
    ganancia_display.short_description = 'Ganancia Neta'
    
    # Filtros personalizados para fechas
    date_hierarchy = 'fecha'


# Personalizar el sitio de administración
admin.site.site_header = "RindeBus - Sistema de Administración"
admin.site.site_title = "RindeBus Admin"
admin.site.index_title = "Panel de Control RindeBus"
