using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ProductionAPI.Models
{
    public class ProduccionDiaria
    {
        [Key]
        public long Id { get; set; }
        
        public DateOnly Fecha { get; set; }
        
        public int UsuarioId { get; set; }
        [ForeignKey("UsuarioId")]
        public Usuario? Usuario { get; set; }
        
        public int MaquinaId { get; set; }
        [ForeignKey("MaquinaId")]
        public Maquina? Maquina { get; set; }
        
        public TimeOnly? HoraInicio { get; set; }
        public TimeOnly? HoraFin { get; set; }
        
        [Column(TypeName = "decimal(10,2)")]
        public decimal HorasOperativas { get; set; }
        
        [Column(TypeName = "decimal(10,2)")]
        public decimal RendimientoFinal { get; set; }
        
        public int Cambios { get; set; }
        
        [Column(TypeName = "decimal(10,2)")]
        public decimal TiempoPuestaPunto { get; set; }
        
        public int TirosDiarios { get; set; }
        
        // Computed in code or DB, but here as property for retrieval
        public int TirosConEquivalencia => TirosDiarios; // Ajustar lógica si cambios suman tiros

        [Column(TypeName = "decimal(10,2)")]
        public decimal TotalHorasProductivas { get; set; }
        
        [Column(TypeName = "decimal(10,2)")]
        public decimal PromedioHoraProductiva { get; set; }

        [Column(TypeName = "decimal(10,2)")]
        public decimal ValorTiroSnapshot { get; set; }
        
        [Column(TypeName = "decimal(10,2)")]
        public decimal ValorAPagar { get; set; }

        // Auxiliares
        [Column(TypeName = "decimal(10,2)")]
        public decimal HorasMantenimiento { get; set; }
        
        [Column(TypeName = "decimal(10,2)")]
        public decimal HorasDescanso { get; set; }
        
        [Column(TypeName = "decimal(10,2)")]
        public decimal HorasOtrosAux { get; set; }

        [Column(TypeName = "decimal(10,2)")]
        public decimal TotalHorasAuxiliares { get; set; } // Cambiado de computado a persistente

        // Tiempos Muertos
        [Column(TypeName = "decimal(10,2)")]
        public decimal TiempoFaltaTrabajo { get; set; }
        [Column(TypeName = "decimal(10,2)")]
        public decimal TiempoReparacion { get; set; }
        [Column(TypeName = "decimal(10,2)")]
        public decimal TiempoOtroMuerto { get; set; }

        [Column(TypeName = "decimal(10,2)")]
        public decimal TotalTiemposMuertos { get; set; } // Cambiado de computado a persistente

        [Column(TypeName = "decimal(10,2)")]
        public decimal TotalHoras { get; set; } // Cambiado de computado a persistente

        public string? ReferenciaOP { get; set; }
        public string? Novedades { get; set; }
        
        [Column(TypeName = "decimal(10,2)")]
        public decimal Desperdicio { get; set; }
        
        public int DiaLaborado { get; set; } = 1;
    }
}
