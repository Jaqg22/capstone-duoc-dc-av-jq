from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
import base64
import io
from PIL import Image
import logging
from .google_mlkit_service import GoogleMLKitService
from .models import DocumentProcessing, ProcessingStats
from .serializers import DocumentProcessingSerializer
from datetime import date

logger = logging.getLogger(__name__)

# Instancia global del servicio OpenCV (usando GoogleMLKitService por compatibilidad)
detection_service = GoogleMLKitService()

@csrf_exempt
@api_view(['POST'])
def detect_document(request):
    """
    Endpoint para detectar documento en imagen
    Acepta imagen en base64 o archivo multipart
    """
    try:
        # Debug logging
        logger.info(f"Request data keys: {request.data.keys()}")
        logger.info(f"Request FILES keys: {request.FILES.keys()}")
        
        # Detectar fuente de la imagen
        source = request.data.get('source', 'camera')
        logger.info(f"Fuente de imagen detectada: {source}")
        
        # Obtener imagen del request
        image_file = None
        
        if 'image' in request.FILES:
            # Imagen como archivo multipart
            image_file = request.FILES['image']
            logger.info("Procesando imagen como archivo multipart")
        elif 'image' in request.data:
            # Imagen como base64
            image_data = request.data['image']
            logger.info(f"Imagen base64 recibida, tipo: {type(image_data)}")
            
            if isinstance(image_data, str):
                if image_data.startswith('data:image'):
                    # Decodificar base64
                    image_file = decode_base64_image(image_data)
                    logger.info("Decodificando imagen base64 con prefijo")
                else:
                    # Intentar decodificar como base64 puro
                    try:
                        image_file = decode_base64_image(image_data)
                        logger.info("Decodificando imagen base64 sin prefijo")
                    except Exception as e:
                        logger.error(f"Error decodificando base64: {str(e)}")
                        return Response({
                            'success': False,
                            'error': 'Formato de imagen base64 inválido'
                        }, status=status.HTTP_400_BAD_REQUEST)
            else:
                return Response({
                    'success': False,
                    'error': 'Formato de imagen base64 inválido'
                }, status=status.HTTP_400_BAD_REQUEST)
        else:
            logger.error("No se encontró 'image' en request.data ni request.FILES")
            return Response({
                'success': False,
                'error': 'No se proporcionó imagen'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if not image_file:
            return Response({
                'success': False,
                'error': 'Error al procesar imagen'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Procesar imagen con OpenCV
        logger.info("🤖 Llamando a detection_service.process_document...")
        result = detection_service.process_document(image_file)
        logger.info(f"📊 Resultado de OpenCV: {result.get('success', False)}")
        
        if result['success']:
            # Agregar imágenes en base64 para mostrar en frontend
            try:
                # Convertir imagen original a base64
                image_file.seek(0)  # Resetear posición del archivo
                original_base64 = image_file_to_base64(image_file)
                result['original_image'] = original_base64
                
                # Generar imagen recortada como imagen principal
                image_file.seek(0)  # Resetear otra vez
                logger.info("Generando imagen recortada con corners: {}".format(result['corners']))
                cropped_bytes = detection_service.crop_document(image_file, result['corners'])
                if cropped_bytes:
                    result['processed_image'] = bytes_to_base64(cropped_bytes)
                    logger.info("Imagen recortada generada exitosamente")
                else:
                    logger.error("No se pudo generar imagen recortada")
                    result['processed_image'] = None
                
                # También generar imagen con contorno para depuración (opcional)
                if request.data.get('show_detection', False):
                    image_file.seek(0)
                    detection_debug_base64 = generate_processed_image_with_detection(
                        image_file, 
                        result['corners']
                    )
                    if detection_debug_base64:
                        result['detection_debug'] = detection_debug_base64
                
            except Exception as e:
                logger.error(f"Error generando imágenes base64: {str(e)}")
                # Continuar sin las imágenes si hay error
                
            # Crear registro en base de datos
            try:
                # Guardar imagen original
                saved_file = default_storage.save(
                    f"original_images/{image_file.name or 'uploaded_image.jpg'}", 
                    image_file
                )
                
                # Crear registro de procesamiento
                processing = DocumentProcessing.objects.create(
                    original_image=saved_file,
                    detected_rectangle=result['corners'],
                    confidence_score=result['confidence'],
                    processing_time=result.get('processing_time', 0),
                    algorithm_used=result.get('algorithm_used', 'OpenCV Multi-Algorithm'),
                    file_size=len(image_file.read()) if hasattr(image_file, 'read') else 0,
                    image_dimensions=result['original_size'],
                    user_ip=get_client_ip(request)
                )
                
                # Actualizar estadísticas diarias
                update_daily_stats(result['confidence'], result.get('processing_time', 0))
                
                # Preparar respuesta con ID del procesamiento
                result['processing_id'] = str(processing.id)
                
            except Exception as e:
                logger.error(f"Error guardando en base de datos: {str(e)}")
                # Continuar sin guardar en DB si hay error
                result['warning'] = 'Detección exitosa pero no se pudo guardar en base de datos'
        
        logger.info("Enviando respuesta al frontend: success={}, processed_image={}".format(
            result.get('success'), 'SI' if result.get('processed_image') else 'NO'))
        if result.get('processed_image'):
            logger.info("Tamaño imagen procesada: {} caracteres".format(len(result['processed_image'])))
        
        return Response(result, status=status.HTTP_200_OK if result['success'] else status.HTTP_400_BAD_REQUEST)
        
    except Exception as e:
        logger.error(f"Error en detect_document: {str(e)}")
        return Response({
            'success': False,
            'error': f'Error interno del servidor: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
def crop_document(request):
    """
    Endpoint para recortar documento usando coordenadas
    """
    try:
        # Validar datos requeridos
        if 'image' not in request.data or 'rectangle' not in request.data:
            return Response({
                'success': False,
                'error': 'Se requieren los campos "image" y "rectangle"'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Obtener imagen
        image_data = request.data['image']
        if isinstance(image_data, str) and image_data.startswith('data:image'):
            image_file = decode_base64_image(image_data)
        else:
            return Response({
                'success': False,
                'error': 'Formato de imagen inválido'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if not image_file:
            return Response({
                'success': False,
                'error': 'Error al decodificar imagen'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Obtener coordenadas del rectángulo
        rectangle = request.data['rectangle']
        
        # Recortar documento
        cropped_bytes = detection_service.crop_document(image_file, rectangle)
        
        if cropped_bytes is None:
            return Response({
                'success': False,
                'error': 'Error al recortar documento'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Convertir a base64 para respuesta
        cropped_base64 = base64.b64encode(cropped_bytes).decode('utf-8')
        
        # Actualizar registro si se proporcionó processing_id
        processing_id = request.data.get('processing_id')
        if processing_id:
            try:
                processing = DocumentProcessing.objects.get(id=processing_id)
                
                # Guardar imagen procesada
                cropped_file = ContentFile(cropped_bytes, name=f'processed_{processing_id}.jpg')
                processing.processed_image.save(f'processed_{processing_id}.jpg', cropped_file)
                processing.save()
                
            except DocumentProcessing.DoesNotExist:
                logger.warning(f"Processing ID {processing_id} no encontrado")
            except Exception as e:
                logger.error(f"Error actualizando procesamiento: {str(e)}")
        
        return Response({
            'success': True,
            'cropped_image': f'data:image/jpeg;base64,{cropped_base64}',
            'message': 'Documento recortado exitosamente'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error en crop_document: {str(e)}")
        return Response({
            'success': False,
            'error': f'Error interno: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
def health_check(request):
    """
    Health check del servicio con estadísticas
    """
    try:
        # Obtener estadísticas del servicio
        service_stats = detection_service.get_service_stats()
        
        # Obtener estadísticas de la base de datos
        total_documents = DocumentProcessing.objects.count()
        recent_documents = DocumentProcessing.objects.filter(
            created_at__date=date.today()
        ).count()
        
        return Response({
            'status': 'healthy',
            'service': 'RindeBus Django + ML Kit Backend',
            'version': '3.0.0',
            'mlkit_available': True,
            'database_connected': True,
            'statistics': {
                'total_documents_processed': total_documents,
                'documents_today': recent_documents,
                'service_stats': service_stats
            },
            'endpoints': {
                'detect_document': 'POST /api/detect-document/',
                'crop_document': 'POST /api/crop-document/',
                'health': 'GET /api/health/',
                'admin': 'GET /admin/'
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'status': 'unhealthy',
            'error': str(e)
        }, status=status.HTTP_503_SERVICE_UNAVAILABLE)

@api_view(['GET'])
def processing_history(request):
    """
    Obtener historial de procesamientos
    """
    try:
        limit = int(request.GET.get('limit', 20))
        offset = int(request.GET.get('offset', 0))
        
        processings = DocumentProcessing.objects.all()[offset:offset+limit]
        serializer = DocumentProcessingSerializer(processings, many=True)
        
        return Response({
            'success': True,
            'count': DocumentProcessing.objects.count(),
            'results': serializer.data
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error en processing_history: {str(e)}")
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
def statistics(request):
    """
    Obtener estadísticas generales del sistema
    """
    try:
        # Estadísticas generales
        total_processed = DocumentProcessing.objects.count()
        successful = DocumentProcessing.objects.filter(confidence_score__gte=0.6).count()
        
        # Estadísticas diarias recientes
        daily_stats = ProcessingStats.objects.all()[:7]
        
        return Response({
            'success': True,
            'overall_stats': {
                'total_processed': total_processed,
                'successful_detections': successful,
                'success_rate': (successful / total_processed * 100) if total_processed > 0 else 0
            },
            'daily_stats': [
                {
                    'date': stat.date,
                    'total_processed': stat.total_processed,
                    'success_rate': stat.success_rate
                } for stat in daily_stats
            ]
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error en statistics: {str(e)}")
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# Funciones auxiliares

def decode_base64_image(base64_string):
    """
    Decodifica imagen base64 a archivo Django
    """
    try:
        # Remover prefijo si existe
        if ',' in base64_string:
            base64_string = base64_string.split(',')[1]
        
        # Decodificar
        image_data = base64.b64decode(base64_string)
        
        # Crear archivo en memoria
        image_file = io.BytesIO(image_data)
        image_file.name = 'uploaded_image.jpg'
        image_file.seek(0)
        
        return image_file
        
    except Exception as e:
        logger.error(f"Error decodificando base64: {str(e)}")
        return None

def get_client_ip(request):
    """
    Obtiene la IP del cliente
    """
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip

def update_daily_stats(confidence, processing_time):
    """
    Actualiza estadísticas diarias
    """
    try:
        today = date.today()
        stats, created = ProcessingStats.objects.get_or_create(
            date=today,
            defaults={
                'total_processed': 0,
                'successful_detections': 0,
                'failed_detections': 0,
                'average_confidence': 0.0,
                'average_processing_time': 0.0
            }
        )
        
        # Actualizar contadores
        stats.total_processed += 1
        
        if confidence >= 0.6:
            stats.successful_detections += 1
        else:
            stats.failed_detections += 1
        
        # Actualizar promedios
        total = stats.total_processed
        stats.average_confidence = ((stats.average_confidence * (total - 1)) + confidence) / total
        stats.average_processing_time = ((stats.average_processing_time * (total - 1)) + processing_time) / total
        
        stats.save()
        
    except Exception as e:
        logger.error(f"Error actualizando estadísticas diarias: {str(e)}")

def image_file_to_base64(image_file):
    """
    Convierte archivo de imagen Django a base64
    """
    try:
        import base64
        from io import BytesIO
        
        # Leer el contenido del archivo
        image_file.seek(0)
        image_data = image_file.read()
        
        # Convertir a base64
        base64_string = base64.b64encode(image_data).decode('utf-8')
        return base64_string
        
    except Exception as e:
        logger.error(f"Error convirtiendo imagen a base64: {str(e)}")
        return None

def bytes_to_base64(image_bytes):
    """
    Convierte bytes de imagen a base64
    """
    try:
        import base64
        base64_string = base64.b64encode(image_bytes).decode('utf-8')
        return base64_string
    except Exception as e:
        logger.error(f"Error convirtiendo bytes a base64: {str(e)}")
        return None

def generate_processed_image_with_detection(image_file, corners):
    """
    Genera imagen con el contorno de detección dibujado usando PIL
    """
    try:
        logger.info("Iniciando generacion de imagen procesada con corners: {}".format(corners))
        from PIL import Image, ImageDraw, ImageFont
        import base64
        from io import BytesIO
        
        # Convertir imagen de Django a PIL
        image_file.seek(0)
        pil_image = Image.open(image_file)
        
        # Convertir a RGB si es necesario
        if pil_image.mode != 'RGB':
            pil_image = pil_image.convert('RGB')
        
        # Crear copia para dibujar
        image_with_detection = pil_image.copy()
        draw = ImageDraw.Draw(image_with_detection)
        
        # Si tenemos esquinas válidas, dibujar el polígono
        if corners and len(corners) == 4:
            # Convertir esquinas a tuplas para PIL
            corner_points = [(int(corner[0]), int(corner[1])) for corner in corners]
            
            # Dibujar el contorno del documento detectado
            draw.polygon(corner_points, outline='green', width=5)
            
            # Calcular posición para el texto (esquina superior izquierda)
            min_x = min(corner[0] for corner in corners)
            min_y = min(corner[1] for corner in corners)
            
            # Agregar texto indicando documento detectado
            confidence_text = "Documento Detectado"
        else:
            # Si no hay esquinas, mostrar toda la imagen con mensaje
            width, height = pil_image.size
            draw.rectangle([0, 0, width, height], outline='orange', width=5)
            confidence_text = "Área Completa"
            min_x, min_y = 10, 10
        
        try:
            # Intentar usar fuente por defecto
            font = ImageFont.load_default()
        except Exception:
            font = None
        
        # Posición del texto
        text_x = min_x if 'min_x' in locals() else 10
        text_y = max(10, min_y - 25) if 'min_y' in locals() else 10
        text_position = (text_x, text_y)
        
        # Dibujar fondo para el texto
        if font:
            bbox = draw.textbbox(text_position, confidence_text, font=font)
            draw.rectangle([bbox[0]-2, bbox[1]-2, bbox[2]+2, bbox[3]+2], fill='green')
            draw.text(text_position, confidence_text, fill='white', font=font)
        else:
            # Fallback sin fuente específica
            draw.text(text_position, confidence_text, fill='green')
        
        # Convertir a base64
        buffer = BytesIO()
        image_with_detection.save(buffer, format='JPEG', quality=85)
        image_bytes = buffer.getvalue()
        
        base64_string = base64.b64encode(image_bytes).decode('utf-8')
        logger.info("Imagen procesada convertida a base64: {} caracteres".format(len(base64_string)))
        return base64_string
        
    except Exception as e:
        logger.error(f"Error generando imagen procesada: {str(e)}")
        return None


@csrf_exempt
def upload_planilla(request):
    """
    Vista simple para recibir imagen de planilla via POST
    """
    if request.method != 'POST':
        return JsonResponse({
            'error': 'Método no permitido. Use POST.'
        }, status=405)
    
    try:
        # Verificar que se envió un archivo
        if 'imagen' not in request.FILES:
            return JsonResponse({
                'error': 'No se encontró el archivo imagen'
            }, status=400)
        
        imagen = request.FILES['imagen']
        
        # Validar que es una imagen
        if not imagen.content_type.startswith('image/'):
            return JsonResponse({
                'error': 'El archivo debe ser una imagen'
            }, status=400)
        
        # Crear registro en la base de datos
        document = DocumentProcessing.objects.create(
            original_image=imagen,
            file_size=imagen.size,
            algorithm_used='Manual Upload',
            user_ip=get_client_ip(request)
        )
        
        logger.info(f"✅ Nueva planilla cargada: {document.id}")
        
        return JsonResponse({
            'success': True,
            'message': 'Imagen cargada exitosamente',
            'id': str(document.id),
            'created_at': document.created_at.isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error cargando planilla: {str(e)}")
        return JsonResponse({
            'error': f'Error al procesar la imagen: {str(e)}'
        }, status=500)
