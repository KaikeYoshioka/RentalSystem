using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace RentalSystem.Models
{
    public class Cliente
    {
        [Key]
        public int Id { get; set; } 

        [Required]
        [StringLength(150)]
        public string Nome { get; set; }

        [Required]
        [StringLength(14)] // 000.000.000-00
        public string Cpf { get; set; }

        [Required]
        [EmailAddress]
        [StringLength(150)]
        public string Email { get; set; }

        public ICollection<Aluguel> Alugueis { get; set; }
    }
}