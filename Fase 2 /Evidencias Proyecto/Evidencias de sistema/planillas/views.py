from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.utils.decorators import method_decorator
from django.views import View
from .models import Empleado, Cargo, Planilla, Bus, Ciudad
from decimal import Decimal, InvalidOperation
import json
from datetime import datetime

@require_http_methods(["GET"])
def buscar_empleado(request, empleado_id):
    """
    Busca un empleado por ID
    """
    cargo_filter = request.GET.get('cargo')  # 'conductor', 'asistente', etc.
    
    try:
        # Buscar empleado por ID
        empleado = Empleado.objects.select_related('cargo').get(
            empleado_id=empleado_id,
            activo=True
        )
        
        # Filtrar por cargo si se especifica
        if cargo_filter:
            cargo_lower = cargo_filter.lower()
            cargo_empleado = empleado.cargo.nombre_cargo.lower()
            
            # Validar que el cargo coincida
            if cargo_lower == 'conductor' and 'conductor' not in cargo_empleado:
                return JsonResponse({
                    'error': f'El empleado {empleado.nombre_completo} no es conductor (cargo: {empleado.cargo.nombre_cargo})'
                }, status=400)
            elif cargo_lower == 'asistente' and 'asistente' not in cargo_empleado:
                return JsonResponse({
                    'error': f'El empleado {empleado.nombre_completo} no es asistente (cargo: {empleado.cargo.nombre_cargo})'
                }, status=400)
        
        return JsonResponse({
            'success': True,
            'empleado': {
                'id': empleado.empleado_id,
                'nombre_completo': empleado.nombre_completo,
                'primer_nombre': empleado.primer_nombre,
                'primer_apellido': empleado.primer_apellido,
                'cargo': empleado.cargo.nombre_cargo,
                'telefono': empleado.telefono,
                'email': empleado.email
            }
        })
        
    except Empleado.DoesNotExist:
        return JsonResponse({
            'error': f'No se encontró un empleado activo con ID {empleado_id}'
        }, status=404)
    except Exception as e:
        return JsonResponse({
            'error': f'Error interno: {str(e)}'
        }, status=500)

@require_http_methods(["GET"])
def listar_empleados(request):
    """
    Lista empleados activos, filtrados por cargo
    """
    cargo_filter = request.GET.get('cargo')
    
    try:
        # Base query
        empleados_query = Empleado.objects.select_related('cargo').filter(activo=True)
        
        # Filtrar por cargo si se especifica
        if cargo_filter:
            cargo_lower = cargo_filter.lower()
            if cargo_lower in ['conductor', 'asistente']:
                empleados_query = empleados_query.filter(
                    cargo__nombre_cargo__icontains=cargo_lower
                )
        
        empleados = empleados_query.order_by('primer_apellido', 'primer_nombre')
        
        empleados_data = []
        for empleado in empleados:
            empleados_data.append({
                'id': empleado.empleado_id,
                'nombre_completo': empleado.nombre_completo,
                'cargo': empleado.cargo.nombre_cargo,
                'telefono': empleado.telefono,
                'email': empleado.email
            })
        
        return JsonResponse({
            'success': True,
            'empleados': empleados_data,
            'total': len(empleados_data),
            'cargo_filtrado': cargo_filter or 'todos'
        })
        
    except Exception as e:
        return JsonResponse({
            'error': f'Error interno: {str(e)}'
        }, status=500)


@require_http_methods(["GET"])
def validar_bus(request, bus_id):
    """
    Validar que un bus existe y está activo
    """
    try:
        bus = Bus.objects.get(bus_id=bus_id, activo=True)
        return JsonResponse({
            'success': True,
            'valido': True,
            'bus': {
                'id': bus.bus_id,
                'patente': bus.patente,
                'modelo': bus.modelo,
                'año': bus.año
            }
        })
    except Bus.DoesNotExist:
        return JsonResponse({
            'success': True,
            'valido': False,
            'mensaje': f'Bus {bus_id} no encontrado o inactivo'
        })
    except Exception as e:
        return JsonResponse({
            'error': f'Error interno: {str(e)}'
        }, status=500)


