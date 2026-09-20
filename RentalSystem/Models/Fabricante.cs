using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace RentalSystem.Models
{
    public class Fabricante
    {
        [Key]
        public int Id { get; set; } 

        [Required(ErrorMessage = "O nome do fabricante é obrigatório.")]
        [StringLength(100)]
        public string Nome { get; set; }

       
        public ICollection<Veiculo> Veiculos { get; set; }
    }
}