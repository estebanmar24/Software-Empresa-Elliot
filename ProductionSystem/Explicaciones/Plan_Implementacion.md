# Plan de Implementación: Migración Excel a Software (React Native + SQL Server)

Este documento detalla la arquitectura, el modelo de datos y la estrategia para convertir el sistema de "Bonificaciones" basado en Excel a una aplicación moderna.

## 1. Arquitectura del Sistema

El sistema seguirá una arquitectura cliente-servidor clásica con integración de automatización para reportes.

**Componentes:**

1.  **Frontend (Aplicación Móvil/Escritorio):**
    *   **Tecnología:** React Native (con Expo para facilidad de despliegue en Tablets/Android/iOS e incluso Web si se requiere).
    *   **Función:** Interfaz de usuario para captura diaria, visualización de semáforos, gestión de máquinas y usuarios.
2.  **Backend (API REST):**
    *   **Tecnología:** .NET 8 Web API (C#) o Node.js (según preferencia, pero .NET es robusto para SQL Server). *Asumiremos .NET/C# por ser entorno Microsoft empresarial común, pero Node.js es válido.*
    *   **Función:** Contiene toda la lógica de negocio (fórmulas de Excel, validaciones), gestión de seguridad y acceso a datos. Es el "cerebro" que reemplaza las Macros VBA.
3.  **Base de Datos:**
    *   **Tecnología:** SQL Server.
    *   **Función:** Almacenamiento relacional, íntegro y seguro de la producción histórica y parámetros.
4.  **Automatización y Reportes:**
    *   **Tecnología:** Power Automate.
    *   **Función:** Generación de PDFs (Mensuales/Semanales) y distribución por correo.
    *   **Integración:** La API expone un endpoint de "Resumen" que Power Automate consume para poblar una plantilla HTML/Word y convertirla a PDF.

## 2. Arquitectura de Software

### Backend (Lógica de Negocio)
Diseño en capas para separar responsabilidades:
-   **Controllers:** Reciben peticiones HTTP (ej. `POST /api/produccion`, `GET /api/resumen`).
-   **Services:** Implementan la lógica de **Excel** (Cálculo de promedios ignorando ceros, reglas de semáforos, acumulados).
    -   *CalculationService*: Replica fórmulas complejas como `=SI(CONTAR.SI(...))` del Excel.
-   **Repositories:** Acceso a SQL Server (Entity Framework Core o Dapper).

### Frontend (React Native)
-   **Screens:**
    -   `LoginScreen`: Autenticación.
    -   `DailyCaptureScreen`: Replica "Hoja1". Formulario optimizado para entrada rápida de datos.
    -   `MachineParamsScreen`: CRUD de "PARAM_MAQUINAS".
    -   `DashboardScreen`: Replica "RESUMEN" con visualización de semáforos (Rojo/Amarillo/Verde).
-   **State Management:** Context API o Zustand para manejar el estado de la sesión y datos cacheados (listas).

## 3. Modelo de Base de Datos (SQL Server)

Diseño normalizado para eliminar redundancia y mejorar integridad.

### Tablas Principales

**1. Usuarios (Operarios)**
```sql
CREATE TABLE Usuarios (
    Id INT PRIMARY KEY IDENTITY,
    Nombre NVARCHAR(100) NOT NULL,
    Estado BIT DEFAULT 1 -- Activo/Inactivo
);
```

**2. Maquinas (PARAM_MAQUINAS)**
```sql
CREATE TABLE Maquinas (
    Id INT PRIMARY KEY IDENTITY,
    Nombre NVARCHAR(100) NOT NULL UNIQUE, -- Clave natural en Excel
    MetaRendimiento INT NOT NULL,     -- Col B
    MetaDesperdicio DECIMAL(5,4),     -- Col C
    ValorPorTiro DECIMAL(10,2),       -- Col D
    TirosReferencia INT,              -- Col E
    SemaforoMin INT,                  -- Col F
    SemaforoNormal INT,               -- Col G
    SemaforoMax INT                   -- Col H
);
```

**3. ProduccionDiaria (Hoja1 / Histórico)**
Esta tabla consolida la información diaria.
```sql
CREATE TABLE ProduccionDiaria (
    Id BIGINT PRIMARY KEY IDENTITY,
    Fecha DATE NOT NULL,
    UsuarioId INT FOREIGN KEY REFERENCES Usuarios(Id),
    MaquinaId INT FOREIGN KEY REFERENCES Maquinas(Id),
    
    -- Tiempos
    HoraInicio TIME,
    HoraFin TIME,
    HorasOperativas DECIMAL(5,2),      -- Col I
    
    -- Producción
    RendimientoFinal DECIMAL(5,2),     -- Col H
    Cambios INT,                       -- Col J
    TiempoPuestaPunto DECIMAL(5,2),    -- Col K
    TirosDiarios INT,                  -- Parte de Col L
    TirosConEquivalencia INT,          -- Col L (Calculado o almacenado)
    
    -- Cálculos
    TotalHorasProductivas DECIMAL(5,2), -- Col M
    PromedioHoraProductiva DECIMAL(5,2),-- Col N (Valor del día)
    
    -- Económico
    ValorTiroSnapshot DECIMAL(10,2),    -- Col P (Se guarda el valor del momento)
    ValorAPagar DECIMAL(10,2),          -- Col Q
    
    -- Auxiliares (Detalle R, S, T)
    HorasMantenimiento DECIMAL(5,2),
    HorasDescanso DECIMAL(5,2),
    HorasOtrosAux DECIMAL(5,2),
    TotalHorasAuxiliares AS (HorasMantenimiento + HorasDescanso + HorasOtrosAux), -- Col U (Computada)

    -- Tiempos Muertos (Detalle V, W, X)
    TiempoFaltaTrabajo DECIMAL(5,2),
    TiempoReparacion DECIMAL(5,2),
    TiempoOtroMuerto DECIMAL(5,2),
    TotalTiemposMuertos AS (TiempoFaltaTrabajo + TiempoReparacion + TiempoOtroMuerto), -- Col Y (Computada)

    TotalHoras AS (HorasOperativas + TotalHorasAuxiliares + TotalTiemposMuertos), -- Col Z (Aprox)
    
    -- Extras
    ReferenciaOP NVARCHAR(50),          -- Col AA
    Novedades NVARCHAR(MAX),            -- Col AB
    Desperdicio DECIMAL(10,2),          -- Col AE
    DiaLaborado INT DEFAULT 1           -- Col AF
);
```

## 4. Estrategia de Implementación

### Fase 1: Backend & Base de Datos
1.  Crear base de datos SQL Server.
2.  Desarrollar API (Endpoints para guardar `ProduccionDiaria`, obtener `ResumenMensual`).
3.  Implementar lógica de cálculo de "Totales" en el backend (reemplaza `Sub RecalcularTotalesTrabajador`).
    *   *Nota:* A diferencia de Excel, no necesitamos guardar filas de "Totales" en la DB. Los totales se calculan al vuelo o en vistas materializadas con `GROUP BY`.

### Fase 2: Aplicación Móvil (React Native)
1.  Pantalla de captura:
    *   Formulario con *Pickers* para Maquina/Operario.
    *   Validación de tipos de datos.
    *   Cálculo en tiempo real de campos simples (Total Horas = Fin - Inicio).
2.  Pantalla Resumen:
    *   Consume endpoint de API `GET /resumen?mes=X&anio=Y`.
    *   Muestra tabla con colores condicionales (Semáforos) basados en la respuesta JSON.

### Fase 3: Power Automate (Reportes)
1.  Crear flujo programado (Mensual/Semanal).
2.  Acción HTTP: Obtener JSON de API (Datos de resumen).
3.  Acción "Populate Microsoft Word Template" o "Create HTML Table": Formatear datos.
4.  Acción "Convert to PDF".
5.  Acción "Send an Email".

## User Review Required
> [!IMPORTANT]
> **Cálculo de Promedios**: La fórmula Excel `=SI(CONTAR.SI(N4:N34;">0")>0;PROMEDIO.SI(N4:N34;">0");0)` implica que los ceros no cuentan para el promedio. Esto debe replicarse exactamente en el Backend.

> [!NOTE]
> **Autenticación**: ¿Se requiere login con contraseña por operario, o es una terminal compartida donde solo seleccionan su nombre? (Asumiremos selección simple inicialmente para agilidad, usuario "Admin" para parámetros).

## Verification Plan

### Automated Tests
-   **Unit Tests (Backend):** Verificar lógica de cálculo de bonificaciones y semáforos contra casos de prueba del Excel.
-   **Integration Tests:** Flujo completo de guardar producción -> Consultar resumen y verificar que los acumulados coinciden.

### Manual Verification
-   Comparar un mes de datos reales del Excel contra el nuevo sistema.
-   Verificar que los colores de los semáforos en la App coincidan con los del Excel bajo los mismos datos.
