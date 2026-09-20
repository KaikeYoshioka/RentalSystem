using Microsoft.EntityFrameworkCore;
using RentalSystem.Models;

namespace RentalSystem.Data
{
    public class ApplicationContext : DbContext
    {
        public ApplicationContext(DbContextOptions<ApplicationContext> options) : base(options)
        {
        }

   
        public DbSet<Fabricante> Fabricantes { get; set; }
        public DbSet<Veiculo> Veiculos { get; set; }
        public DbSet<Cliente> Clientes { get; set; }
        public DbSet<Aluguel> Alugueis { get; set; }
        public DbSet<Pagamento> Pagamentos { get; set; }

    

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            
            modelBuilder.Entity<Cliente>()
                .HasIndex(c => c.Cpf)
                .IsUnique();

            
            modelBuilder.Entity<Aluguel>().Property(a => a.ValorDiaria).HasColumnType("decimal(18,2)");
            modelBuilder.Entity<Aluguel>().Property(a => a.ValorTotal).HasColumnType("decimal(18,2)");
            modelBuilder.Entity<Pagamento>().Property(p => p.ValorPago).HasColumnType("decimal(18,2)");
        }
    }
}