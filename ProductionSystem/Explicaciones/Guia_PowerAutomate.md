# Guía de Automatización con Power Automate

Esta guía describe cómo configurar el flujo de nube para generar y enviar reportes PDF mensuales automáticamente.

## Requisitos
1.  **Cuenta de Microsoft 365** (con acceso a Power Automate).
2.  **OneDrive for Business** o **SharePoint** (para guardar temporalmente el PDF).
3.  **API Pública**: Tu API .NET debe ser accesible desde internet (puedes usar **ngrok** para pruebas locales: `ngrok http 5000`).

## Pasos para Crear el Flujo

### 1. Crear Nuevo Flujo Programado
*   Ve a [make.powerautomate.com](https://make.powerautomate.com).
*   Selecciona "Nuevo flujo" -> "Flujo de nube programado".
*   Nombre: `Reporte Mensual Bonificaciones`.
*   Repetir cada: `1 Mes`.

### 2. Definir Variables de Fecha
Agrega acciones "Inicializar variable" para calcular el mes anterior (el reporte se corre el dia 1 del mes siguiente).
*   `MesReporte`: `addDays(utcNow(), -1, 'MM')`
*   `AnioReporte`: `addDays(utcNow(), -1, 'yyyy')`

### 3. Obtener Datos de la API
Agrega una acción **HTTP**.
*   **Método**: GET
*   **URI**: `https://tu-dominio-api.com/api/produccion/resumen?mes=@{variables('MesReporte')}&anio=@{variables('AnioReporte')}`
*   Esto devolverá el JSON con los datos de operarios y máquinas.

### 4. Analizar JSON (Parse JSON)
Agrega la acción **Parse JSON**.
*   **Contenido**: Cuerpo (Body) de la acción HTTP anterior.
*   **Esquema**: Copia y pega un ejemplo de respuesta de tu API (puedes ejecutarla localmente y copiar el JSON).

### 5. Generar Documento
Tienes dos opciones:

**Opción A: HTML Simple (Más fácil)**
1.  Agrega la acción **Crear tabla HTML**.
2.  Usa los datos de `ResumenOperarios` del paso Parse JSON.
3.  Personaliza las columnas (Operario, Máquina, Tiros, Semáforo).
4.  Agrega una acción **Crear archivo (OneDrive)**.
    *   Nombre: `Reporte.html`
    *   Contenido: Pega la salida de la tabla HTML.

**Opción B: Plantilla de Word (Más profesional - Premium)**
1.  Sube una plantilla Word a OneDrive con "Controles de contenido" para los campos.
2.  Usa la acción **Populate a Microsoft Word template**.

### 6. Convertir a PDF
Agrega la acción **Convertir archivo** (OneDrive/SharePoint).
*   Selecciona el archivo creado en el paso anterior.
*   Formato objetivo: PDF.

### 7. Enviar Correo
Agrega la acción **Enviar correo electrónico (V2)**.
*   **A**: `jefe_planta@empresa.com`
*   **Asunto**: `Reporte Mensual de Producción - @{variables('MesReporte')}/@{variables('AnioReporte')}`
*   **Adjuntos**:
    *   Nombre: `Reporte_Mensual.pdf`
    *   Contenido: Contenido del archivo convertido a PDF.

## Consideraciones
*   **Semáforos en PDF**: Si usas HTML, puedes inyectar estilos CSS en la tabla (`<div style="background-color: red">...</div>`) basado en el campo `SemaforoColor` que viene de la API.
