# Script para configurar PostgreSQL para RindeBus
# Ejecuta este script después de instalar PostgreSQL

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Configuración de PostgreSQL" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Verificar si PostgreSQL está instalado
$pgPath = "C:\Program Files\PostgreSQL\*\bin\psql.exe"
if (-not (Test-Path $pgPath)) {
    Write-Host "❌ PostgreSQL no está instalado" -ForegroundColor Red
    Write-Host ""
    Write-Host "Descarga PostgreSQL desde: https://www.postgresql.org/download/windows/" -ForegroundColor Yellow
    Write-Host "Versión recomendada: PostgreSQL 15 o superior" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Presiona Enter para salir"
    exit
}

Write-Host "✅ PostgreSQL encontrado" -ForegroundColor Green
Write-Host ""

# Solicitar credenciales
$dbName = Read-Host "Nombre de la base de datos [rindebus_db]"
if ([string]::IsNullOrWhiteSpace($dbName)) { $dbName = "rindebus_db" }

$dbUser = Read-Host "Usuario de PostgreSQL [postgres]"
if ([string]::IsNullOrWhiteSpace($dbUser)) { $dbUser = "postgres" }

$dbPassword = Read-Host "Contraseña de PostgreSQL" -AsSecureString
$dbPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($dbPassword))

Write-Host ""
Write-Host "Creando base de datos '$dbName'..." -ForegroundColor Yellow

# Buscar psql.exe en todas las versiones de PostgreSQL
$psqlPath = Get-ChildItem "C:\Program Files\PostgreSQL\*\bin\psql.exe" -ErrorAction SilentlyContinue | Select-Object -First 1

if ($psqlPath) {
    Write-Host "PostgreSQL encontrado en: $($psqlPath.FullName)" -ForegroundColor Cyan
    
    # Crear base de datos
    $env:PGPASSWORD = $dbPasswordPlain
    & $psqlPath.FullName -U $dbUser -c "CREATE DATABASE $dbName;" 2>$null

    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Base de datos creada exitosamente" -ForegroundColor Green
    } else {
        Write-Host "⚠️  La base de datos ya existe o hubo un error" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️  No se pudo crear la base de datos automáticamente" -ForegroundColor Yellow
    Write-Host "Créala manualmente con: psql -U $dbUser -c 'CREATE DATABASE $dbName;'" -ForegroundColor Yellow
}

# Crear archivo .env
Write-Host ""
Write-Host "Creando archivo .env..." -ForegroundColor Yellow

$envContent = @"
# Configuración de Base de Datos PostgreSQL
DB_NAME=$dbName
DB_USER=$dbUser
DB_PASSWORD=$dbPasswordPlain
DB_HOST=localhost
DB_PORT=5432

# Configuración de Django
DEBUG=True
SECRET_KEY=django-insecure-$(Get-Random)-$(Get-Date -Format 'yyyyMMddHHmmss')
"@

Set-Content -Path ".env" -Value $envContent
Write-Host "✅ Archivo .env creado" -ForegroundColor Green

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Configuración completada" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Siguientes pasos:" -ForegroundColor Yellow
Write-Host "1. Activar entorno virtual: .\venv\Scripts\Activate.ps1" -ForegroundColor White
Write-Host "2. Aplicar migraciones: python manage.py migrate" -ForegroundColor White
Write-Host "3. Crear superusuario: python manage.py createsuperuser" -ForegroundColor White
Write-Host "4. Ejecutar servidor: python manage.py runserver" -ForegroundColor White
Write-Host ""
Read-Host "Presiona Enter para continuar"
