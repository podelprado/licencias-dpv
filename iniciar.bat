@echo off
echo.
echo  =============================================
echo   Sistema de Licencias DPV
echo  =============================================
echo.

where docker >nul 2>&1
if %errorlevel% neq 0 (
    echo  [ERROR] Docker no esta instalado.
    echo  Descargalo desde: https://www.docker.com/products/docker-desktop
    echo.
    pause
    exit /b 1
)

docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo  [ERROR] Docker Desktop no esta corriendo.
    echo  Abrilo desde el menu de inicio y volvé a ejecutar este script.
    echo.
    pause
    exit /b 1
)

echo  Iniciando servicios...
docker compose up -d --build

if %errorlevel% neq 0 (
    echo.
    echo  [ERROR] Hubo un problema al iniciar. Revisa los logs con:
    echo  docker compose logs
    pause
    exit /b 1
)

echo.
echo  =============================================
echo   Listo! Abriendo la aplicacion...
echo   URL: http://localhost
echo   Usuario: admin  /  Contrasena: Admin1234!
echo  =============================================
echo.

timeout /t 3 /nobreak >nul
start http://localhost
pause
