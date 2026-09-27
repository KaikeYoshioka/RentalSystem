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
                _context.Alugueis.Add(aluguel);
                await _context.SaveChangesAsync();
                return CreatedAtAction(nameof(GetAluguel), new { id = aluguel.Id }, aluguel);
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
                _context.Entry(aluguel).State = EntityState.Modified;
                await _context.SaveChangesAsync();
                return Ok("Aluguel atualizado!");
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!_context.Alugueis.Any(e => e.Id == id)) return NotFound();
                throw;
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