"""
Script de prueba para verificar conectividad con la API externa
"""
import requests
import json

def test_api_connection():
    """Probar conexión con la API externa"""
    api_base_url = 'http://localhost:8001/api/'
    
    print("🧪 Testing API externa...")
    print(f"🔗 URL base: {api_base_url}")
    
    # Test 1: Health check o root endpoint
    try:
        print("\n1️⃣ Probando endpoint root...")
        response = requests.get(f"{api_base_url}", timeout=5)
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.text[:200]}...")
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    # Test 2: Planillas endpoint con GET
    try:
        print("\n2️⃣ Probando GET /api/planillas/...")
        response = requests.get(f"{api_base_url}planillas/", timeout=5)
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.text[:200]}...")
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    # Test 3: Headers de OPTIONS (CORS)
    try:
        print("\n3️⃣ Probando OPTIONS /api/planillas/ (CORS)...")
        response = requests.options(f"{api_base_url}planillas/", timeout=5)
        print(f"   Status: {response.status_code}")
        print(f"   Headers: {dict(response.headers)}")
    except Exception as e:
        print(f"   ❌ Error: {e}")

if __name__ == '__main__':
    test_api_connection()