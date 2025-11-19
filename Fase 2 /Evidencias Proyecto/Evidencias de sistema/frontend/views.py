"""
Vistas para servir las páginas HTML del frontend de RindeBus
"""
from django.shortcuts import render, redirect
from django.http import HttpResponse, JsonResponse
from django.conf import settings
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required, permission_required
from django.views.decorators.csrf import csrf_exempt
from django.contrib import messages
from django.db.models import Sum, Count, Q
import json
import os
import requests
from urllib.parse import urljoin
from planillas.models import Planilla, Empleado, Bus, Ciudad

# Constantes para evitar duplicación de literales
FRONTEND_MAIN_URL = 'frontend:main'
METODO_NO_PERMITIDO = 'Método no permitido'
USER_AGENT_PROXY = 'RindeBus-Proxy/1.0'
RESPUESTA_INVALIDA_AZURE = 'Respuesta inválida de Azure'


def get_client_ip(request):
    """Obtener IP del cliente"""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


def inicio_view(request):
    """Vista para la página de inicio/login"""
    # Si el usuario ya está autenticado, redirigir al main
    if request.user.is_authenticated:
        return redirect(FRONTEND_MAIN_URL)
    
    if request.method == 'POST':
        # Intentar obtener datos del JSON o del formulario
        try:
            data = json.loads(request.body)
            username = data.get('usuario', '').strip()
            password = data.get('contrasena', '').strip()
        except json.JSONDecodeError:
            username = request.POST.get('usuario', '').strip()
            password = request.POST.get('contrasena', '').strip()
        
        # Validar que los campos no estén vacíos
        if not username or not password:
            if request.headers.get('Content-Type') == 'application/json':
                return JsonResponse({
                    'success': False,
                    'error': 'Por favor completa todos los campos'
                }, status=400)
            else:
                messages.error(request, 'Por favor completa todos los campos')
                return render(request, 'inicio.html')
        
        # Autenticar usuario
        user = authenticate(request, username=username, password=password)
        
        if user is not None:
            # Login exitoso
            login(request, user)
            
            if request.headers.get('Content-Type') == 'application/json':
                return JsonResponse({
                    'success': True,
                    'message': 'Inicio de sesión exitoso',
                    'redirect': '/main/'
                })
            else:
                messages.success(request, 'Inicio de sesión exitoso')
                return redirect(FRONTEND_MAIN_URL)
        else:
            # Credenciales incorrectas
            if request.headers.get('Content-Type') == 'application/json':
                return JsonResponse({
                    'success': False,
                    'error': 'Usuario o contraseña incorrectos'
                }, status=401)
            else:
                messages.error(request, 'Usuario o contraseña incorrectos')
                return render(request, 'inicio.html')
    
    return render(request, 'inicio.html')


@login_required(login_url='/')
def main_view(request):
    """Vista para la página principal/dashboard"""
    return render(request, 'main.html', {
        'user': request.user,
        'user_permissions': {
            'can_create_planilla': request.user.has_perm('planillas.add_planilla'),
            'can_view_all_planillas': request.user.has_perm('planillas.can_view_all_planillas'),
            'can_approve_planilla': request.user.has_perm('planillas.can_approve_planilla'),
            'can_edit_planilla': request.user.has_perm('planillas.change_planilla'),
            'can_delete_planilla': request.user.has_perm('planillas.delete_planilla'),
        }
    })


@login_required(login_url='/')
@permission_required('planillas.add_planilla', login_url='/')
def manual_view(request):
    """Vista para la página de planilla manual - REQUIERE PERMISOS DE CREACIÓN"""
    # Verificar si el usuario tiene permisos para crear planillas
    if not request.user.has_perm('planillas.add_planilla'):
        messages.error(request, 'No tienes permisos para crear planillas. Contacta al administrador.')
        return redirect(FRONTEND_MAIN_URL)
    
    return render(request, 'manual.html', {
        'user': request.user,
        'user_permissions': {
            'can_create_planilla': request.user.has_perm('planillas.add_planilla'),
            'can_view_all_planillas': request.user.has_perm('planillas.can_view_all_planillas'),
            'can_approve_planilla': request.user.has_perm('planillas.can_approve_planilla'),
        }
    })


