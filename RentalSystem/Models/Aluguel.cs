using RentalSystem.Models;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RentalSystem.Models
{
    public class Aluguel
    {
        [Key]
        public int Id { get; set; } 

        [Required]
        public DateTime DataInicio { get; set; }

        [Required]
        public DateTime DataFimPrevista { get; set; }

    
        public DateTime? DataDevolucao { get; set; }

        [Required]
        public int QuilometragemInicial { get; set; }

        public int? QuilometragemFinal { get; set; }

        [Required]
        public decimal ValorDiaria { get; set; }

        public decimal? ValorTotal { get; set; }

        
        [Required]
        public int ClienteId { get; set; }
        [ForeignKey("ClienteId")]
        public Cliente Cliente { get; set; }

        [Required]
        public int VeiculoId { get; set; }
        [ForeignKey("VeiculoId")]
        public Veiculo Veiculo { get; set; }

        public ICollection<Pagamento> Pagamentos { get; set; }
    }
}