@require_http_methods(["GET"])
def validar_ciudad(request):
    """
    Validar que una ciudad existe por código o nombre
    """
    codigo = request.GET.get('codigo')
    nombre = request.GET.get('nombre')
    
    if not codigo and not nombre:
        return JsonResponse({
            'error': 'Debe proporcionar código o nombre de ciudad'
        }, status=400)
    
    try:
        ciudad = None
        
        # Buscar por código primero
        if codigo:
            try:
                ciudad = Ciudad.objects.get(ciudad_id=codigo, activo=True)
            except Ciudad.DoesNotExist:
                pass
        
        # Si no se encontró por código, buscar por nombre
        if not ciudad and nombre:
            try:
                ciudad = Ciudad.objects.get(nombre_ciudad__iexact=nombre, activo=True)
            except Ciudad.DoesNotExist:
                pass
        
        if ciudad:
            return JsonResponse({
                'success': True,
                'valido': True,
                'ciudad': {
                    'codigo': ciudad.ciudad_id,
                    'nombre': ciudad.nombre_ciudad,
                    'region': ciudad.region
                }
            })
        else:
            criterio = f"código '{codigo}'" if codigo else f"nombre '{nombre}'"
            return JsonResponse({
                'success': True,
                'valido': False,
                'mensaje': f'Ciudad no encontrada por {criterio}'
            })
            
    except Exception as e:
        return JsonResponse({
            'error': f'Error interno: {str(e)}'
        }, status=500)


@require_http_methods(["GET"])
def listar_ciudades(request):
    """
    Listar todas las ciudades activas
    """
    try:
        ciudades = Ciudad.objects.filter(activo=True).order_by('nombre_ciudad')
        
        ciudades_data = []
        for ciudad in ciudades:
            ciudades_data.append({
                'codigo': ciudad.ciudad_id,
                'nombre': ciudad.nombre_ciudad,
                'region': ciudad.region
            })
        
        return JsonResponse({
            'success': True,
            'ciudades': ciudades_data,
            'total': len(ciudades_data)
        })
        
    except Exception as e:
        return JsonResponse({
            'error': f'Error interno: {str(e)}'
        }, status=500)


@require_http_methods(["GET"])
def listar_buses(request):
    """
    Listar todos los buses activos
    """
    try:
        buses = Bus.objects.filter(activo=True).order_by('bus_id')
        
        buses_data = []
        for bus in buses:
            buses_data.append({
                'id': bus.bus_id,
                'patente': bus.patente,
                'modelo': bus.modelo,
                'año': bus.año
            })
        
        return JsonResponse({
            'success': True,
            'buses': buses_data,
            'total': len(buses_data)
        })
        
    except Exception as e:
        return JsonResponse({
            'error': f'Error interno: {str(e)}'
        }, status=500)


