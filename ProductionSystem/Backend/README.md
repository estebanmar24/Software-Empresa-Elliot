# Backend API

API REST para el sistema de bonificaciones de Alleph.

## ¿Qué necesitas?

- **.NET 9 SDK** - [Descárgalo aquí](https://dotnet.microsoft.com/download/dotnet/9.0)
- **SQL Server** corriendo (local o remoto)

## Configuración

1. Ejecuta el script `Database/install_database.sql` en SQL Server Management Studio
2. Copia `appsettings.Development.json.example` a `appsettings.Development.json`
3. Edita la cadena de conexión con tu servidor

## Cómo ejecutar

```powershell
cd ProductionAPI
dotnet restore
dotnet run
```

La API estará disponible en `http://localhost:5000`

Para ver la documentación interactiva, abre `http://localhost:5000/swagger`

## Carpetas

- **Controllers/** - Endpoints de la API
- **Models/** - Clases de las tablas
- **Data/** - Conexión a la base de datos
- **DTOs/** - Objetos para respuestas complejas
