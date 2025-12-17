using Microsoft.EntityFrameworkCore;
using ProductionAPI.Models;

namespace ProductionAPI.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<Usuario> Usuarios { get; set; }
        public DbSet<Maquina> Maquinas { get; set; }
        public DbSet<ProduccionDiaria> ProduccionDiaria { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            
            // Configurar precisión de decimales globalmente si se desea, o por propiedad
            modelBuilder.Entity<Maquina>()
                .Property(m => m.ValorPorTiro)
                .HasColumnType("decimal(10,2)");

            modelBuilder.Entity<ProduccionDiaria>()
                .Property(p => p.ValorAPagar)
                .HasColumnType("decimal(10,2)");
        }
    }
}