@login_required(login_url='/')
@permission_required('planillas.add_planilla', login_url='/')
def cargar_imagen_view(request):
    """
    Vista para la página de carga de imagen - REQUIERE PERMISOS DE CREACIÓN
    """
    print(f"📷 Acceso a cargar_imagen_view desde IP: {get_client_ip(request)}")
    
    # Verificar si el usuario tiene permisos para crear planillas
    if not request.user.has_perm('planillas.add_planilla'):
        messages.error(request, 'No tienes permisos para escanear documentos. Contacta al administrador.')
        return redirect(FRONTEND_MAIN_URL)
    
    return render(request, 'cargar_imagen.html', {
        'user': request.user,
        'user_permissions': {
            'can_create_planilla': request.user.has_perm('planillas.add_planilla'),
            'can_view_all_planillas': request.user.has_perm('planillas.can_view_all_planillas'),
            'can_approve_planilla': request.user.has_perm('planillas.can_approve_planilla'),
        }
    })


@login_required(login_url='/')
@permission_required('planillas.add_planilla', login_url='/')
def preview_view(request):
    """
    Vista para la página de vista previa de imagen antes de enviar a Azure - REQUIERE PERMISOS DE CREACIÓN
    """
    print(f"👁️ Acceso a preview_view desde IP: {get_client_ip(request)}")
    
    # Verificar si el usuario tiene permisos para crear planillas
    if not request.user.has_perm('planillas.add_planilla'):
        messages.error(request, 'No tienes permisos para escanear documentos. Contacta al administrador.')
        return redirect(FRONTEND_MAIN_URL)
    
    return render(request, 'preview.html', {
        'user': request.user,
        'user_permissions': {
            'can_create_planilla': request.user.has_perm('planillas.add_planilla'),
            'can_view_all_planillas': request.user.has_perm('planillas.can_view_all_planillas'),
            'can_approve_planilla': request.user.has_perm('planillas.can_approve_planilla'),
        }
    })


@login_required(login_url='/')
def consultas_view(request):
    """Vista para la página de consultas"""
    return render(request, 'consultas.html', {
        'user': request.user,
        'user_permissions': {
            'can_create_planilla': request.user.has_perm('planillas.add_planilla'),
            'can_view_all_planillas': request.user.has_perm('planillas.can_view_all_planillas'),
            'can_approve_planilla': request.user.has_perm('planillas.can_approve_planilla'),
            'can_edit_planilla': request.user.has_perm('planillas.change_planilla'),
            'can_delete_planilla': request.user.has_perm('planillas.delete_planilla'),
        }
    })


def logout_view(request):
    """Vista para cerrar sesión"""
    logout(request)
    messages.success(request, 'Has cerrado sesión correctamente')
    return redirect('/')  # Redirigir a la raíz en lugar de nombre de ruta


def health_check_view(request):
    """Vista simple para verificar que el servidor está funcionando"""
    return HttpResponse("✅ RindeBus Server está funcionando correctamente")


@csrf_exempt
@login_required(login_url='/')
@permission_required('planillas.add_planilla')
def get_datos_extraidos_azure(request, planilla_id):
    """
    Obtener datos extraídos de Azure usando el ID - REQUIERE PERMISOS DE CREACIÓN
    """
    print(f"🔍 Obteniendo datos extraídos para ID: {planilla_id}")
    
    # Verificar permisos
    if not request.user.has_perm('planillas.add_planilla'):
        return JsonResponse({
            'error': 'No tienes permisos para acceder a datos de escaneo',
            'redirect': '/main/'
        }, status=403)
    
    if request.method != 'GET':
        return JsonResponse({'error': METODO_NO_PERMITIDO}, status=405)
    
    try:
        # URL de tu API externa para obtener datos extraídos
        api_url = f'http://127.0.0.1:8001/api/planillas/{planilla_id}/datos_extraidos/'
        
        headers = {
            'User-Agent': 'RindeBus-Proxy/1.0',
            'Accept': 'application/json',
        }
        
        print(f"📡 Consultando datos extraídos: {api_url}")
        
        response = requests.get(api_url, headers=headers, timeout=30)
        
        print(f"📡 Azure datos respondió: {response.status_code}")
        
        if response.ok:
            try:
                response_data = response.json()
                print(f"✅ Datos extraídos obtenidos: {list(response_data.keys())}")
                return JsonResponse(response_data)
            except Exception as json_error:
                print(f"❌ Error parseando JSON datos extraídos: {json_error}")
                return JsonResponse({
                    'error': 'Respuesta inválida de Azure',
                    'details': response.text[:200]
                }, status=500)
        else:
            return JsonResponse({
                'error': f'Error obteniendo datos de Azure: {response.status_code}',
                'details': response.text[:200]
            }, status=response.status_code)
        
    except requests.exceptions.ConnectionError as e:
        print(f"❌ Error conexión obteniendo datos: {e}")
        return JsonResponse({
            'error': 'No se puede conectar con Azure para obtener datos'
        }, status=503)
    except Exception as e:
        print(f"❌ Error obteniendo datos extraídos: {e}")
        return JsonResponse({
            'error': f'Error: {str(e)}'
        }, status=500)


