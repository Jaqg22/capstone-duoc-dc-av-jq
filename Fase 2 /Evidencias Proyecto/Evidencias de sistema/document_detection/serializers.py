from rest_framework import serializers
from .models import DocumentProcessing, ProcessingStats

class DocumentProcessingSerializer(serializers.ModelSerializer):
    """
    Serializer para el modelo DocumentProcessing
    """
    
    success_rate = serializers.ReadOnlyField()
    detection_status = serializers.CharField(source='get_detection_status', read_only=True)
    
    class Meta:
        model = DocumentProcessing
        fields = [
            'id',
            'original_image',
            'detected_rectangle', 
            'confidence_score',
            'processed_image',
            'processing_time',
            'algorithm_used',
            'created_at',
            'updated_at',
            'file_size',
            'image_dimensions',
            'user_ip',
            'success_rate',
            'detection_status'
        ]
        read_only_fields = [
            'id',
            'created_at',
            'updated_at',
            'success_rate',
            'detection_status'
        ]

class ProcessingStatsSerializer(serializers.ModelSerializer):
    """
    Serializer para estadísticas de procesamiento
    """
    
    success_rate = serializers.ReadOnlyField()
    
    class Meta:
        model = ProcessingStats
        fields = [
            'date',
            'total_processed',
            'successful_detections',
            'failed_detections',
            'average_confidence',
            'average_processing_time',
            'success_rate'
        ]
        read_only_fields = ['success_rate']

class ImageUploadSerializer(serializers.Serializer):
    """
    Serializer para subida de imágenes
    """
    
    image = serializers.ImageField(
        help_text="Imagen del documento a procesar"
    )
    
    def validate_image(self, value):
        """
        Validar el archivo de imagen
        """
        # Validar tamaño (máximo 10MB)
        max_size = 10 * 1024 * 1024  # 10MB
        if value.size > max_size:
            raise serializers.ValidationError(
                f"El archivo es demasiado grande. Máximo permitido: {max_size // (1024*1024)}MB"
            )
        
        # Validar tipo de archivo
        allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/bmp']
        if hasattr(value, 'content_type') and value.content_type not in allowed_types:
            raise serializers.ValidationError(
                f"Tipo de archivo no permitido. Tipos permitidos: {', '.join(allowed_types)}"
            )
        
        return value

class DocumentDetectionRequestSerializer(serializers.Serializer):
    """
    Serializer para requests de detección de documentos
    """
    
    image = serializers.CharField(
        help_text="Imagen en formato base64 o archivo",
        required=False
    )
    
    def validate(self, data):
        """
        Validar que se proporcione imagen de alguna forma
        """
        if 'image' not in data and not hasattr(self.context.get('request', {}), 'FILES'):
            raise serializers.ValidationError(
                "Se debe proporcionar una imagen en base64 o como archivo"
            )
        
        return data

class DocumentCropRequestSerializer(serializers.Serializer):
    """
    Serializer para requests de recorte de documentos
    """
    
    image = serializers.CharField(
        help_text="Imagen en formato base64"
    )
    
    rectangle = serializers.DictField(
        help_text="Coordenadas del rectángulo de recorte {x, y, width, height}"
    )
    
    processing_id = serializers.UUIDField(
        required=False,
        help_text="ID del procesamiento previo (opcional)"
    )
    
    def validate_rectangle(self, value):
        """
        Validar las coordenadas del rectángulo
        """
        required_fields = ['x', 'y', 'width', 'height']
        
        for field in required_fields:
            if field not in value:
                raise serializers.ValidationError(
                    f"Campo requerido en rectangle: {field}"
                )
            
            if not isinstance(value[field], (int, float)) or value[field] < 0:
                raise serializers.ValidationError(
                    f"El campo {field} debe ser un número positivo"
                )
        
        # Validar que width y height sean mayores que 0
        if value['width'] <= 0 or value['height'] <= 0:
            raise serializers.ValidationError(
                "width y height deben ser mayores que 0"
            )
        
        return value

class DocumentDetectionResponseSerializer(serializers.Serializer):
    """
    Serializer para respuestas de detección
    """
    
    success = serializers.BooleanField()
    rectangle = serializers.DictField(required=False)
    processing_time = serializers.FloatField(required=False)
    image_dimensions = serializers.DictField(required=False)
    algorithm_used = serializers.CharField(required=False)
    processing_id = serializers.UUIDField(required=False)
    message = serializers.CharField(required=False)
    error = serializers.CharField(required=False)

class DocumentCropResponseSerializer(serializers.Serializer):
    """
    Serializer para respuestas de recorte
    """
    
    success = serializers.BooleanField()
    cropped_image = serializers.CharField(required=False)
    message = serializers.CharField(required=False)
    error = serializers.CharField(required=False)

class HealthCheckResponseSerializer(serializers.Serializer):
    """
    Serializer para respuesta de health check
    """
    
    status = serializers.CharField()
    service = serializers.CharField()
    version = serializers.CharField()
    opencv_available = serializers.BooleanField()
    database_connected = serializers.BooleanField()
    statistics = serializers.DictField()
    endpoints = serializers.DictField()

class StatisticsResponseSerializer(serializers.Serializer):
    """
    Serializer para respuesta de estadísticas
    """
    
    success = serializers.BooleanField()
    overall_stats = serializers.DictField()
    daily_stats = serializers.ListField()
    error = serializers.CharField(required=False)