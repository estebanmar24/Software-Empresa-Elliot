# Guía de Despliegue en Producción

Esta guía explica cómo poner el sistema en un servidor para uso real en la empresa.

## Requisitos del Servidor

- Windows Server (o Windows 10/11 Pro)
- SQL Server instalado
- .NET 9 Runtime
- IIS (Internet Information Services)
- Node.js (solo para compilar el frontend)

---

## Paso 1: Base de Datos

1. Abre SQL Server Management Studio
2. Ejecuta el script `Database/install_database.sql`
3. Verifica que se crearon las tablas y los datos iniciales

---

## Paso 2: Backend (API .NET)

### Compilar para producción

```powershell
cd Backend/ProductionAPI
dotnet publish -c Release -o ./publish
```

Esto crea una carpeta `publish` con todos los archivos necesarios.

### Configurar conexión

Edita `publish/appsettings.json` y cambia la cadena de conexión:
```json
"ConnectionStrings": {
    "DefaultConnection": "Server=NOMBRE_SERVIDOR;Database=ProduccionBonificaciones;Trusted_Connection=True;TrustServerCertificate=True;"
}
```

### Opción A: Ejecutar como aplicación

```powershell
cd publish
dotnet ProductionAPI.dll
```

⚠️ Se cierra si cierras la terminal.

### Opción B: Configurar como Servicio de Windows (Recomendado)

1. Descarga [NSSM](https://nssm.cc/download) (Non-Sucking Service Manager)
2. Ejecuta:
```powershell
nssm install ProductionAPI
```
3. Configura:
   - Path: `C:\ruta\publish\ProductionAPI.exe`
   - Startup directory: `C:\ruta\publish`
4. Inicia el servicio:
```powershell
nssm start ProductionAPI
```

El servicio se inicia automáticamente cuando el servidor arranca.

### Opción C: Hostear en IIS

1. Instala el módulo ASP.NET Core para IIS
2. Crea un nuevo sitio en IIS apuntando a la carpeta `publish`
3. Configura el puerto (ej: 5000)

---

## Paso 3: Frontend (App Web)

### Compilar para producción

```powershell
cd Frontend/ProductionApp
npm install
npx expo export:web
```

Esto crea una carpeta `dist` con archivos HTML, CSS y JavaScript.

### Servir los archivos

**Opción A: Usar IIS**
1. Crea un nuevo sitio en IIS
2. Apunta a la carpeta `dist`
3. Configura el puerto (ej: 80 o 3000)

**Opción B: Usar el propio .NET**
Puedes configurar la API para servir también los archivos estáticos del frontend.

---

## Paso 4: Configurar acceso en la red

### Por IP interna
Los usuarios acceden escribiendo en el navegador:
```
http://192.168.1.100:3000
```
(Reemplaza con la IP real del servidor)

### Por nombre (DNS interno)
Configura tu servidor DNS para que:
```
http://produccion.empresa.local
```
apunte a la IP del servidor.

---

## Paso 5: Firewall

Asegúrate de abrir los puertos necesarios en el firewall:
- Puerto 5000 (API)
- Puerto 80 o 3000 (Frontend)
- Puerto 1433 (SQL Server, si es remoto)

---

## Verificación

1. Abre el navegador desde otra PC en la red
2. Escribe la IP del servidor con el puerto del frontend
3. Verifica que carga la aplicación
4. Prueba crear un registro de producción

---

## Mantenimiento

- **Actualizar código**: Repite los pasos de compilación y reemplaza los archivos
- **Respaldos**: Configura backups automáticos de SQL Server
- **Logs**: Revisa los logs del servicio si hay problemas

---

## Solución de problemas

| Problema | Solución |
|----------|----------|
| No conecta a la BD | Verificar cadena de conexión y que SQL Server esté corriendo |
| No carga la app | Verificar que el frontend esté sirviendo en el puerto correcto |
| Error de CORS | Verificar que la API permita conexiones del frontend |
| Servicio no inicia | Revisar logs de Windows Event Viewer |