@csrf_exempt
def save_planilla_postgres(request):
    """
    Guardar planilla completa en PostgreSQL
    """
    print("💾 Guardando planilla en PostgreSQL")
    
    if request.method != 'POST':
        return JsonResponse({'error': 'Método no permitido'}, status=405)
    
    try:
        # Obtener datos del formulario
        if request.content_type == 'application/json':
            data = json.loads(request.body)
        else:
            data = dict(request.POST)
            # Convertir listas de un elemento a valores simples
            data = {k: v[0] if isinstance(v, list) and len(v) == 1 else v for k, v in data.items()}
        
        print(f"📋 Datos recibidos: {list(data.keys())}")
        
        # Validar campos obligatorios
        required_fields = ['nro_planilla', 'nro_bus', 'fecha', 'cod_conductor']
        missing_fields = [field for field in required_fields if not data.get(field)]
        
        if missing_fields:
            return JsonResponse({
                'error': f'Campos obligatorios faltantes: {", ".join(missing_fields)}'
            }, status=400)
        
        # Buscar objetos relacionados
        try:
            bus = Bus.objects.get(bus_id=data['nro_bus'])
            conductor = Empleado.objects.get(empleado_id=data['cod_conductor'])
            asistente = None
            if data.get('cod_asistente'):
                asistente = Empleado.objects.get(empleado_id=data['cod_asistente'])
            
            # Por ahora usar Santiago como ciudad por defecto
            ciudad_origen = Ciudad.objects.filter(nombre_ciudad__icontains='santiago').first()
            if not ciudad_origen:
                ciudad_origen = Ciudad.objects.first()
            
        except Bus.DoesNotExist:
            return JsonResponse({'error': f'Bus {data["nro_bus"]} no encontrado'}, status=400)
        except Empleado.DoesNotExist:
            return JsonResponse({'error': 'Empleado no encontrado'}, status=400)
        
        # Convertir valores numéricos
        def to_decimal(value, default=0):
            try:
                return float(value) if value else default
            except (ValueError, TypeError):
                return default
        
        # Crear planilla
        planilla = Planilla(
            id_planilla=data['nro_planilla'],
            fecha=data['fecha'],
            bus=bus,
            cod_conductor=conductor,
            cod_asistente=asistente,
            cod_origen=ciudad_origen,
            cod_retorno=ciudad_origen,
            
            # Horarios
            horario_origen=data.get('h_origen'),
            horario_retorno=data.get('h_retorno'),
            
            # Ingresos
            ingreso_ruta=to_decimal(data.get('ing_total_ruta')),
            ingreso_oficina=to_decimal(data.get('ing_total_oficina')),
            total_produccion=to_decimal(data.get('ing_total_ruta')) + to_decimal(data.get('ing_total_oficina')),
            
            # Egresos
            viaticos=to_decimal(data.get('viaticos')),
            losa=to_decimal(data.get('losa')),
            pension=to_decimal(data.get('pension')),
            cena=to_decimal(data.get('cena')),
            otros_gastos=to_decimal(data.get('otros')),
            total_egresos=(
                to_decimal(data.get('viaticos')) + 
                to_decimal(data.get('losa')) + 
                to_decimal(data.get('pension')) + 
                to_decimal(data.get('cena')) + 
                to_decimal(data.get('otros'))
            )
        )
        
        # Guardar en base de datos
        planilla.save()
        
        print(f"✅ Planilla {planilla.id_planilla} guardada exitosamente")
        
        return JsonResponse({
            'success': True,
            'planilla_id': planilla.id_planilla,
            'message': 'Planilla guardada exitosamente en PostgreSQL',
            'total_produccion': float(planilla.total_produccion),
            'total_egresos': float(planilla.total_egresos)
        })
        
    except Exception as e:
        print(f"❌ Error guardando planilla: {e}")
        import traceback
        traceback.print_exc()
        return JsonResponse({
            'error': f'Error guardando planilla: {str(e)}'
        }, status=500)


