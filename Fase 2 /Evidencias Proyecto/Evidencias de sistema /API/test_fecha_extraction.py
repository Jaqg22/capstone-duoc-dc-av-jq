#!/usr/bin/env python3
"""
Test específico para verificar la extracción del campo fecha
"""

import os
import sys
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'planilla_api.settings')
django.setup()

from api.services import AzureFormRecognizerService

def test_fecha_extraction():
    """Test para verificar que la fecha se extrae correctamente de las tablas"""
    
    # Datos simulados que incluyen el problema reportado
    datos_extraidos = {
        "codigo_origen": "PAR",
        "codigo_retorno": "STG",
        "numero_bus": "1010",
        "horario_origen": "10:10",
        "horario_retorno": "19:20",
        "numero_planilla": "3003",
        "fecha": "",  # ← PROBLEMA: Viene vacío
        "codigo_conductor": "70",
        "codigo_asistente": "129",
        # ... otros campos
        "tablas": [
            {
                "row_count": 6,
                "column_count": 2,
                "cells": [
                    {"text": "Código Origen", "row_index": 0, "column_index": 0, "confidence": None},
                    {"text": "PAR", "row_index": 0, "column_index": 1, "confidence": None},
                    {"text": "Código Retorno", "row_index": 1, "column_index": 0, "confidence": None},
                    {"text": "STG", "row_index": 1, "column_index": 1, "confidence": None},
                    {"text": "Número Bus", "row_index": 2, "column_index": 0, "confidence": None},
                    {"text": "1010", "row_index": 2, "column_index": 1, "confidence": None},
                    {"text": "Patente Bus", "row_index": 3, "column_index": 0, "confidence": None},
                    {"text": "FREE-10", "row_index": 3, "column_index": 1, "confidence": None},
                    {"text": "Horario Origen", "row_index": 4, "column_index": 0, "confidence": None},
                    {"text": "10:10", "row_index": 4, "column_index": 1, "confidence": None},
                    {"text": "Horario Retorno", "row_index": 5, "column_index": 0, "confidence": None},
                    {"text": "19:20", "row_index": 5, "column_index": 1, "confidence": None}
                ]
            },
            {
                "row_count": 6,
                "column_count": 2,
                "cells": [
                    {"text": "Nro Planilla", "row_index": 0, "column_index": 0, "confidence": None},
                    {"text": "3003", "row_index": 0, "column_index": 1, "confidence": None},
                    {"text": "Fecha", "row_index": 1, "column_index": 0, "confidence": None},
                    {"text": "18-11-20:25", "row_index": 1, "column_index": 1, "confidence": None},  # ← AQUÍ está la fecha
                    {"text": "Nom. Conductor", "row_index": 2, "column_index": 0, "confidence": None},
                    {"text": "Ricardo Alarcón", "row_index": 2, "column_index": 1, "confidence": None},
                    {"text": "Cód. Conductor", "row_index": 3, "column_index": 0, "confidence": None},
                    {"text": "70", "row_index": 3, "column_index": 1, "confidence": None},
                    {"text": "Nom. Asistente", "row_index": 4, "column_index": 0, "confidence": None},
                    {"text": "Jaime Avendaño", "row_index": 4, "column_index": 1, "confidence": None},
                ]
            }
        ]
    }
    
    # Crear instancia del servicio
    service = AzureFormRecognizerService()
    
    print("🧪 PRUEBA: Extracción de fecha")
    print("=" * 50)
    
    # Mostrar estado inicial
    print(f"📅 Fecha inicial (antes del procesamiento): '{datos_extraidos['fecha']}'")
    
    # Debug: verificar que las tablas lleguen correctamente
    print(f"🔍 Número de tablas: {len(datos_extraidos.get('tablas', []))}")
    for i, tabla in enumerate(datos_extraidos.get('tablas', [])):
        print(f"   Tabla {i}: {len(tabla.get('cells', []))} celdas")
    
    # Procesar datos usando la función interna
    resultado = service._process_planilla_data(datos_extraidos)
    
    # Verificar resultado
    fecha_final = resultado.get('fecha', '')
    print(f"📅 Fecha final (después del procesamiento): '{fecha_final}'")
    
    # Validar resultado
    if fecha_final == "18-11-20:25":
        print("✅ ÉXITO: Fecha extraída correctamente de las tablas")
        return True
    else:
        print("❌ ERROR: La fecha no se extrajo correctamente")
        print("   Esperado: '18-11-20:25'")
        print(f"   Obtenido: '{fecha_final}'")
        return False

if __name__ == "__main__":
    test_fecha_extraction()