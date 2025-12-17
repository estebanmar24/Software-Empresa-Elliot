-- =============================================
-- SCRIPT COMPLETO DE INSTALACIÓN
-- Sistema de Producción y Bonificaciones - Alleph
-- Ejecutar en SQL Server Management Studio (SSMS)
-- =============================================

USE master;
GO

-- Crear BD si no existe
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'ProduccionBonificaciones')
BEGIN
    CREATE DATABASE ProduccionBonificaciones;
END
GO

USE ProduccionBonificaciones;
GO

-- =============================================
-- BORRAR TABLAS SI EXISTEN (Para empezar limpio)
-- =============================================
IF OBJECT_ID('ProduccionDiaria', 'U') IS NOT NULL DROP TABLE ProduccionDiaria;
IF OBJECT_ID('Maquinas', 'U') IS NOT NULL DROP TABLE Maquinas;
IF OBJECT_ID('Usuarios', 'U') IS NOT NULL DROP TABLE Usuarios;
GO

-- =============================================
-- 1. TABLA USUARIOS (Operarios)
-- =============================================
CREATE TABLE Usuarios (
    Id INT PRIMARY KEY IDENTITY(1,1),
    Nombre NVARCHAR(100) NOT NULL,
    Estado BIT DEFAULT 1,
    FechaCreacion DATETIME DEFAULT GETDATE()
);
GO

-- =============================================
-- 2. TABLA MAQUINAS (Parámetros)
-- =============================================
CREATE TABLE Maquinas (
    Id INT PRIMARY KEY IDENTITY(1,1),
    Nombre NVARCHAR(100) NOT NULL UNIQUE,
    MetaRendimiento INT NOT NULL,
    MetaDesperdicio DECIMAL(5,4) NOT NULL,
    ValorPorTiro DECIMAL(10,2) NOT NULL,
    TirosReferencia INT NOT NULL,
    SemaforoMin INT NOT NULL,
    SemaforoNormal INT NOT NULL,
    SemaforoMax INT NOT NULL,
    Activa BIT DEFAULT 1
);
GO

-- =============================================
-- 3. TABLA PRODUCCION DIARIA (Registros)
-- =============================================
CREATE TABLE ProduccionDiaria (
    Id BIGINT PRIMARY KEY IDENTITY(1,1),
    Fecha DATE NOT NULL,
    UsuarioId INT NOT NULL,
    MaquinaId INT NOT NULL,
    
    -- Tiempos
    HoraInicio TIME(0),
    HoraFin TIME(0),
    HorasOperativas DECIMAL(10,2) DEFAULT 0,
    
    -- Producción
    RendimientoFinal DECIMAL(10,2) DEFAULT 0,
    Cambios INT DEFAULT 0,
    TiempoPuestaPunto DECIMAL(10,2) DEFAULT 0,
    TirosDiarios INT DEFAULT 0,
    
    -- Cálculos Productivos
    TotalHorasProductivas DECIMAL(10,2) DEFAULT 0,
    PromedioHoraProductiva DECIMAL(10,2) DEFAULT 0,
    
    -- Económicos
    ValorTiroSnapshot DECIMAL(10,2) DEFAULT 0,
    ValorAPagar DECIMAL(10,2) DEFAULT 0,
    
    -- Auxiliares
    HorasMantenimiento DECIMAL(10,2) DEFAULT 0,
    HorasDescanso DECIMAL(10,2) DEFAULT 0,
    HorasOtrosAux DECIMAL(10,2) DEFAULT 0,
    TotalHorasAuxiliares DECIMAL(10,2) DEFAULT 0,
    
    -- Tiempos Muertos
    TiempoFaltaTrabajo DECIMAL(10,2) DEFAULT 0,
    TiempoReparacion DECIMAL(10,2) DEFAULT 0,
    TiempoOtroMuerto DECIMAL(10,2) DEFAULT 0,
    TotalTiemposMuertos DECIMAL(10,2) DEFAULT 0,
    
    -- TOTAL GLOBAL
    TotalHoras DECIMAL(10,2) DEFAULT 0,
    
    -- Extras
    ReferenciaOP NVARCHAR(50),
    Novedades NVARCHAR(MAX),
    Desperdicio DECIMAL(10,2) DEFAULT 0,
    DiaLaborado INT DEFAULT 1,
    
    CONSTRAINT FK_Produccion_Usuario FOREIGN KEY (UsuarioId) REFERENCES Usuarios(Id),
    CONSTRAINT FK_Produccion_Maquina FOREIGN KEY (MaquinaId) REFERENCES Maquinas(Id)
);
GO

-- Índices para búsquedas rápidas
CREATE INDEX IX_Produccion_Fecha ON ProduccionDiaria(Fecha);
CREATE INDEX IX_Produccion_Usuario ON ProduccionDiaria(UsuarioId);
CREATE INDEX IX_Produccion_Maquina ON ProduccionDiaria(MaquinaId);
GO

