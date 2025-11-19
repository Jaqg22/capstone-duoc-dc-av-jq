"""
Script de prueba para verificar las correcciones en la extracción de datos
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

import json
from api.services import AzureFormRecognizerService

def test_data_extraction_fixes():
    """Prueba las correcciones de extracción de datos"""
    
    # Datos de ejemplo que nos enviaste
    sample_data = {
        "planilla_id": 111,
        "datos_extraidos": {
            "codigo_origen": "F6PM",  # Error: debería ser "PAR"
            "codigo_retorno": "STG",  # Correcto
            "numero_bus": "F",        # Error: debería ser "1010"
            "horario_origen": "10:10", # Correcto
            "horario_retorno": "19:10", # Correcto
            "numero_planilla": "F12 [6]", # Error: debería ser "5009"
            "fecha": "18-11-2025",    # Correcto
            "codigo_conductor": "70", # Correcto
            "codigo_asistente": "129", # Correcto
            "tarifa_1": 2000,        # Correcto
            "tarifa_2": 3000,        # Correcto
            "tarifa_3": 4000,        # Correcto
            "tarifa_4": 5000,        # Correcto
            "tarifa_5": 6000,        # Correcto
            "tarifa_6": 70000,       # Correcto
            "b_inicial_1": 2,        # Correcto
            "b_inicial_2": 10,       # Correcto
            "b_inicial_3": 30,       # Correcto
            "b_inicial_4": 21,       # Correcto
            "b_inicial_5": 15,       # Correcto
            "b_inicial_6": 110,      # Correcto
            "b_final_1": 4,          # Correcto
            "b_final_2": 6000,       # ERROR: Muy alto, debería ser ~12
            "b_final_3": 30,         # Correcto
            "b_final_4": 24,         # Correcto
            "b_final_5": 15,         # Correcto
            "b_final_6": 110,        # Correcto
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
                        {"text": "Oficina", "row_index": 0, "column_index": 0},
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
    
    # Crear instancia del servicio
    service = AzureFormRecognizerService()
    
    # Simular procesamiento
    extracted_data = sample_data["datos_extraidos"]
    
    print("=== ANTES DE LA CORRECCIÓN ===")
    print(f"Código Origen: {extracted_data.get('codigo_origen')}")
    print(f"Número Bus: {extracted_data.get('numero_bus')}")
    print(f"Número Planilla: {extracted_data.get('numero_planilla')}")
    print(f"B Final 2: {extracted_data.get('b_final_2')}")
    
    # Aplicar procesamiento completo de las tablas
    service._process_planilla_data(extracted_data)
    
    print("\n=== DESPUÉS DE LA CORRECCIÓN ===")
    print(f"Código Origen: {extracted_data.get('codigo_origen')} (esperado: PAR)")
    print(f"Número Bus: {extracted_data.get('numero_bus')} (esperado: 1010)")
    print(f"Número Planilla: {extracted_data.get('numero_planilla')} (esperado: 5009)")
    print(f"B Final 2: {extracted_data.get('b_final_2')} (esperado: valor menor a 1000)")
    
    # Verificar si las correcciones funcionaron
    corrections = []
    if extracted_data.get('codigo_origen') == 'PAR':
        corrections.append("✓ Código Origen corregido")
    else:
        corrections.append("✗ Código Origen no corregido")
    
    if extracted_data.get('numero_bus') == '1010':
        corrections.append("✓ Número Bus corregido")
    else:
        corrections.append("✗ Número Bus no corregido")
        
    if extracted_data.get('numero_planilla') == '5009':
        corrections.append("✓ Número Planilla corregido")
    else:
        corrections.append("✗ Número Planilla no corregido")
        
    if isinstance(extracted_data.get('b_final_2'), int) and extracted_data.get('b_final_2') < 1000:
        corrections.append("✓ B Final 2 corregido")
    else:
        corrections.append("✗ B Final 2 no corregido")
    
    print("\n=== RESUMEN DE CORRECCIONES ===")
    for correction in corrections:
        print(correction)
    
    return extracted_data

if __name__ == "__main__":
    test_data_extraction_fixes()