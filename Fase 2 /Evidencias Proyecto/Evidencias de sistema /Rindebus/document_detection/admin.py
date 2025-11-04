from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from .models import DocumentProcessing, ProcessingStats

@admin.register(DocumentProcessing)
class DocumentProcessingAdmin(admin.ModelAdmin):
    """
    Admin para el modelo DocumentProcessing
    """
    
    list_display = [
        'id_short',
        'created_at',
        'confidence_badge',
        'processing_time_ms',
        'algorithm_used',
        'image_preview',
        'detection_status_badge'
    ]
    
    list_filter = [
        'algorithm_used',
        'created_at',
        'confidence_score'
    ]
    
    search_fields = [
        'id',
        'user_ip'
    ]
    
    readonly_fields = [
        'id',
        'created_at',
        'updated_at',
        'success_rate',
        'image_preview_large',
        'processed_preview_large'
    ]
    
    fieldsets = [
        ('Información General', {
            'fields': ('id', 'created_at', 'updated_at', 'user_ip')
        }),
        ('Imágenes', {
            'fields': ('original_image', 'image_preview_large', 'processed_image', 'processed_preview_large')
        }),
        ('Detección', {
            'fields': ('detected_rectangle', 'confidence_score', 'success_rate', 'algorithm_used')
        }),
        ('Metadatos', {
            'fields': ('processing_time', 'file_size', 'image_dimensions'),
            'classes': ('collapse',)
        })
    ]
    
    def id_short(self, obj):
        """Mostrar ID corto"""
        return str(obj.id)[:8]
    id_short.short_description = 'ID'
    
    def confidence_badge(self, obj):
        """Badge colorido para la confianza"""
        if obj.confidence_score is None:
            return format_html('<span style="color: gray;">N/A</span>')
        
        confidence_percent = int(obj.confidence_score * 100)
        
        if confidence_percent >= 80:
            color = 'green'
        elif confidence_percent >= 60:
            color = 'orange'
        else:
            color = 'red'
        
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}%</span>',
            color,
            confidence_percent
        )
    confidence_badge.short_description = 'Confianza'
    confidence_badge.admin_order_field = 'confidence_score'
    
    def processing_time_ms(self, obj):
        """Tiempo de procesamiento en milisegundos"""
        if obj.processing_time is None:
            return 'N/A'
        return f"{obj.processing_time * 1000:.1f} ms"
    processing_time_ms.short_description = 'Tiempo'
    processing_time_ms.admin_order_field = 'processing_time'
    
    def detection_status_badge(self, obj):
        """Badge para el estado de detección"""
        status = obj.get_detection_status()
        
        color_map = {
            'Excelente': 'green',
            'Buena': 'blue',
            'Regular': 'orange',
            'Pobre': 'red',
            'No procesado': 'gray'
        }
        
        color = color_map.get(status, 'gray')
        
        return format_html(
            '<span style="background-color: {}; color: white; padding: 2px 6px; border-radius: 3px; font-size: 11px;">{}</span>',
            color,
            status
        )
    detection_status_badge.short_description = 'Estado'
    
    def image_preview(self, obj):
        """Preview pequeño de la imagen"""
        if obj.original_image:
            return format_html(
                '<img src="{}" width="50" height="50" style="object-fit: cover; border-radius: 4px;" />',
                obj.original_image.url
            )
        return 'Sin imagen'
    image_preview.short_description = 'Preview'
    
    def image_preview_large(self, obj):
        """Preview grande de la imagen original"""
        if obj.original_image:
            return format_html(
                '<img src="{}" style="max-width: 300px; max-height: 300px; object-fit: contain; border: 1px solid #ddd;" />',
                obj.original_image.url
            )
        return 'Sin imagen'
    image_preview_large.short_description = 'Imagen Original'
    
    def processed_preview_large(self, obj):
        """Preview grande de la imagen procesada"""
        if obj.processed_image:
            return format_html(
                '<img src="{}" style="max-width: 300px; max-height: 300px; object-fit: contain; border: 1px solid #ddd;" />',
                obj.processed_image.url
            )
        return 'Sin imagen procesada'
    processed_preview_large.short_description = 'Imagen Procesada'

@admin.register(ProcessingStats)
class ProcessingStatsAdmin(admin.ModelAdmin):
    """
    Admin para estadísticas de procesamiento
    """
    
    list_display = [
        'date',
        'total_processed',
        'successful_detections', 
        'failed_detections',
        'success_rate_badge',
        'average_confidence_percent',
        'average_processing_time_ms'
    ]
    
    list_filter = ['date']
    
    readonly_fields = ['success_rate']
    
    def success_rate_badge(self, obj):
        """Badge para la tasa de éxito"""
        rate = obj.success_rate
        
        if rate >= 80:
            color = 'green'
        elif rate >= 60:
            color = 'orange'
        else:
            color = 'red'
        
        return format_html(
            '<span style="color: {}; font-weight: bold;">{:.1f}%</span>',
            color,
            rate
        )
    success_rate_badge.short_description = 'Tasa de Éxito'
    success_rate_badge.admin_order_field = 'successful_detections'
    
    def average_confidence_percent(self, obj):
        """Confianza promedio en porcentaje"""
        return f"{obj.average_confidence * 100:.1f}%"
    average_confidence_percent.short_description = 'Confianza Promedio'
    average_confidence_percent.admin_order_field = 'average_confidence'
    
    def average_processing_time_ms(self, obj):
        """Tiempo promedio en milisegundos"""
        return f"{obj.average_processing_time * 1000:.1f} ms"
    average_processing_time_ms.short_description = 'Tiempo Promedio'
    average_processing_time_ms.admin_order_field = 'average_processing_time'

# Configuración del admin site
admin.site.site_header = "RindeBus - Detección de Documentos"
admin.site.site_title = "RindeBus Admin"
admin.site.index_title = "Panel de Administración"
