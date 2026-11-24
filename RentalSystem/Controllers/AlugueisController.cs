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

        // Filtros: clienteId, veiculoId, status ("aberto" ou "devolvido") e período de início (dataInicioDe / dataInicioAte)
        [HttpGet]
        public async Task<IActionResult> GetAlugueis(
            [FromQuery] int? clienteId,
            [FromQuery] int? veiculoId,
            [FromQuery] string? status,
            [FromQuery] DateTime? dataInicioDe,
            [FromQuery] DateTime? dataInicioAte)
        {
            try
            {
                var query = _context.Alugueis.AsQueryable();
                if (clienteId.HasValue) query = query.Where(a => a.ClienteId == clienteId.Value);
                if (veiculoId.HasValue) query = query.Where(a => a.VeiculoId == veiculoId.Value);
                if (string.Equals(status, "aberto", StringComparison.OrdinalIgnoreCase))
                    query = query.Where(a => a.DataDevolucao == null);
                else if (string.Equals(status, "devolvido", StringComparison.OrdinalIgnoreCase))
                    query = query.Where(a => a.DataDevolucao != null);
                if (dataInicioDe.HasValue) query = query.Where(a => a.DataInicio >= dataInicioDe.Value);
                if (dataInicioAte.HasValue)
                {
                    var limite = dataInicioAte.Value.Date.AddDays(1);
                    query = query.Where(a => a.DataInicio < limite);
                }

                var alugueis = await query.OrderByDescending(a => a.DataInicio).ToListAsync();
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
                if (await _context.Pagamentos.AnyAsync(p => p.AluguelId == id))
                    return Conflict("Não é possível excluir: o aluguel possui pagamentos registrados.");
                _context.Alugueis.Remove(aluguel);
                await _context.SaveChangesAsync();
                return Ok("Aluguel removido!");
            }
            catch (Exception ex) { return StatusCode(500, $"Erro interno: {ex.Message}"); }
        }
    }
}
