# Sistema de Producción y Bonificaciones

Sistema para gestionar la producción diaria y calcular bonificaciones de operarios.

## ¿Qué hace?

- Registra la producción diaria de cada operario por máquina
- Calcula bonificaciones basadas en tiros y rendimiento
- Muestra indicadores visuales (semáforos) de desempeño
- Genera reportes mensuales

## Tecnologías

| Parte | Tecnología |
|-------|------------|
| API | .NET 9 |
| App | React Native (Expo) |
| Base de datos | SQL Server |

## Estructura

```
├── Backend/ProductionAPI/   → API REST
├── Frontend/ProductionApp/  → Aplicación móvil/web
├── Database/                → Script de instalación SQL
└── Explicaciones/           → Documentación técnica
```

## Inicio rápido

1. **Base de datos:** Ejecuta `Database/install_database.sql` en SQL Server
2. **Backend:** `cd Backend/ProductionAPI && dotnet run`
3. **Frontend:** `cd Frontend/ProductionApp && npm install && npx expo start`

## Pantallas

- **Captura Mensual** - Grilla para registrar producción diaria
- **Tablero** - Dashboard con semáforos de rendimiento
- **Historial** - Consulta de registros pasados
- **Máquinas** - Configuración de parámetros
- **Operarios** - Gestión de la lista de empleados

---

**© 2024 Alleph** - Todos los derechos reservados.  
Ver [LICENSE](LICENSE) y [THIRD_PARTY_LICENSES.md](THIRD_PARTY_LICENSES.md)
