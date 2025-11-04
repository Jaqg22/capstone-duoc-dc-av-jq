"""
Vistas para servir las páginas HTML del frontend de RindeBus
"""
from django.shortcuts import render, redirect
from django.http import HttpResponse, JsonResponse
from django.conf import settings
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_exempt
from django.contrib import messages
import json
import os
import requests
from urllib.parse import urljoin


def inicio_view(request):
    """Vista para la página de inicio/login"""
    # Si el usuario ya está autenticado, redirigir al main
    if request.user.is_authenticated:
        return redirect('frontend:main')
    
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
                return redirect('frontend:main')
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
        'user': request.user
    })


@login_required(login_url='/')
def manual_view(request):
    """Vista para la página de planilla manual"""
    return render(request, 'manual.html', {
        'user': request.user
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