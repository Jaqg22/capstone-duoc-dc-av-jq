"""
Test para verificar que el endpoint normal devuelve JSON corregido
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

def test_json_corregido():
    """Simula lo que hace el endpoint create/procesar_con_azure"""
    
    # Datos simulados que retornaría Azure sin correcciones
    datos_azure_raw = {
        "planilla_id": 111,
        "datos_extraidos": {
            "codigo_origen": "F6PM",  # Error: debería ser "PAR"
            "codigo_retorno": "STG",  # Correcto
            "numero_bus": "F",        # Error: debería ser "1010"
            "numero_planilla": "F12 [6]", # Error: debería ser "5009"
            "fecha": "18-11-2025",    # Correcto pero podría estar mal
            "codigo_conductor": "70", 
            "codigo_asistente": "129", 
            "tarifa_1": 2000,
            "tarifa_2": 3000,
            "tarifa_3": 4000,
            "tarifa_4": 5000,
            "tarifa_5": 6000,
            "tarifa_6": 70000,
            "b_inicial_1": 2,
            "b_inicial_2": 10,
            "b_inicial_3": 30,
            "b_inicial_4": 21,
            "b_inicial_5": 15,
            "b_inicial_6": 110,
            "b_final_1": 4,
            "b_final_2": 6000,       # ERROR: Muy alto para boletos
            "b_final_3": 30,
            "b_final_4": 24,
            "b_final_5": 15,
            "b_final_6": 110,
            "total_ingreso_ruta": 25000,
            "total_ingreso_oficina": 955000,
            "total_ingresos": 980000,
            "losa": 7000,
            "pension": 30000,
            "cena": 9000,
            "viaticos": 11000,
            "otros": 0,
            "total_egresos": 57000,
            "tablas": [
                {
                    "row_count": 6,
                    "column_count": 2,
                    "cells": [
                        {"text": "Código Origen", "row_index": 0, "column_index": 0},
                        {"text": "PAR", "row_index": 0, "column_index": 1},
                        {"text": "Código Retorno", "row_index": 1, "column_index": 0},
                        {"text": "STG", "row_index": 1, "column_index": 1},
                        {"text": "Número Bus", "row_index": 2, "column_index": 0},
                        {"text": "1010", "row_index": 2, "column_index": 1},
                        {"text": "Nro Planilla", "row_index": 3, "column_index": 0},
                        {"text": "5009", "row_index": 3, "column_index": 1},
                        {"text": "Fecha", "row_index": 4, "column_index": 0},
                        {"text": "18-11-2025", "row_index": 4, "column_index": 1}
                    ]
                },
                {
                    "row_count": 7,
                    "column_count": 7,
                    "cells": [
                        {"text": "Tarifas/Tickets", "row_index": 0, "column_index": 1},
                        {"text": "2000", "row_index": 1, "column_index": 1},
                        {"text": "3000", "row_index": 1, "column_index": 2},
                        {"text": "4000", "row_index": 1, "column_index": 3},
                        {"text": "5000", "row_index": 1, "column_index": 4},
                        {"text": "6000", "row_index": 1, "column_index": 5},
                        {"text": "70000", "row_index": 1, "column_index": 6},
                        {"text": "RAR", "row_index": 2, "column_index": 0},
                        {"text": "02", "row_index": 2, "column_index": 1},
                        {"text": "10", "row_index": 2, "column_index": 2},
                        {"text": "30", "row_index": 2, "column_index": 3},
                        {"text": "21", "row_index": 2, "column_index": 4},
                        {"text": "15", "row_index": 2, "column_index": 5},
                        {"text": "110", "row_index": 2, "column_index": 6},
                        {"text": "PAR", "row_index": 6, "column_index": 0},
                        {"text": "04", "row_index": 6, "column_index": 1},
                        {"text": "12", "row_index": 6, "column_index": 2},
                        {"text": "30", "row_index": 6, "column_index": 3},
                        {"text": "24", "row_index": 6, "column_index": 4},
                        {"text": "15", "row_index": 6, "column_index": 5},
                        {"text": "110", "row_index": 6, "column_index": 6}
                    ]
                }
            ]
        }
    }
    
    print("🔍 SIMULANDO PROCESAMIENTO CON azure_service.analyze_document()")
    print("="*70)
    
    # Simular lo que hace el servicio Azure con las correcciones
    extracted_data = datos_azure_raw["datos_extraidos"].copy()
    
    # Aplicar las correcciones que están en azure_service
    service = azure_service
    service._process_planilla_data(extracted_data)
    
    print("📊 JSON ORIGINAL (con errores):")
    print(f"  codigo_origen: '{datos_azure_raw['datos_extraidos']['codigo_origen']}'")
    print(f"  numero_bus: '{datos_azure_raw['datos_extraidos']['numero_bus']}'") 
    print(f"  numero_planilla: '{datos_azure_raw['datos_extraidos']['numero_planilla']}'")
    print(f"  b_final_2: {datos_azure_raw['datos_extraidos']['b_final_2']}")
    
    print("\n✅ JSON CORREGIDO (que devuelve el endpoint):")
    print(f"  codigo_origen: '{extracted_data.get('codigo_origen')}'")
    print(f"  numero_bus: '{extracted_data.get('numero_bus')}'")
    print(f"  numero_planilla: '{extracted_data.get('numero_planilla')}'") 
    print(f"  b_final_2: {extracted_data.get('b_final_2')}")
    
    # Verificar correcciones
    correcciones = []
    
    if extracted_data.get('codigo_origen') == 'PAR':
        correcciones.append("✅ codigo_origen corregido: F6PM → PAR")
    else:
        correcciones.append(f"❌ codigo_origen: {extracted_data.get('codigo_origen')}")
        
    if extracted_data.get('numero_bus') == '1010':
        correcciones.append("✅ numero_bus corregido: F → 1010")  
    else:
        correcciones.append(f"❌ numero_bus: {extracted_data.get('numero_bus')}")
        
    if extracted_data.get('numero_planilla') == '5009':
        correcciones.append("✅ numero_planilla corregido: F12 [6] → 5009")
    else:
        correcciones.append(f"❌ numero_planilla: {extracted_data.get('numero_planilla')}")
        
    if extracted_data.get('b_final_2') != 6000:
        correcciones.append(f"✅ b_final_2 corregido: 6000 → {extracted_data.get('b_final_2')}")
    else:
        correcciones.append("❌ b_final_2 no corregido")
    
    print(f"\n🎯 VERIFICACIÓN:")
    for correccion in correcciones:
        print(f"  {correccion}")
        
    exitosas = len([c for c in correcciones if c.startswith("✅")])
    
    print(f"\n📈 RESULTADO: {exitosas}/4 correcciones aplicadas correctamente")
    
    if exitosas == 4:
        print("🎉 ¡PERFECTO! El JSON que devuelve el endpoint ahora es correcto")
    else:
        print("⚠️  Algunas correcciones no se aplicaron") 
        
    return extracted_data

if __name__ == "__main__":
    test_json_corregido()