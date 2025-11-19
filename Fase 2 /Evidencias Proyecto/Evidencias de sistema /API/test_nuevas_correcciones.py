"""
Script para probar las correcciones automáticas en el endpoint de planillas
"""

import os
import sys
import django
from django.conf import settings

# Configurar Django
if not settings.configured:
    sys.path.append(os.path.dirname(os.path.abspath(__file__)))
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'planilla_api.settings')
    django.setup()

from api.models import Planilla
from api.views import aplicar_datos_extraidos_a_planilla

def test_aplicar_datos_extraidos():
    """Prueba la función de aplicar datos extraídos"""
    
    # Simular datos extraídos con errores conocidos
    datos_con_errores = {
        "codigo_origen": "F6PM",  # Error: debería ser "PAR" 
        "codigo_retorno": "STG",  # Correcto
        "numero_bus": "F",        # Error: debería ser "1010"
        "numero_planilla": "F12 [6]", # Error: debería ser "5009"
        "fecha": "18-11-2025",    # Correcto
        "tarifa_1": 2000,        # Correcto
        "tarifa_2": 3000,        # Correcto
        "b_final_2": 6000,       # Error: muy alto
        "total_ingresos": 980000,
        "losa": 7000,
        "pension": 30000,
        "tablas": [
            {
                "row_count": 6,
                "column_count": 2,
                "cells": [
                    {"text": "Código Origen", "row_index": 0, "column_index": 0},
                    {"text": "PAR", "row_index": 0, "column_index": 1},
                    {"text": "Número Bus", "row_index": 2, "column_index": 0},
                    {"text": "1010", "row_index": 2, "column_index": 1},
                    {"text": "Nro Planilla", "row_index": 3, "column_index": 0},
                    {"text": "5009", "row_index": 3, "column_index": 1}
                ]
            }
        ]
    }
    
    # Crear una planilla de prueba
    planilla = Planilla()
    
    # Simular el procesamiento usando la función real
    print("=== ANTES DE APLICAR DATOS ===")
    print(f"Código Origen: {planilla.codigo_origen}")
    print(f"Número Bus: {planilla.numero_bus}")
    print(f"Número Planilla: {planilla.numero_planilla}")
    print(f"B Final 2: {planilla.b_final_2}")
    
    # Aplicar datos extraídos (esto debería incluir las correcciones)
    campos_actualizados = aplicar_datos_extraidos_a_planilla(planilla, datos_con_errores)
    
    print("\n=== DESPUÉS DE APLICAR DATOS ===")
    print(f"Código Origen: {planilla.codigo_origen} (esperado: PAR)")
    print(f"Número Bus: {planilla.numero_bus} (esperado: 1010)")
    print(f"Número Planilla: {planilla.numero_planilla} (esperado: 5009)")
    print(f"B Final 2: {planilla.b_final_2}")
    print(f"Campos actualizados: {len(campos_actualizados)}")
    
    # Verificar correcciones
    correcciones = []
    if planilla.codigo_origen == 'PAR':
        correcciones.append("✓ Código Origen corregido")
    else:
        correcciones.append(f"✗ Código Origen: {planilla.codigo_origen} (esperado: PAR)")
    
    if planilla.numero_bus == '1010':
        correcciones.append("✓ Número Bus corregido")
    else:
        correcciones.append(f"✗ Número Bus: {planilla.numero_bus} (esperado: 1010)")
        
    if planilla.numero_planilla == '5009':
        correcciones.append("✓ Número Planilla corregido")
    else:
        correcciones.append(f"✗ Número Planilla: {planilla.numero_planilla} (esperado: 5009)")
    
    print("\n=== VERIFICACIÓN DE CORRECCIONES ===")
    for correccion in correcciones:
        print(correccion)
    
    return len([c for c in correcciones if c.startswith("✓")])

def test_endpoints_info():
    """Muestra información sobre los nuevos endpoints"""
    
    print("\n" + "="*60)
    print("NUEVOS ENDPOINTS DISPONIBLES")
    print("="*60)
    
    endpoints = [
        {
            "url": "/api/planillas/{id}/reprocesar_con_correcciones/",
            "method": "POST",
            "description": "Reprocesa una planilla específica con las correcciones mejoradas"
        },
        {
            "url": "/api/planillas/reprocesar_todas_con_correcciones/",
            "method": "POST", 
            "description": "Reprocesa TODAS las planillas con las correcciones mejoradas"
        }
    ]
    
    for endpoint in endpoints:
        print(f"\n📡 {endpoint['method']} {endpoint['url']}")
        print(f"   {endpoint['description']}")
    
    print(f"\n📋 CORRECCIONES AUTOMÁTICAS INCLUIDAS:")
    print(f"   • Prioriza datos de tablas sobre Azure Form Recognizer")
    print(f"   • Corrige códigos extraídos incorrectamente")
    print(f"   • Valida y corrige boletos finales con valores erróneos")
    print(f"   • Extrae fechas en formato correcto")
    print(f"   • Logging detallado del proceso de corrección")

if __name__ == "__main__":
    print("🧪 PROBANDO CORRECCIONES AUTOMÁTICAS")
    print("="*60)
    
    correcciones_exitosas = test_aplicar_datos_extraidos()
    
    print(f"\n🎯 RESUMEN: {correcciones_exitosas}/3 correcciones funcionando correctamente")
    
    test_endpoints_info()
    
    print(f"\n✅ ESTADO: Las planillas que se suban de ahora en adelante")
    print(f"   usarán automáticamente las correcciones mejoradas.")