using System.ComponentModel.DataAnnotations;

namespace ProductionAPI.Models
{
    public class Usuario
    {
        [Key]
        public int Id { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public bool Estado { get; set; } = true;
    }
}