-- =============================================
-- DATOS INICIALES - OPERARIOS REALES
-- =============================================
INSERT INTO Usuarios (Nombre, Estado) VALUES 
('Blandon Moreno Jose Lizandro', 1),
('Cruz Pinto Alberto', 1),
('Enrique Muñoz Hector Hilde', 1),
('Escobar Cardona John Fredy', 1),
('Martinez Osorno Karen Lizeth', 1),
('Millan Salazar Magaly', 1),
('Moreno Mendez Angel Julio', 1),
('Moreno Urrea Marlene', 1),
('Motta Talaga Leidy Jhoanna', 1),
('Obando Higuita Jose Luis', 1),
('Ramirez Romero Andres Mauricio', 1),
('Sarmiento Rincon Yhan Otoniel', 1),
('Velez Arana Robert De Jesus', 1),
('Perdomo Rincon Gustavo Adolfo', 1),
('Moriano Chiguas Yurde Arley', 1),
('Bedoya Maria Fernanda', 1),
('Morales Grueso Claudia Patricia', 1),
('Gomez Ruiz William Hernan', 1),
('Rodriguez Castaño Maria Alejandra', 1),
('Rojas Collazos Joan Mauricio', 1),
('Riascos Castillo Andres Felipe', 1),
('Roldan Barona Erik Esteban', 1),
('Renteria Mejia Nestor Alfonso', 1),
('Mina Sinisterra Jhon Jairo', 1),
('Valencia Mirquez Nicol', 1),
('Uran Quintero Yohao Alexander', 1),
('Preciado Rivas Johan Alexander', 1),
('Jose Fernando Ruiz', 1);
GO

-- =============================================
-- DATOS INICIALES - MÁQUINAS REALES
-- =============================================
INSERT INTO Maquinas (Nombre, MetaRendimiento, MetaDesperdicio, ValorPorTiro, TirosReferencia, SemaforoMin, SemaforoNormal, SemaforoMax, Activa) VALUES
('CONVERTIDORA 1A', 15000, 0.25, 5, 1250, 0, 0, 0, 1),
('CONVERTIDORA 1B', 15000, 0.25, 5, 1250, 0, 0, 0, 1),
('Guillotina 2A polar132', 30000, 0.25, 2, 1250, 0, 0, 0, 1),
('Guillotina 2B org- Perfecta 107', 30000, 0.25, 2, 1250, 0, 0, 0, 1),
('3 Sord Z', 15000, 0.25, 5, 1250, 0, 0, 0, 1),
('4 Sord Z', 15000, 0.25, 5, 2000, 0, 0, 0, 1),
('5 Sord Z', 15000, 0.25, 5, 1250, 0, 0, 0, 1),
('6 SpeedMaster', 15000, 0.25, 5, 3000, 0, 0, 0, 1),
('7 SpeedMaster', 22500, 0.25, 5, 3000, 0, 0, 0, 1),
('8A Troqueladora de Papel', 7500, 0.25, 10, 1000, 0, 0, 0, 1),
('8B Troqueladora de Papel', 7500, 0.25, 10, 1000, 0, 0, 0, 1),
('8C Estampadora', 6000, 0.25, 12, 1500, 0, 0, 0, 1),
('9 Troqueladora Rollo', 15000, 0.25, 5, 1250, 0, 0, 0, 1),
('10A Colaminadora Carton', 7500, 0.07, 10, 500, 0, 0, 0, 1),
('10B Colaminadora Carton', 6000, 0.03, 12, 400, 0, 0, 0, 1),
('11 Laminadora BOPP', 7500, 0.25, 10, 1000, 0, 0, 0, 1),
('16 Barnizadora UV', 7500, 0.25, 10, 1250, 0, 0, 0, 1),
('13A Corrugadora FLTE', 2250, 0.25, 40, 2000, 0, 0, 0, 1),
('13b Corrugadora FLTB', 2250, 0.25, 35, 1250, 0, 0, 0, 1),
('14 Pegadora de Cajas', 75000, 0.07, 1, 40000, 0, 0, 0, 1),
('15 Troqueladora Kirby', 1500, 0.25, 40, 1250, 0, 0, 0, 1),
('12 Maquina de Cordon', 2100, 0.25, 10, 2000, 0, 0, 0, 1),
('12 Cortadora de Manijas', 9000, 0.25, 5, 2000, 0, 0, 0, 1);
GO

-- =============================================
-- CONFIRMACIÓN
-- =============================================
PRINT '¡Base de datos creada correctamente!';
PRINT 'Usuarios insertados: ' + CAST((SELECT COUNT(*) FROM Usuarios) AS VARCHAR);
PRINT 'Máquinas insertadas: ' + CAST((SELECT COUNT(*) FROM Maquinas) AS VARCHAR);
GO
