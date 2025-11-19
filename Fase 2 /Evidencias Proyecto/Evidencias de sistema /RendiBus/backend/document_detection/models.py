from django.db import models
import uuid
from django.core.validators import FileExtensionValidator

class DocumentProcessing(models.Model):
    """Modelo para almacenar el procesamiento de documentos"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Información del archivo original
    original_image = models.ImageField(
        upload_to='original_images/',
        validators=[FileExtensionValidator(allowed_extensions=['jpg', 'jpeg', 'png', 'bmp'])],
        help_text="Imagen original subida por el usuario"
    )
    
    # Resultados de la detección
    detected_rectangle = models.JSONField(
        null=True, blank=True,
        help_text="Coordenadas del rectángulo detectado por OpenCV"
    )
    
    confidence_score = models.FloatField(
        null=True, blank=True,
        help_text="Puntuación de confianza de la detección (0.0 - 1.0)"
    )
    
    # Imagen procesada
    processed_image = models.ImageField(
        upload_to='processed_images/',
        null=True, blank=True,
        help_text="Imagen recortada y procesada"
    )
    
    # Metadatos
    processing_time = models.FloatField(
        null=True, blank=True,
        help_text="Tiempo de procesamiento en segundos"
    )
    
    algorithm_used = models.CharField(
        max_length=50,
        default='opencv_canny',
        help_text="Algoritmo usado para la detección"
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Información adicional
    file_size = models.PositiveIntegerField(
        null=True, blank=True,
        help_text="Tamaño del archivo original en bytes"
    )
    
    image_dimensions = models.JSONField(
        null=True, blank=True,
        help_text="Dimensiones de la imagen original {width, height}"
    )
    
    user_ip = models.GenericIPAddressField(
        null=True, blank=True,
        help_text="IP del usuario que subió la imagen"
    )
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = "Procesamiento de Documento"
        verbose_name_plural = "Procesamientos de Documentos"
    
    def __str__(self):
        return f"Documento {self.id} - {self.created_at.strftime('%Y-%m-%d %H:%M')}"
    
    @property
    def success_rate(self):
        """Calcula una métrica de éxito basada en la confianza"""
        if self.confidence_score is None:
            return 0
        return min(100, int(self.confidence_score * 100))
    
    def get_detection_status(self):
        """Devuelve el estado de la detección"""
        if self.confidence_score is None:
            return "No procesado"
        elif self.confidence_score >= 0.8:
            return "Excelente"
        elif self.confidence_score >= 0.6:
            return "Buena"
        elif self.confidence_score >= 0.4:
            return "Regular"
        else:
            return "Pobre"


class ProcessingStats(models.Model):
    """Estadísticas de uso del sistema"""
    
    date = models.DateField(auto_now_add=True, unique=True)
    total_processed = models.PositiveIntegerField(default=0)
    successful_detections = models.PositiveIntegerField(default=0)
    failed_detections = models.PositiveIntegerField(default=0)
    average_confidence = models.FloatField(default=0.0)
    average_processing_time = models.FloatField(default=0.0)
    
    class Meta:
        ordering = ['-date']
        verbose_name = "Estadística de Procesamiento"
        verbose_name_plural = "Estadísticas de Procesamiento"
    
    def __str__(self):
        return f"Estadísticas {self.date}"
    
    @property
    def success_rate(self):
        """Calcula la tasa de éxito del día"""
        if self.total_processed == 0:
            return 0
        return (self.successful_detections / self.total_processed) * 100
