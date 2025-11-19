#!/usr/bin/env python3
"""
Test completo para verificar que todos los campos se extraen correctamente
incluyendo la fecha con formato original
"""

import os
import sys
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'planilla_api.settings')
django.setup()

from api.services import AzureFormRecognizerService

def test_extraction_completa():
    """Test completo con los datos del usuario"""
    
    # Datos exactos del usuario
    datos_extraidos = {
        "planilla_id": 124,
        "datos_extraidos": {
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
                        {"text": "18-11-20:25", "row_index": 1, "column_index": 1, "confidence": None},
                        {"text": "Nom. Conductor", "row_index": 2, "column_index": 0, "confidence": None},
                        {"text": "Ricardo Alarcón", "row_index": 2, "column_index": 1, "confidence": None},
                        {"text": "Cód. Conductor", "row_index": 3, "column_index": 0, "confidence": None},
                        {"text": "70", "row_index": 3, "column_index": 1, "confidence": None},
                        {"text": "Nom. Asistente", "row_index": 4, "column_index": 0, "confidence": None},
                        {"text": "Jaime Avendaño", "row_index": 4, "column_index": 1, "confidence": None}
                    ]
                }
            ]
        }
    }
    
    # Acceder a los datos internos
    datos_procesamiento = datos_extraidos["datos_extraidos"]
    
    # Crear instancia del servicio
    service = AzureFormRecognizerService()
    
    print("🧪 PRUEBA COMPLETA: Extracción de todos los campos")
    print("=" * 60)
    
    # Procesar datos
    resultado = service._process_planilla_data(datos_procesamiento)
    
    # Verificar campos críticos
    campos_verificar = {
        'codigo_origen': 'PAR',
        'codigo_retorno': 'STG', 
        'numero_bus': '1010',
        'numero_planilla': '3003',
        'fecha': '18-11-20:25',  # ← EL FORMATO ORIGINAL DEBE MANTENERSE
        'codigo_conductor': '70',
        'horario_origen': '10:10',
        'horario_retorno': '19:20'
    }
    
    print("📋 RESULTADOS:")
    exitos = 0
    total = len(campos_verificar)
    
    for campo, esperado in campos_verificar.items():
        obtenido = resultado.get(campo, '')
        if str(obtenido) == str(esperado):
            print(f"✅ {campo}: '{obtenido}' (correcto)")
            exitos += 1
        else:
            print(f"❌ {campo}: esperado '{esperado}', obtenido '{obtenido}'")
    
    print(f"\n📊 RESUMEN: {exitos}/{total} campos correctos")
    
    if exitos == total:
        print("🎉 ¡TODOS LOS CAMPOS SE EXTRAJERON CORRECTAMENTE!")
        print("🗓️  La fecha mantiene su formato original: '18-11-20:25'")
        return True
    else:
        print("⚠️  Algunos campos no se extrajeron correctamente")
        return False

if __name__ == "__main__":
    test_extraction_completa()