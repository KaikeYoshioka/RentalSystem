using System;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using System.ComponentModel.DataAnnotations.Schema;

namespace RentalSystem.Models
{
    public class Pagamento
    {
        [Key]
        public int Id { get; set; } 

        [Required]
        [StringLength(50)]
        public string MetodoPagamento { get; set; } = string.Empty; 

        [Required]
        public decimal ValorPago { get; set; }

        [Required]
        public DateTime DataPagamento { get; set; }

        
        [Required]
        public int AluguelId { get; set; }

        [ForeignKey("AluguelId")]
        [JsonIgnore]
        public Aluguel? Aluguel { get; set; }
    }
}