class PlanillaView(View):
    """
    Vista para manejar operaciones CRUD de planillas
    """
    
    def post(self, request):
        """
        Crear nueva planilla
        """
        print(f"🚀 Recibida petición POST para crear planilla")
        print(f"📋 Headers: {dict(request.headers)}")
        print(f"📄 Content-Type: {request.content_type}")
        print(f"📝 Body raw: {request.body[:500]}...")  # Primeros 500 caracteres
        
        try:
            # Parsear datos JSON
            data = json.loads(request.body)
            print(f"✅ JSON parseado exitosamente: {data}")
            
            # Validar datos requeridos
            required_fields = [
                'id_planilla', 'fecha', 'horario_origen', 'bus_id',
                'cod_conductor', 'cod_origen'
            ]
            
            missing_fields = [field for field in required_fields if not data.get(field)]
            if missing_fields:
                error_msg = f'Campos requeridos faltantes: {", ".join(missing_fields)}'
                print(f"❌ Campos faltantes: {error_msg}")
                return JsonResponse({
                    'success': False,
                    'error': error_msg
                }, status=400)
            
            # Validar que la planilla no exista
            if Planilla.objects.filter(id_planilla=data['id_planilla']).exists():
                error_msg = f'Ya existe una planilla con el número {data["id_planilla"]}'
                print(f"❌ Planilla duplicada: {error_msg}")
                return JsonResponse({
                    'success': False,
                    'error': error_msg
                }, status=400)
            
            # Validar referencias foráneas
            try:
                bus = Bus.objects.get(bus_id=data['bus_id'], activo=True)
            except Bus.DoesNotExist:
                return JsonResponse({
                    'error': f'Bus {data["bus_id"]} no encontrado o inactivo'
                }, status=400)
            
            try:
                conductor = Empleado.objects.get(
                    empleado_id=data['cod_conductor'], 
                    activo=True,
                    cargo__nombre_cargo__icontains='conductor'
                )
            except Empleado.DoesNotExist:
                return JsonResponse({
                    'error': f'Conductor {data["cod_conductor"]} no encontrado o no es conductor activo'
                }, status=400)
            
            # Validar asistente si se proporciona
            asistente = None
            if data.get('cod_asistente'):
                try:
                    asistente = Empleado.objects.get(
                        empleado_id=data['cod_asistente'], 
                        activo=True,
                        cargo__nombre_cargo__icontains='asistente'
                    )
                    
                    # Validar que conductor y asistente sean diferentes
                    if conductor.empleado_id == asistente.empleado_id:
                        return JsonResponse({
                            'error': 'El conductor y asistente no pueden ser la misma persona'
                        }, status=400)
                        
                except Empleado.DoesNotExist:
                    return JsonResponse({
                        'error': f'Asistente {data["cod_asistente"]} no encontrado o no es asistente activo'
                    }, status=400)
            
            # Validar ciudades
            try:
                ciudad_origen = Ciudad.objects.get(ciudad_id=data['cod_origen'], activo=True)
            except Ciudad.DoesNotExist:
                return JsonResponse({
                    'error': f'Ciudad de origen {data["cod_origen"]} no encontrada'
                }, status=400)
            
            ciudad_retorno = None
            if data.get('cod_retorno'):
                try:
                    ciudad_retorno = Ciudad.objects.get(ciudad_id=data['cod_retorno'], activo=True)
                except Ciudad.DoesNotExist:
                    return JsonResponse({
                        'error': f'Ciudad de retorno {data["cod_retorno"]} no encontrada'
                    }, status=400)
            
            # Validar fecha
            try:
                fecha_planilla = datetime.strptime(data['fecha'], '%Y-%m-%d').date()
                if fecha_planilla > datetime.now().date():
                    return JsonResponse({
                        'error': 'La fecha no puede ser futura'
                    }, status=400)
            except ValueError:
                return JsonResponse({
                    'error': 'Formato de fecha inválido (use YYYY-MM-DD)'
                }, status=400)
            
            # Validar horarios
            try:
                horario_origen = datetime.strptime(data['horario_origen'], '%H:%M').time()
                horario_retorno = None
                if data.get('horario_retorno'):
                    horario_retorno = datetime.strptime(data['horario_retorno'], '%H:%M').time()
            except ValueError:
                return JsonResponse({
                    'error': 'Formato de horario inválido (use HH:MM)'
                }, status=400)
            
            # Convertir montos a Decimal de manera segura
            def safe_decimal(value, field_name):
                if value is None or value == '':
                    return Decimal('0.00')
                try:
                    return Decimal(str(value)).quantize(Decimal('0.01'))
                except (InvalidOperation, ValueError):
                    raise ValueError(f'Valor inválido para {field_name}: {value}')
            
            try:
                ingreso_ruta = safe_decimal(data.get('ingreso_ruta'), 'ingreso_ruta')
                ingreso_oficina = safe_decimal(data.get('ingreso_oficina'), 'ingreso_oficina')
                viaticos = safe_decimal(data.get('viaticos'), 'viaticos')
                losa = safe_decimal(data.get('losa'), 'losa')
                pension = safe_decimal(data.get('pension'), 'pension')
                cena = safe_decimal(data.get('cena'), 'cena')
                otros_gastos = safe_decimal(data.get('otros_gastos'), 'otros_gastos')
            except ValueError as e:
                return JsonResponse({
                    'error': str(e)
                }, status=400)
            
            # Crear planilla
            planilla = Planilla.objects.create(
                id_planilla=data['id_planilla'],
                fecha=fecha_planilla,
                horario_origen=horario_origen,
                horario_retorno=horario_retorno,
                ingreso_ruta=ingreso_ruta,
                ingreso_oficina=ingreso_oficina,
                viaticos=viaticos,
                losa=losa,
                pension=pension,
                cena=cena,
                otros_gastos=otros_gastos,
                bus=bus,
                cod_origen=ciudad_origen,
                cod_retorno=ciudad_retorno,
                cod_conductor=conductor,
                cod_asistente=asistente
            )
            
            return JsonResponse({
                'success': True,
                'message': 'Planilla creada exitosamente',
                'planilla': {
                    'id_planilla': planilla.id_planilla,
                    'fecha': planilla.fecha.strftime('%Y-%m-%d'),
                    'conductor': planilla.cod_conductor.nombre_completo,
                    'asistente': planilla.cod_asistente.nombre_completo if planilla.cod_asistente else None,
                    'bus': planilla.bus.bus_id,
                    'total_produccion': float(planilla.total_produccion),
                    'total_egresos': float(planilla.total_egresos),
                    'ganancia_neta': float(planilla.ganancia_neta)
                }
            })
            
        except json.JSONDecodeError:
            return JsonResponse({
                'error': 'Datos JSON inválidos'
            }, status=400)
        except Exception as e:
            return JsonResponse({
                'error': f'Error interno del servidor: {str(e)}'
            }, status=500)
    
    def get(self, request):
        """
        Listar planillas con filtros opcionales
        """
        try:
            # Filtros opcionales
            fecha_desde = request.GET.get('fecha_desde')
            fecha_hasta = request.GET.get('fecha_hasta')
            conductor_id = request.GET.get('conductor_id')
            bus_id = request.GET.get('bus_id')
            
            # Query base
            planillas = Planilla.objects.select_related(
                'bus', 'cod_conductor', 'cod_asistente', 'cod_origen', 'cod_retorno'
            ).all()
            
            # Aplicar filtros
            if fecha_desde:
                try:
                    fecha_desde_obj = datetime.strptime(fecha_desde, '%Y-%m-%d').date()
                    planillas = planillas.filter(fecha__gte=fecha_desde_obj)
                except ValueError:
                    return JsonResponse({
                        'error': 'Formato de fecha_desde inválido (use YYYY-MM-DD)'
                    }, status=400)
            
            if fecha_hasta:
                try:
                    fecha_hasta_obj = datetime.strptime(fecha_hasta, '%Y-%m-%d').date()
                    planillas = planillas.filter(fecha__lte=fecha_hasta_obj)
                except ValueError:
                    return JsonResponse({
                        'error': 'Formato de fecha_hasta inválido (use YYYY-MM-DD)'
                    }, status=400)
            
            if conductor_id:
                planillas = planillas.filter(cod_conductor__empleado_id=conductor_id)
            
            if bus_id:
                planillas = planillas.filter(bus__bus_id=bus_id)
            
            # Ordenar por fecha descendente
            planillas = planillas.order_by('-fecha', '-fecha_creacion')
            
            # Serializar datos
            planillas_data = []
            for p in planillas:
                planillas_data.append({
                    'id_planilla': p.id_planilla,
                    'fecha': p.fecha.strftime('%Y-%m-%d'),
                    'horario_origen': p.horario_origen.strftime('%H:%M'),
                    'horario_retorno': p.horario_retorno.strftime('%H:%M') if p.horario_retorno else None,
                    'conductor': {
                        'id': p.cod_conductor.empleado_id,
                        'nombre': p.cod_conductor.nombre_completo
                    },
                    'asistente': {
                        'id': p.cod_asistente.empleado_id,
                        'nombre': p.cod_asistente.nombre_completo
                    } if p.cod_asistente else None,
                    'bus': {
                        'id': p.bus.bus_id,
                        'patente': p.bus.patente
                    },
                    'origen': p.cod_origen.nombre_ciudad,
                    'retorno': p.cod_retorno.nombre_ciudad if p.cod_retorno else None,
                    'total_produccion': float(p.total_produccion),
                    'total_egresos': float(p.total_egresos),
                    'ganancia_neta': float(p.ganancia_neta),
                    'fecha_creacion': p.fecha_creacion.isoformat()
                })
            
            return JsonResponse({
                'success': True,
                'planillas': planillas_data,
                'total': len(planillas_data)
            })
            
        except Exception as e:
            return JsonResponse({
                'error': f'Error interno del servidor: {str(e)}'
            }, status=500)
