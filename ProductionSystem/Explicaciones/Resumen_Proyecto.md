# Recorrido de Implementación: Sistema de Gestión de Producción

Hemos completado la construcción de la arquitectura y el código base del sistema solicitado.

## Estructura del Proyecto
El proyecto se encuentra en la carpeta `ProductionSystem` en tu Escritorio:

```
ProductionSystem/
├── Database/
│   └── setup_database.sql       # Script para crear la DB en SQL Server
├── Backend/                     # API .NET 8 (Lógica de negocio y SQL)
│   ├── ProductionAPI.sln
│   └── ProductionAPI/
│       ├── Controllers/         # Endpoint de Resumen y Captura
│       ├── Models/              # Tablas (Usuarios, Maquinas, Produccion)
│       └── ...
└── Frontend/                    # App Móvil React Native (Expo)
    └── ProductionApp/
        ├── Screens/             # Pantallas de Captura y Dashboard
        ├── Services/            # Conexión API
        └── ...
```

## Pasos para Iniciar

### 1. Base de Datos (SQL Server)
*   Abre SQL Server Management Studio (SSMS).
*   Abre y ejecuta el archivo `ProductionSystem/Database/setup_database.sql`.
*   Esto creará la base de datos `ProduccionBonificaciones` y cargará datos de ejemplo.

### 2. Backend (API .NET)
*   Necesitas instalar el **.NET 8 SDK**.
*   Abre una terminal en `ProductionSystem/Backend/ProductionAPI`.
*   Ejecuta: `dotnet run`.
*   La API iniciará en `http://localhost:5xxx`.

### 3. Frontend (App Móvil)
*   Abre otra terminal en `ProductionSystem/Frontend/ProductionApp`.
*   Ejecuta: `npm install` (si no lo has hecho).
*   Ejecuta: `npx expo start`.
*   Escanea el código QR con tu celular (App Expo Go) o presiona `a` para Emulador Android.

### 4. Automatización (Reportes)
*   Sigue la guía detallada en el artefacto [PowerAutomate_Guide.md](file:///C:/Users/juane/.gemini/antigravity/brain/abbeb889-6e78-4067-9399-47679c1fdc2c/PowerAutomate_Guide.md) para configurar el envío automático de PDFs.

## Verificación Realizada
*   [x] Diseño de Base de Datos relacional para soportar Históricos y Parámetros.
*   [x] Lógica de Cálculo de Promedios y Semáforos implementada en el Backend (.NET).
*   [x] Pantallas de UI creadas para Captura Diaria y Tablero de Semáforos.
*   [x] Guía de Automatización para generación de PDF.
