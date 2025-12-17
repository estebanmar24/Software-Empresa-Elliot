namespace ProductionAPI.DTOs
{
    public class ResumenMensualDto
    {
        public List<ResumenOperarioDto> ResumenOperarios { get; set; } = new();
        public List<ResumenMaquinaDto> ResumenMaquinas { get; set; } = new();
        public List<ResumenDiarioDto> TendenciaDiaria { get; set; } = new();
    }

    public class ResumenOperarioDto
    {
        public int UsuarioId { get; set; }
        public int MaquinaId { get; set; }
        public string Operario { get; set; } = string.Empty;
        public string Maquina { get; set; } = string.Empty;
        public decimal TotalTiros { get; set; }
        public decimal TotalHorasProductivas { get; set; }
        public decimal PromedioHoraProductiva { get; set; } // Ojo: promedio especial
        public decimal TotalHoras { get; set; }
        public decimal ValorAPagar { get; set; }
        
        // New fields for reporting
        public int DiasLaborados { get; set; }
        public decimal MetaBonificacion { get; set; } // Tiros objetivo para bonificar (ej 75%)
        public decimal Eficiencia { get; set; } // Porcentaje real

        public string SemaforoColor { get; set; } = "Gris"; // Rojo, Amarillo, Verde
    }

    public class ResumenMaquinaDto
    {
        public int MaquinaId { get; set; }
        public string Maquina { get; set; } = string.Empty;
        public decimal TirosTotales { get; set; }
        public decimal RendimientoEsperado { get; set; }
        public decimal PorcentajeRendimiento { get; set; }
        public string SemaforoColor { get; set; } = "Gris";
        public decimal TotalTiemposMuertos { get; set; } 
        public decimal TotalTiempoReparacion { get; set; }
        public decimal TotalTiempoFaltaTrabajo { get; set; }
        public decimal TotalTiempoOtro { get; set; }
    }

    public class ResumenDiarioDto
    {
        public DateTime Fecha { get; set; }
        public decimal Tiros { get; set; }
        public decimal Desperdicio { get; set; }
    }
}
