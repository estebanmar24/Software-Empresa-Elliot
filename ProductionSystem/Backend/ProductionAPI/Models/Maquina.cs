using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ProductionAPI.Models
{
    public class Maquina
    {
        [Key]
        public int Id { get; set; }
        
        [Required]
        public string Nombre { get; set; } = string.Empty;

        public int MetaRendimiento { get; set; }     // Tiros diarios objetivo
        
        [Column(TypeName = "decimal(5,4)")]
        public decimal MetaDesperdicio { get; set; } // Porcentaje
        
        [Column(TypeName = "decimal(10,2)")]
        public decimal ValorPorTiro { get; set; }
        
        public int TirosReferencia { get; set; }
        public int SemaforoMin { get; set; }
        public int SemaforoNormal { get; set; }
        public int SemaforoMax { get; set; }
        public bool Activa { get; set; } = true;
    }
}
