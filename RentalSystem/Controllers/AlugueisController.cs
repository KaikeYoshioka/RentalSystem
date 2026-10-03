using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RentalSystem.Data;
using RentalSystem.Models;

namespace RentalSystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AlugueisController : ControllerBase
    {
        private readonly ApplicationContext _context;

        public AlugueisController(ApplicationContext context) => _context = context;

        [HttpPost]
        public async Task<IActionResult> PostAluguel([FromBody] Aluguel aluguel)
        {
            try
            {
                if (!ModelState.IsValid) return BadRequest(ModelState);
                if (!await _context.Clientes.AnyAsync(c => c.Id == aluguel.ClienteId)) return BadRequest("Cliente não existe.");
                if (!await _context.Veiculos.AnyAsync(v => v.Id == aluguel.VeiculoId)) return BadRequest("Veículo não existe.");
                _context.Alugueis.Add(aluguel);
                await _context.SaveChangesAsync();
                return Ok(aluguel);
            }
            catch (Exception ex) { return StatusCode(500, $"Erro interno: {ex.Message}"); }
        }

        [HttpGet]
        public async Task<IActionResult> GetAlugueis()
        {
            try
            {
                var alugueis = await _context.Alugueis.ToListAsync();
                return Ok(alugueis);
            }
            catch (Exception ex) { return StatusCode(500, $"Erro interno: {ex.Message}"); }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetAluguel(int id)
        {
            try
            {
                var aluguel = await _context.Alugueis.FindAsync(id);
                if (aluguel == null) return NotFound("Aluguel não encontrado.");
                return Ok(aluguel);
            }
            catch (Exception ex) { return StatusCode(500, $"Erro interno: {ex.Message}"); }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutAluguel(int id, [FromBody] Aluguel aluguel)
        {
            if (id != aluguel.Id) return BadRequest("IDs divergentes.");
            try
            {
                if (!await _context.Alugueis.AnyAsync(a => a.Id == id)) return NotFound("Aluguel não encontrado.");
                if (!await _context.Clientes.AnyAsync(c => c.Id == aluguel.ClienteId)) return BadRequest("Cliente não existe.");
                if (!await _context.Veiculos.AnyAsync(v => v.Id == aluguel.VeiculoId)) return BadRequest("Veículo não existe.");
                _context.Entry(aluguel).State = EntityState.Modified;
                await _context.SaveChangesAsync();
                return Ok("Aluguel atualizado!");
            }
            catch (Exception ex) { return StatusCode(500, $"Erro interno: {ex.Message}"); }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteAluguel(int id)
        {
            try
            {
                var aluguel = await _context.Alugueis.FindAsync(id);
                if (aluguel == null) return NotFound("Aluguel não encontrado.");
                _context.Alugueis.Remove(aluguel);
                await _context.SaveChangesAsync();
                return Ok("Aluguel removido!");
            }
            catch (Exception ex) { return StatusCode(500, $"Erro interno: {ex.Message}"); }
        }
    }
}
