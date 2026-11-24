using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RentalSystem.Data;
using RentalSystem.Models;

namespace RentalSystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class VeiculosController : ControllerBase
    {
        private readonly ApplicationContext _context;

        public VeiculosController(ApplicationContext context) => _context = context;

        [HttpPost]
        public async Task<IActionResult> PostVeiculo([FromBody] Veiculo veiculo)
        {
            try
            {
                if (!ModelState.IsValid) return BadRequest(ModelState);
                if (!await _context.Fabricantes.AnyAsync(f => f.Id == veiculo.FabricanteId)) return BadRequest("Fabricante não existe.");
                _context.Veiculos.Add(veiculo);
                await _context.SaveChangesAsync();
                return Ok(veiculo);
            }
            catch (Exception ex) { return StatusCode(500, $"Erro interno: {ex.Message}"); }
        }

        // Filtros: modelo (contém), fabricanteId, anoMin, anoMax e kmMax
        [HttpGet]
        public async Task<IActionResult> GetVeiculos(
            [FromQuery] string? modelo,
            [FromQuery] int? fabricanteId,
            [FromQuery] int? anoMin,
            [FromQuery] int? anoMax,
            [FromQuery] int? kmMax)
        {
            try
            {
                var query = _context.Veiculos.AsQueryable();
                if (!string.IsNullOrWhiteSpace(modelo)) query = query.Where(v => v.Modelo.Contains(modelo));
                if (fabricanteId.HasValue) query = query.Where(v => v.FabricanteId == fabricanteId.Value);
                if (anoMin.HasValue) query = query.Where(v => v.AnoFabricacao >= anoMin.Value);
                if (anoMax.HasValue) query = query.Where(v => v.AnoFabricacao <= anoMax.Value);
                if (kmMax.HasValue) query = query.Where(v => v.Quilometragem <= kmMax.Value);

                var veiculos = await query.OrderBy(v => v.Modelo).ToListAsync();
                return Ok(veiculos);
            }
            catch (Exception ex) { return StatusCode(500, $"Erro interno: {ex.Message}"); }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetVeiculo(int id)
        {
            try
            {
                var veiculo = await _context.Veiculos.FindAsync(id);
                if (veiculo == null) return NotFound("Veículo não encontrado.");
                return Ok(veiculo);
            }
            catch (Exception ex) { return StatusCode(500, $"Erro interno: {ex.Message}"); }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutVeiculo(int id, [FromBody] Veiculo veiculo)
        {
            if (id != veiculo.Id) return BadRequest("IDs divergentes.");
            try
            {
                if (!await _context.Veiculos.AnyAsync(v => v.Id == id)) return NotFound("Veículo não encontrado.");
                if (!await _context.Fabricantes.AnyAsync(f => f.Id == veiculo.FabricanteId)) return BadRequest("Fabricante não existe.");
                _context.Entry(veiculo).State = EntityState.Modified;
                await _context.SaveChangesAsync();
                return Ok("Veículo atualizado!");
            }
            catch (Exception ex) { return StatusCode(500, $"Erro interno: {ex.Message}"); }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteVeiculo(int id)
        {
            try
            {
                var veiculo = await _context.Veiculos.FindAsync(id);
                if (veiculo == null) return NotFound("Veículo não encontrado.");
                if (await _context.Alugueis.AnyAsync(a => a.VeiculoId == id))
                    return Conflict("Não é possível excluir: o veículo possui aluguéis registrados.");
                _context.Veiculos.Remove(veiculo);
                await _context.SaveChangesAsync();
                return Ok("Veículo removido!");
            }
            catch (Exception ex) { return StatusCode(500, $"Erro interno: {ex.Message}"); }
        }
    }
}
