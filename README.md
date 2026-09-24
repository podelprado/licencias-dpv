# Sistema de Licencias DPV

Aplicación de gestión de licencias de empleados. Stack: **NestJS + MongoDB + React + Vite + Tailwind**.

## Requisitos

- Node.js >= 18
- MongoDB (local o Atlas)

## Instalación rápida

```bash
# 1. Backend
cd backend
npm install
cp .env.example .env   # editar MONGODB_URI y JWT_SECRET
npm run start:dev

# 2. Frontend (otra terminal)
cd frontend
npm install
npm run dev
```

Abrir: http://localhost:5173

**Credenciales por defecto:** `admin / Admin1234!`

## Módulos

| Módulo | Roles con acceso |
|--------|-----------------|
| Dashboard | Todos |
| Empleados | Todos (edición: admin/manager) |
| Licencias | Todos (carga: admin/manager) |
| Tipos de licencia | admin, manager |
| Usuarios | admin |

## Roles

- **admin** — acceso total
- **manager** — empleados, licencias, tipos de licencia
- **viewer** — solo lectura

## Funcionalidades principales

- Grilla de calendario por mes/año con colores por tipo de licencia
- Resumen anual de días por tipo
- Impresión de licencias por empleado (`Ctrl+P` o botón Imprimir)
- Filtros por empleado, mes, año y estado
- Seed automático de admin y tipos de licencia por defecto

## Variables de entorno (backend/.env)

```
MONGODB_URI=mongodb://localhost:27017/licencias-dpv
JWT_SECRET=cambiar_en_produccion
JWT_EXPIRES_IN=8h
PORT=3001
```

## Estructura

```
licencias-dpv/
├── backend/     # NestJS API REST
├── frontend/    # React + Vite + Tailwind
├── electron/    # Wrapper de escritorio Electron
├── docker-compose.yml
├── iniciar.bat  # Windows: doble click para arrancar
└── iniciar.sh   # Linux/Mac: ./iniciar.sh para arrancar
```

## Uso en red interna (múltiples PCs)

### En el servidor (host01)
1. Instalar [Docker Desktop](https://www.docker.com/products/docker-desktop)
2. Ejecutar `Licencias DPV Servidor Setup 1.0.0.exe`
3. La app levanta Docker automáticamente y queda sirviendo en el puerto 80

### En cada cliente (host02, host03...)
1. Ejecutar `Licencias DPV Cliente Setup 1.0.0.exe`
2. Al abrir por primera vez, pide la IP del servidor (ej: `192.168.1.100`)
3. La IP se guarda — las próximas veces abre directo
4. Si la IP cambia, desde la pantalla de error aparece el botón **Cambiar servidor**

> **Tip**: Asignar IP fija al servidor en el router para que no cambie.

## Generar instaladores Windows (.exe)

### Opción A — Desde Windows (recomendado)
```bash
cd electron
npm install
npm run build
# El instalador queda en: release/Licencias DPV Setup 1.0.0.exe
```

### Opción B — GitHub Actions (automático)
1. Subir el código a GitHub
2. Ir a Actions → "Build Windows Installer" → Run workflow
3. Descargar el `.exe` desde los Artifacts

### Opción C — Generar AppImage Linux
```bash
cd electron
npm install
npm run build:linux
# El instalador queda en: release/Licencias DPV-1.0.0.AppImage
```

## Uso del instalador

1. Instalar [Docker Desktop](https://www.docker.com/products/docker-desktop)
2. Ejecutar `Licencias DPV Setup 1.0.0.exe`
3. Al abrir la app, levanta Docker automáticamente
4. Se abre la ventana con la aplicación lista