@csrf_exempt
def api_proxy_planillas(request):
    """
    Proxy para redirigir peticiones de planillas a tu API externa
    Esto permite que la web vía ngrok acceda a tu API externa sin problemas de CORS
    """
    print(f"🎯 Proxy recibió petición: {request.method} desde {request.META.get('REMOTE_ADDR')}")
    print(f"📋 User-Agent: {request.META.get('HTTP_USER_AGENT', 'No definido')}")
    
    if request.method != 'POST':
        return JsonResponse({'error': 'Método no permitido'}, status=405)
    
    try:
        # URL de tu API externa en proyecto separado
        api_url = 'http://127.0.0.1:8001/api/planillas/'
        
        # Preparar archivos y datos para el ViewSet
        files = {}
        data = {}
        
        # Copiar archivos del request
        for key, file in request.FILES.items():
            # Resetear posición del archivo
            file.seek(0)
            files[key] = (file.name, file.read(), file.content_type)
            print(f"📎 Archivo preparado: {key} -> {file.name} ({file.content_type})")
        
        # Copiar datos del POST
        for key, value in request.POST.items():
            data[key] = value
            print(f"📋 Dato preparado: {key} -> {value}")
        
        # Headers específicos para Django REST Framework
        headers = {
            'User-Agent': 'RindeBus-Proxy/1.0',
            'Accept': 'application/json',
        }
        
        print(f"🔄 Proxy: Redirigiendo petición a {api_url}")
        print(f"📁 Archivos: {list(files.keys())}")
        print(f"📝 Datos: {list(data.keys())}")
        print(f"🔧 Headers: {headers}")
        
        # Hacer petición a tu API externa con headers específicos
        response = requests.post(api_url, data=data, files=files, headers=headers, timeout=30)
        
        print(f"📡 API respondió: {response.status_code}")
        print(f"📄 Headers de respuesta: {dict(response.headers)}")
        print(f"📝 Contenido de respuesta (primeros 500 chars): {response.text[:500]}")
        
        # Retornar la respuesta de tu API
        try:
            response_data = response.json()
            print(f"✅ JSON válido recibido: {response_data}")
        except Exception as json_error:
            print(f"❌ Error parseando JSON: {json_error}")
            response_data = {
                'message': 'Respuesta no JSON', 
                'status': response.status_code,
                'raw_response': response.text[:200]
            }
        
        return JsonResponse(response_data, status=response.status_code)
        
    except requests.exceptions.ConnectionError as e:
        print(f"❌ Error conexión: {e}")
        return JsonResponse({
            'error': 'No se puede conectar con la API externa. Verifica que esté ejecutándose.',
            'api_url': api_url,
            'details': str(e),
            'suggestion': '¿Tu API está ejecutándose en localhost:8000?'
        }, status=503)
    except requests.exceptions.Timeout:
        return JsonResponse({
            'error': 'Timeout conectando con la API externa'
        }, status=504)
    except Exception as e:
        print(f"❌ Error proxy: {e}")
        return JsonResponse({
            'error': f'Error en proxy: {str(e)}'
        }, status=500)


@csrf_exempt
def api_proxy_datos_extraidos(request, planilla_id):
    """
    Proxy para obtener datos extraídos de una planilla específica
    """
    print(f"🔍 Obteniendo datos extraídos para planilla ID: {planilla_id}")
    
    if request.method != 'GET':
        return JsonResponse({'error': 'Método no permitido'}, status=405)
    
    try:
        # URL de tu API externa para datos extraídos
        api_url = f'http://127.0.0.1:8001/api/planillas/{planilla_id}/datos_extraidos/'
        
        print(f"🔄 Proxy GET: {api_url}")
        
        # Headers para la petición
        headers = {
            'User-Agent': 'RindeBus-Proxy/1.0',
            'Accept': 'application/json',
        }
        
        # Hacer petición GET a tu API externa
        response = requests.get(api_url, headers=headers, timeout=30)
        
        print(f"📡 API datos extraídos respondió: {response.status_code}")
        print(f"📝 Respuesta: {response.text[:500]}")
        
        # Retornar la respuesta
        try:
            response_data = response.json()
        except:
            response_data = {
                'error': 'Respuesta no JSON',
                'status': response.status_code,
                'raw_response': response.text[:200]
            }
        
        return JsonResponse(response_data, status=response.status_code)
        
    except requests.exceptions.ConnectionError as e:
        print(f"❌ Error conexión datos extraídos: {e}")
        return JsonResponse({
            'error': 'No se puede conectar con la API externa para obtener datos extraídos',
            'api_url': api_url
        }, status=503)
    except Exception as e:
        print(f"❌ Error proxy datos extraídos: {e}")
        return JsonResponse({
            'error': f'Error: {str(e)}'
        }, status=500)


