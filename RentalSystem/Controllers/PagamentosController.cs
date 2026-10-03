using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RentalSystem.Data;
using RentalSystem.Models;

namespace RentalSystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PagamentosController : ControllerBase
    {
        private readonly ApplicationContext _context;

        public PagamentosController(ApplicationContext context) => _context = context;

        [HttpPost]
        public async Task<IActionResult> PostPagamento([FromBody] Pagamento pagamento)
        {
            try
            {
                if (!ModelState.IsValid) return BadRequest(ModelState);
                if (!await _context.Alugueis.AnyAsync(a => a.Id == pagamento.AluguelId)) return BadRequest("Aluguel não existe.");
                _context.Pagamentos.Add(pagamento);
                await _context.SaveChangesAsync();
                return Ok(pagamento);
            }
            catch (Exception ex) { return StatusCode(500, $"Erro interno: {ex.Message}"); }
        }

        [HttpGet]
        public async Task<IActionResult> GetPagamentos()
        {
            try
            {
                var pagamentos = await _context.Pagamentos.ToListAsync();
                return Ok(pagamentos);
            }
            catch (Exception ex) { return StatusCode(500, $"Erro interno: {ex.Message}"); }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetPagamento(int id)
        {
            try
            {
                var pagamento = await _context.Pagamentos.FindAsync(id);
                if (pagamento == null) return NotFound("Pagamento não encontrado.");
                return Ok(pagamento);
            }
            catch (Exception ex) { return StatusCode(500, $"Erro interno: {ex.Message}"); }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutPagamento(int id, [FromBody] Pagamento pagamento)
        {
            if (id != pagamento.Id) return BadRequest("IDs divergentes.");
            try
            {
                if (!await _context.Pagamentos.AnyAsync(p => p.Id == id)) return NotFound("Pagamento não encontrado.");
                if (!await _context.Alugueis.AnyAsync(a => a.Id == pagamento.AluguelId)) return BadRequest("Aluguel não existe.");
                _context.Entry(pagamento).State = EntityState.Modified;
                await _context.SaveChangesAsync();
                return Ok("Pagamento atualizado!");
            }
            catch (Exception ex) { return StatusCode(500, $"Erro interno: {ex.Message}"); }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletePagamento(int id)
        {
            try
            {
                var pagamento = await _context.Pagamentos.FindAsync(id);
                if (pagamento == null) return NotFound("Pagamento não encontrado.");
                _context.Pagamentos.Remove(pagamento);
                await _context.SaveChangesAsync();
                return Ok("Pagamento removido!");
            }
            catch (Exception ex) { return StatusCode(500, $"Erro interno: {ex.Message}"); }
        }
    }
}
