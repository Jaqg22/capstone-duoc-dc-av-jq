"""
Test específico para verificar la corrección del número de planilla
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

from api.services import azure_service

def test_numero_planilla_correction():
    """
    Test específico para verificar la corrección del número de planilla
    """
    
    # Simular datos como los del ejemplo que enviaste
    datos_ejemplo = {
        "numero_planilla": "F12 6",  # Error de Azure
        "tablas": [
            {
                "row_count": 6,
                "column_count": 2,
                "cells": [
                    {"text": "Nro Planilla", "row_index": 0, "column_index": 0},
                    {"text": "5009", "row_index": 0, "column_index": 1},  # Valor correcto
                    {"text": "Fecha", "row_index": 1, "column_index": 0},
                    {"text": "18-11-2025", "row_index": 1, "column_index": 1}
                ]
            }
        ],
        "raw_result": {
            "documents": [
                {
                    "fields": {
                        "Número_Planilla": {
                            "value": "F12 6"  # Valor incorrecto de Azure
                        }
                    }
                }
            ]
        }
    }
    
    print("🧪 TEST: Corrección del Número de Planilla")
    print("="*50)
    
    print(f"📥 ANTES:")
    print(f"  Azure detectó: '{datos_ejemplo['numero_planilla']}'")
    print(f"  Tabla contiene: '5009'")
    
    # Aplicar procesamiento
    service = azure_service
    service._process_planilla_data(datos_ejemplo)
    
    print(f"\n📤 DESPUÉS:")
    print(f"  Resultado final: '{datos_ejemplo.get('numero_planilla')}'")
    
    # Verificar corrección
    if datos_ejemplo.get('numero_planilla') == '5009':
        print("\n✅ ÉXITO: Número de planilla corregido correctamente")
        print("   La tabla tuvo prioridad sobre Azure Form Recognizer")
        return True
    else:
        print(f"\n❌ FALLO: Número de planilla no corregido")
        print(f"   Esperado: '5009', Obtenido: '{datos_ejemplo.get('numero_planilla')}'")
        return False

def test_all_critical_fields():
    """
    Test completo para verificar corrección de todos los campos críticos
    """
    
    print("\n🔍 TEST COMPLETO: Todos los campos críticos")
    print("="*60)
    
    # Datos simulados con errores conocidos
    datos_con_errores = {
        "codigo_origen": "F6PM",      # Error Azure
        "numero_bus": "F",            # Error Azure  
        "numero_planilla": "F12 6",   # Error Azure
        "tablas": [
            {
                "cells": [
                    {"text": "Código Origen", "row_index": 0, "column_index": 0},
                    {"text": "PAR", "row_index": 0, "column_index": 1},
                    {"text": "Número Bus", "row_index": 1, "column_index": 0},
                    {"text": "1010", "row_index": 1, "column_index": 1},
                    {"text": "Nro Planilla", "row_index": 2, "column_index": 0},
                    {"text": "5009", "row_index": 2, "column_index": 1}
                ]
            }
        ],
        "raw_result": {
            "documents": [{"fields": {}}]  # Azure vacío para forzar uso de tablas
        }
    }
    
    # Aplicar correcciones
    azure_service._process_planilla_data(datos_con_errores)
    
    # Verificar resultados
    tests = [
        ("codigo_origen", "PAR", datos_con_errores.get('codigo_origen')),
        ("numero_bus", "1010", datos_con_errores.get('numero_bus')),
        ("numero_planilla", "5009", datos_con_errores.get('numero_planilla'))
    ]
    
    exitosos = 0
    for field, expected, actual in tests:
        if actual == expected:
            print(f"  ✅ {field}: '{actual}' ✓")
            exitosos += 1
        else:
            print(f"  ❌ {field}: '{actual}' (esperado: '{expected}')")
    
    print(f"\n📊 Resultado: {exitosos}/{len(tests)} campos corregidos correctamente")
    return exitosos == len(tests)

if __name__ == "__main__":
    print("🎯 VERIFICANDO CORRECCIÓN ESPECÍFICA DEL NÚMERO DE PLANILLA")
    print("="*70)
    
    # Test específico del número de planilla
    test1_success = test_numero_planilla_correction()
    
    # Test completo
    test2_success = test_all_critical_fields()
    
    if test1_success and test2_success:
        print(f"\n🎉 ¡TODOS LOS TESTS PASARON!")
        print(f"   El número de planilla ahora se extrae correctamente de las tablas")
        print(f"   Valores de Azure Form Recognizer solo se usan como respaldo")
    else:
        print(f"\n⚠️  Algunos tests fallaron")
        
    print(f"\n📝 RESUMEN:")
    print(f"   • Las tablas tienen PRIORIDAD sobre Azure Form Recognizer")
    print(f"   • Número de planilla: tabla = '5009', Azure = 'F12 6'")
    print(f"   • El resultado final debe ser siempre '5009'")