@csrf_exempt
@login_required(login_url='/')
@permission_required('planillas.add_planilla')
def upload_imagen_azure(request):
    """
    Subir imagen a Azure OCR y retornar ID de procesamiento - REQUIERE PERMISOS DE CREACIÓN
    """
    print(f"📷 Upload imagen a Azure desde IP: {get_client_ip(request)}")
    
    # Verificar permisos
    if not request.user.has_perm('planillas.add_planilla'):
        return JsonResponse({
            'error': 'No tienes permisos para escanear documentos',
            'redirect': '/main/'
        }, status=403)
    
    if request.method != 'POST':
        return JsonResponse({'error': METODO_NO_PERMITIDO}, status=405)
    
    if 'imagen' not in request.FILES:
        return JsonResponse({'error': 'No se proporcionó imagen'}, status=400)
    
    try:
        imagen = request.FILES['imagen']
        print(f"📷 Procesando imagen: {imagen.name}, tamaño: {imagen.size} bytes")
        
        # URL de tu API externa para subir imagen
        api_url = 'http://127.0.0.1:8001/api/planillas/'
        
        # Preparar FormData para enviar a Azure
        files = {'imagen': (imagen.name, imagen.read(), imagen.content_type)}
        
        headers = {
            'User-Agent': 'RindeBus-Proxy/1.0',
        }
        
        print(f"📤 Enviando imagen a Azure: {api_url}")
        
        # Enviar a Azure OCR
        response = requests.post(api_url, files=files, headers=headers, timeout=60)
        
        print(f"📡 Azure respondió: {response.status_code}")
        print(f"📝 Respuesta: {response.text[:500]}")
        
        if response.ok:
            try:
                response_data = response.json()
                planilla_id = response_data.get('planilla_id') or response_data.get('id')
                
                if planilla_id:
                    print(f"✅ Imagen procesada, ID: {planilla_id}")
                    return JsonResponse({
                        'success': True,
                        'planilla_id': planilla_id,
                        'message': 'Imagen enviada a Azure para procesamiento',
                        'status': 'processing'
                    })
                else:
                    print(f"⚠️ Respuesta sin ID: {response_data}")
                    return JsonResponse({
                        'error': 'Azure no retornó ID de planilla',
                        'details': response_data
                    }, status=500)
            except Exception as json_error:
                print(f"❌ Error parseando JSON de Azure: {json_error}")
                return JsonResponse({
                    'error': 'Respuesta inválida de Azure',
                    'details': response.text[:200]
                }, status=500)
        else:
            return JsonResponse({
                'error': f'Error de Azure: {response.status_code}',
                'details': response.text[:200]
            }, status=response.status_code)
        
    except requests.exceptions.ConnectionError as e:
        print(f"❌ Error conexión con Azure: {e}")
        return JsonResponse({
            'error': 'No se puede conectar con Azure OCR',
            'suggestion': 'Verifica que la API de Azure esté ejecutándose'
        }, status=503)
    except Exception as e:
        print(f"❌ Error subiendo imagen: {e}")
        import traceback
        traceback.print_exc()
        return JsonResponse({
            'error': f'Error procesando imagen: {str(e)}'
        }, status=500)


