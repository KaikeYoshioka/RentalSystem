using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace RentalSystem.Models
{
    public class Cliente
    {
        [Key]
        public int Id { get; set; } 

        [Required]
        [StringLength(150)]
        public string Nome { get; set; } = string.Empty;

        [Required]
        [StringLength(14)] // 000.000.000-00
        public string Cpf { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        [StringLength(150)]
        public string Email { get; set; } = string.Empty;

        [JsonIgnore]
        public ICollection<Aluguel>? Alugueis { get; set; }
    }
}