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

        [HttpGet]
        public async Task<IActionResult> GetVeiculos()
        {
            try
            {
                var veiculos = await _context.Veiculos.ToListAsync();
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
                _context.Veiculos.Remove(veiculo);
                await _context.SaveChangesAsync();
                return Ok("Veículo removido!");
            }
            catch (Exception ex) { return StatusCode(500, $"Erro interno: {ex.Message}"); }
        }
    }
}
