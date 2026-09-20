using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RentalSystem.Models
{
    public class Veiculo
    {
        [Key]
        public int Id { get; set; } // Chave Primária

        [Required]
        [StringLength(100)]
        public string Modelo { get; set; }

        [Required]
        public int AnoFabricacao { get; set; }

        [Required]
        public int Quilometragem { get; set; }

        // Chave Estrangeira
        [Required]
        public int FabricanteId { get; set; }

        [ForeignKey("FabricanteId")]
        public Fabricante Fabricante { get; set; } // Navegação

        public ICollection<Aluguel> Alugueis { get; set; }
    }
}