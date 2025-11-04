# Migración a PostgreSQL - Instrucciones Completas

## ✅ Lo que se ha completado

1. ✅ Instalado psycopg2-binary (driver de PostgreSQL)
2. ✅ Instalado python-dotenv (manejo de variables de entorno)
3. ✅ Configurado settings.py para usar PostgreSQL
4. ✅ Creado .env.example con plantilla de configuración
5. ✅ Corregido el redirect del logout

## 📋 Pasos para completar la migración

### 1. Instalar PostgreSQL (si no lo tienes)
Descarga e instala PostgreSQL desde: https://www.postgresql.org/download/windows/
- Versión recomendada: PostgreSQL 15 o superior
- Durante la instalación, recuerda la contraseña del usuario 'postgres'

### 2. Ejecutar el script de configuración
Abre PowerShell en la carpeta `backend` y ejecuta:
```powershell
.\setup_postgresql.ps1
```

Este script:
- Verificará si PostgreSQL está instalado
- Te pedirá las credenciales
- Creará la base de datos 'rindebus_db'
- Generará automáticamente el archivo `.env` con tus credenciales

### 3. Aplicar migraciones
```powershell
python manage.py migrate
```

Esto creará todas las tablas necesarias en PostgreSQL.

### 4. Crear superusuario
```powershell
python manage.py createsuperuser
```

Ingresa:
- Usuario: (tu elección)
- Email: (opcional)
- Contraseña: (mínimo 8 caracteres)

### 5. Iniciar el servidor
```powershell
python manage.py runserver
```

### 6. Probar el sistema
1. Abre http://localhost:8000
2. Inicia sesión con el superusuario creado
3. Verifica que el login funciona correctamente
4. Prueba cerrar sesión (debe redirigir a la página de inicio)

## 🔧 Alternativa manual (sin script)

Si prefieres no usar el script, puedes hacer la configuración manualmente:

### Crear base de datos manualmente:
```powershell
# Conectar a PostgreSQL
psql -U postgres

# En el prompt de PostgreSQL:
CREATE DATABASE rindebus_db;
\q
```

### Crear archivo .env manualmente:
Copia `.env.example` a `.env` y edita los valores:
```
DB_NAME=rindebus_db
DB_USER=postgres
DB_PASSWORD=tu_contraseña_real
DB_HOST=localhost
DB_PORT=5432

DEBUG=True
SECRET_KEY=django-insecure-tu-clave-secreta-aqui
```

Luego continúa desde el paso 3 (aplicar migraciones).

## 📝 Configuración actual

### Base de datos (settings.py):
```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ.get('DB_NAME', 'rindebus_db'),
        'USER': os.environ.get('DB_USER', 'postgres'),
        'PASSWORD': os.environ.get('DB_PASSWORD', ''),
        'HOST': os.environ.get('DB_HOST', 'localhost'),
        'PORT': os.environ.get('DB_PORT', '5432'),
    }
}
```

### Autenticación:
- ✅ Login implementado con Django authentication
- ✅ Rutas protegidas con @login_required
- ✅ Logout con redirect correcto
- ✅ Mensajes de error/éxito implementados

## 🚨 Notas importantes

1. **Archivo .env**: NO subir a Git (ya está en .gitignore)
2. **Contraseñas**: Usa contraseñas seguras en producción
3. **DEBUG**: Cambiar a False en producción
4. **SECRET_KEY**: Generar una nueva clave para producción

## 🔍 Verificación de errores comunes

### Error: "No existe la base de datos"
- Ejecuta el script setup_postgresql.ps1
- O créala manualmente con `CREATE DATABASE rindebus_db;`

### Error: "authentication failed"
- Verifica que la contraseña en .env sea correcta
- Verifica que el usuario PostgreSQL existe

### Error: "psycopg2 module not found"
- Ejecuta: `pip install psycopg2-binary`

### Error al hacer logout
- Ya está corregido: ahora usa `redirect('frontend:inicio')`

## 📊 Estado de los datos

- Los datos de SQLite no se migrarán automáticamente
- Empezarás con una base de datos limpia en PostgreSQL
- Necesitarás crear un nuevo superusuario
- Cualquier registro de usuario previo se perderá

Si necesitas migrar datos de SQLite a PostgreSQL, avísame.
