from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.conf import settings
import os
import logging
from .models import Planilla, Tarifa, Ingreso, Egreso, ControlBoleto
from .serializers import (
    PlanillaListSerializer, PlanillaDetailSerializer, PlanillaCreateSerializer,
    PlanillaUpdateSerializer, TarifaSerializer, IngresoSerializer,
    EgresoSerializer, ControlBoletoSerializer
)
from .services import azure_service

logger = logging.getLogger(__name__)

# Constantes
AZURE_NOT_CONFIGURED_ERROR = 'Azure Form Recognizer no está configurado'


def aplicar_datos_extraidos_a_planilla(planilla, extracted_data):
    """
    Aplica los datos extraídos a una instancia de planilla.
    Incluye validación y corrección de datos.
    """
    # Campos que se pueden mapear directamente
    campos_directos = [
        'codigo_origen', 'codigo_retorno', 'numero_bus',
        'horario_origen', 'horario_retorno', 'numero_planilla',
        'fecha', 'codigo_conductor', 'codigo_asistente',
        'tarifa_1','tarifa_2','tarifa_3','tarifa_4','tarifa_5','tarifa_6',
        'b_inicial_1','b_inicial_2','b_inicial_3','b_inicial_4','b_inicial_5','b_inicial_6',
        'b_final_1','b_final_2','b_final_3','b_final_4','b_final_5','b_final_6',
        'total_ingreso_ruta','total_ingreso_oficina','total_ingresos',
        'losa','pension','cena','viaticos','otros','total_egresos'
    ]
    
    # Aplicar datos extraídos
    campos_actualizados = []
    for field in campos_directos:
        if extracted_data.get(field) is not None:
            setattr(planilla, field, extracted_data.get(field))
            campos_actualizados.append(field)
    
    # Guardar datos extraídos completos
    planilla.datos_extraidos = extracted_data
    
    logger.info(f"Planilla {planilla.id}: Aplicados {len(campos_actualizados)} campos: {campos_actualizados}")
    
    return campos_actualizados


class PlanillaViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar planillas de recaudación.
    Permite crear, listar, obtener detalles y actualizar planillas.
    """
    
    queryset = Planilla.objects.all()
    parser_classes = [MultiPartParser, FormParser]
    
    def get_serializer_class(self):
        """Retornar el serializer apropiado según la acción"""
        if self.action == 'list':
            return PlanillaListSerializer
        elif self.action == 'create':
            return PlanillaCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return PlanillaUpdateSerializer
        return PlanillaDetailSerializer
    
    def create(self, request, *args, **kwargs):
        """
        Crear una nueva planilla y procesar la imagen inmediatamente.
        Extrae los datos de los recuadros de colores usando Azure Form Recognizer.
        """
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            planilla = serializer.save()
            
            # Si Azure no está configurado, no intentar procesar ahora
            if not azure_service.is_configured():
                # Dejar la planilla en estado 'pending' para procesamiento manual/posterior
                planilla.status = 'pending'
                planilla.save()
                return Response(
                    {
                        'id': planilla.id,
                        'message': f'Planilla creada. {AZURE_NOT_CONFIGURED_ERROR}, procesamiento diferido.',
                        'status': planilla.status,
                        'imagen': planilla.imagen.url if planilla.imagen else None
                    },
                    status=status.HTTP_201_CREATED
                )

            try:
                # Procesar la imagen inmediatamente con correcciones
                logger.info(f"Procesando planilla {planilla.id} con Azure Form Recognizer (con correcciones)")
                image_path = planilla.imagen.path
                extracted_data = azure_service.analyze_document(image_path)

                # Aplicar datos extraídos con validación y corrección
                campos_actualizados = aplicar_datos_extraidos_a_planilla(planilla, extracted_data)

                planilla.status = 'completed'
                planilla.save()
                
                logger.info(f"Planilla {planilla.id} procesada exitosamente con {len(campos_actualizados)} campos extraídos")

                return Response(
                    PlanillaDetailSerializer(planilla).data,
                    status=status.HTTP_201_CREATED
                )

            except Exception as e:
                planilla.status = 'error'
                planilla.error_procesamiento = str(e)
                planilla.save()
                return Response(
                    {'error': f'Error procesando la imagen: {str(e)}'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
                
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def procesar_con_azure(self, request, pk=None):  # pylint: disable=unused-argument
        """
        Endpoint para procesar una planilla con Azure Form Recognizer.
        
        Usa el modelo entrenado personalizado configurado en settings.
        Extrae datos y los mapea a los modelos Django.
        """
        planilla = self.get_object()
        
        if planilla.status != 'pending':
            return Response(
                {'error': 'La planilla ya ha sido procesada'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verificar si Azure está configurado
        if not azure_service.is_configured():
            return Response(
                {'error': 'Azure Form Recognizer no está configurado'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )
        
        try:
            # Marcar como procesando
            planilla.status = 'processing'
            planilla.save()
            
            # Obtener ruta completa de la imagen
            image_path = os.path.join(settings.MEDIA_ROOT, planilla.imagen.name)
            
            # Procesar con Azure Form Recognizer con correcciones
            logger.info(f"Procesando planilla {planilla.id} con Azure Form Recognizer (con correcciones)")
            datos_extraidos = azure_service.analyze_document(image_path)
            
            # Aplicar datos extraídos con validación y corrección
            campos_actualizados = aplicar_datos_extraidos_a_planilla(planilla, datos_extraidos)
            
            planilla.status = 'completed'
            planilla.save()
            
            logger.info(f"Planilla {planilla.id} procesada exitosamente con {len(campos_actualizados)} campos extraídos")
            
            return Response({
                'message': 'Planilla procesada exitosamente',
                'planilla_id': planilla.id,
                'status': planilla.status,
                'datos_extraidos': datos_extraidos
            })
            
        except Exception as e:
            # Marcar como error
            planilla.status = 'error'
            planilla.error_procesamiento = str(e)
            planilla.save()
            
            logger.error(f"Error procesando planilla {planilla.id}: {e}")
            
            return Response(
                {'error': f'Error procesando planilla: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['get'])
    def datos_extraidos(self, request, pk=None):
        """
        Obtener los datos extraídos de una planilla procesada.
        """
        planilla = self.get_object()
        
        if planilla.status != 'completed':
            return Response(
                {'error': 'La planilla aún no ha sido procesada'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        return Response({
            'planilla_id': planilla.id,
            'datos_extraidos': planilla.datos_extraidos,
            'fecha_procesamiento': planilla.fecha_actualizacion
        })
    
    @action(detail=False, methods=['get'])
    def test_azure_connection(self, request):
        """
        Endpoint para probar la conexión con Azure Form Recognizer.
        """
        result = azure_service.test_connection()
        
        if result['success']:
            return Response(result, status=status.HTTP_200_OK)
        else:
            return Response(result, status=status.HTTP_503_SERVICE_UNAVAILABLE)


class TarifaViewSet(viewsets.ModelViewSet):
    """ViewSet para gestionar tarifas"""
    
    queryset = Tarifa.objects.all()
    serializer_class = TarifaSerializer
    
    def get_queryset(self):
        """Filtrar tarifas por planilla si se especifica"""
        queryset = Tarifa.objects.all()
        planilla_id = self.request.query_params.get('planilla_id')
        if planilla_id:
            queryset = queryset.filter(planilla_id=planilla_id)
        return queryset


class IngresoViewSet(viewsets.ModelViewSet):
    """ViewSet para gestionar ingresos"""
    
    queryset = Ingreso.objects.all()
    serializer_class = IngresoSerializer
    
    def get_queryset(self):
        """Filtrar ingresos por planilla si se especifica"""
        queryset = Ingreso.objects.all()
        planilla_id = self.request.query_params.get('planilla_id')
        if planilla_id:
            queryset = queryset.filter(planilla_id=planilla_id)
        return queryset


class EgresoViewSet(viewsets.ModelViewSet):
    """ViewSet para gestionar egresos"""
    
    queryset = Egreso.objects.all()
    serializer_class = EgresoSerializer
    
    def get_queryset(self):
        """Filtrar egresos por planilla si se especifica"""
        queryset = Egreso.objects.all()
        planilla_id = self.request.query_params.get('planilla_id')
        if planilla_id:
            queryset = queryset.filter(planilla_id=planilla_id)
        return queryset


class ControlBoletoViewSet(viewsets.ModelViewSet):
    """ViewSet para gestionar controles de boletos"""
    
    queryset = ControlBoleto.objects.all()
    serializer_class = ControlBoletoSerializer
    
    def get_queryset(self):
        """Filtrar controles por planilla si se especifica"""
        queryset = ControlBoleto.objects.all()
        planilla_id = self.request.query_params.get('planilla_id')
        if planilla_id:
            queryset = queryset.filter(planilla_id=planilla_id)
        return queryset
