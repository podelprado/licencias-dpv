#!/bin/bash
echo ""
echo " ============================================="
echo "  Sistema de Licencias DPV"
echo " ============================================="
echo ""

if ! command -v docker &> /dev/null; then
    echo " [ERROR] Docker no está instalado."
    echo " Instalalo desde: https://www.docker.com/products/docker-desktop"
    echo ""
    exit 1
fi

if ! docker info &> /dev/null; then
    echo " [ERROR] Docker no está corriendo."
    echo " Iniciá Docker Desktop y volvé a ejecutar este script."
    echo ""
    exit 1
fi

echo " Iniciando servicios..."
docker compose up -d --build

if [ $? -ne 0 ]; then
    echo ""
    echo " [ERROR] Hubo un problema al iniciar. Revisá los logs con:"
    echo " docker compose logs"
    exit 1
fi

echo ""
echo " ============================================="
echo "  Listo! La aplicación está corriendo en:"
echo "  http://localhost"
echo "  Usuario: admin  /  Contraseña: Admin1234!"
echo " ============================================="
echo ""

# Abrir navegador según el SO
sleep 2
if command -v xdg-open &> /dev/null; then
    xdg-open http://localhost
elif command -v open &> /dev/null; then
    open http://localhost
fi