@csrf_exempt
def api_consultas_planillas(request):
    """
    Obtener planillas con filtros desde PostgreSQL
    """
    print(f"📊 Consulta de planillas desde PostgreSQL")
    
    try:
        # Obtener parámetros de filtro
        fecha_desde = request.GET.get('fecha_desde')
        fecha_hasta = request.GET.get('fecha_hasta')
        conductor = request.GET.get('conductor')
        bus = request.GET.get('bus')
        ciudad = request.GET.get('ciudad')
        
        # Construir query
        queryset = Planilla.objects.select_related(
            'bus', 'cod_origen', 'cod_retorno', 'cod_conductor', 'cod_asistente'
        ).all()
        
        # Aplicar filtros
        if fecha_desde:
            queryset = queryset.filter(fecha__gte=fecha_desde)
        if fecha_hasta:
            queryset = queryset.filter(fecha__lte=fecha_hasta)
        if conductor:
            queryset = queryset.filter(cod_conductor_id=conductor)
        if bus:
            queryset = queryset.filter(bus_id=bus)
        if ciudad:
            queryset = queryset.filter(
                Q(cod_origen_id=ciudad) | Q(cod_retorno_id=ciudad)
            )
        
        # Ordenar por fecha descendente
        queryset = queryset.order_by('-fecha', '-fecha_creacion')
        
        # Transformar a lista de diccionarios
        planillas_list = []
        for p in queryset:
            planillas_list.append({
                'id': p.id_planilla,
                'fecha': p.fecha.isoformat(),
                'numero_planilla': str(p.id_planilla),
                'bus_id': str(p.bus.bus_id),
                'bus_patente': p.bus.patente,
                'conductor_id': p.cod_conductor.empleado_id,
                'conductor_nombre': p.cod_conductor.nombre_completo,
                'asistente_id': p.cod_asistente.empleado_id if p.cod_asistente else None,
                'asistente_nombre': p.cod_asistente.nombre_completo if p.cod_asistente else None,
                'ciudad_origen': p.cod_origen.nombre_ciudad,
                'ciudad_retorno': p.cod_retorno.nombre_ciudad if p.cod_retorno else p.cod_origen.nombre_ciudad,
                'total_produccion': float(p.total_produccion),
                'total_ingresos': float(p.total_produccion),
                'total_egresos': float(p.total_egresos),
                'ingreso_ruta': float(p.ingreso_ruta),
                'ingreso_oficina': float(p.ingreso_oficina),
                'horario_origen': p.horario_origen.strftime('%H:%M') if p.horario_origen else None,
                'horario_retorno': p.horario_retorno.strftime('%H:%M') if p.horario_retorno else None,
                'status': 'completed'
            })
        
        response_data = {
            'planillas': planillas_list,
            'total': len(planillas_list),
            'filters_applied': {
                'fecha_desde': fecha_desde,
                'fecha_hasta': fecha_hasta,
                'conductor': conductor,
                'bus': bus,
                'ciudad': ciudad
            }
        }
        
        print(f"📊 Retornando {len(planillas_list)} planillas")
        return JsonResponse(response_data)
        
    except Exception as e:
        print(f"❌ Error consultando planillas: {e}")
        import traceback
        traceback.print_exc()
        return JsonResponse({
            'error': f'Error: {str(e)}',
            'planillas': [],
            'total': 0
        }, status=500)


@csrf_exempt
def api_consultas_empleados(request):
    """
    Obtener lista de empleados desde PostgreSQL
    """
    try:
        # Obtener todos los empleados activos
        empleados = Empleado.objects.filter(activo=True).order_by('primer_nombre', 'primer_apellido')
        
        empleados_list = []
        for emp in empleados:
            empleados_list.append({
                'empleado_id': emp.empleado_id,
                'nombre': emp.primer_nombre,
                'apellidos': f"{emp.primer_apellido} {emp.segundo_apellido or ''}".strip(),
                'nombre_completo': emp.nombre_completo,
                'cargo': emp.cargo.nombre_cargo,
                'email': emp.email
            })
        
        return JsonResponse(empleados_list, safe=False)
    except Exception as e:
        print(f"❌ Error obteniendo empleados: {e}")
        return JsonResponse([], safe=False)


@csrf_exempt
def api_consultas_buses(request):
    """
    Obtener lista de buses desde PostgreSQL
    """
    try:
        # Obtener todos los buses activos
        buses = Bus.objects.filter(activo=True).order_by('bus_id')
        
        buses_list = []
        for bus in buses:
            buses_list.append({
                'bus_id': str(bus.bus_id),
                'patente': bus.patente,
                'modelo': bus.modelo or '',
                'año': bus.año
            })
        
        return JsonResponse(buses_list, safe=False)
    except Exception as e:
        print(f"❌ Error obteniendo buses: {e}")
        return JsonResponse([], safe=False)


@csrf_exempt
def api_consultas_ciudades(request):
    """
    Obtener lista de ciudades desde PostgreSQL
    """
    try:
        # Obtener todas las ciudades activas
        ciudades = Ciudad.objects.filter(activo=True).order_by('nombre_ciudad')
        
        ciudades_list = []
        for ciudad in ciudades:
            ciudades_list.append({
                'ciudad_id': ciudad.ciudad_id,
                'nombre': ciudad.nombre_ciudad,
                'region': ciudad.region or ''
            })
        
        return JsonResponse(ciudades_list, safe=False)
    except Exception as e:
        print(f"❌ Error obteniendo ciudades: {e}")
        return JsonResponse([], safe=False)